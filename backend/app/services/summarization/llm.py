"""OpenAI-compatible LLM summarizer with JSON validation and graceful recovery."""
from __future__ import annotations

import json
import re

import httpx

from ...config import get_settings
from ...models.schemas import SummaryContent, SummaryLength, SummaryMode
from .base import Summarizer
from .prompts import SYSTEM_PROMPT, build_user_prompt


class LLMError(Exception):
    """Raised when the LLM provider is unreachable or returns unusable output."""


def _extract_json(raw: str) -> dict:
    """Best-effort recovery of a JSON object from a model response."""
    raw = raw.strip()
    # Strip markdown code fences if present.
    fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", raw, re.DOTALL)
    if fence:
        raw = fence.group(1)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass
    # Grab the outermost {...} block.
    start, end = raw.find("{"), raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        candidate = raw[start : end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            # Remove trailing commas — a common malformation.
            cleaned = re.sub(r",\s*([}\]])", r"\1", candidate)
            return json.loads(cleaned)
    raise LLMError("Model did not return valid JSON.")


def _prepare_source(source: str) -> tuple[str, list[str]]:
    """Apply section-preserving truncation for very long inputs.

    Strategy: keep the beginning (background/methods) and the end (results/
    conclusion), dropping only the middle, and warn the user. We never silently
    discard content.
    """
    s = get_settings()
    warnings: list[str] = []
    if len(source) <= s.llm_max_input_chars:
        return source, warnings
    head = int(s.llm_max_input_chars * 0.65)
    tail = s.llm_max_input_chars - head
    truncated = (
        source[:head]
        + "\n\n[... middle of source omitted to fit the model context window ...]\n\n"
        + source[-tail:]
    )
    warnings.append(
        "Source exceeded the model input limit; the middle was omitted while "
        "preserving the opening and closing sections. Consider splitting the paper."
    )
    return truncated, warnings


class LLMProviderSummarizer(Summarizer):
    name = "api"

    def summarize(self, source, mode, length):  # type: ignore[override]
        settings = get_settings()
        if not settings.llm_api_key:
            raise LLMError("No LLM API key configured.")

        prepared, warnings = _prepare_source(source)
        payload = {
            "model": settings.llm_model,
            "temperature": 0.1,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(prepared, mode, length)},
            ],
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {settings.llm_api_key}",
            "Content-Type": "application/json",
        }
        url = settings.llm_base_url.rstrip("/") + "/chat/completions"
        try:
            with httpx.Client(timeout=settings.llm_timeout) as client:
                resp = client.post(url, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise LLMError(f"Could not reach the AI provider: {exc}") from exc

        if resp.status_code == 401:
            raise LLMError("The AI provider rejected the API key (401).")
        if resp.status_code == 429:
            raise LLMError("The AI provider is rate-limiting requests (429). Try again shortly.")
        if resp.status_code >= 400:
            # Some providers reject response_format; retry once without it.
            if "response_format" in payload:
                payload.pop("response_format")
                try:
                    with httpx.Client(timeout=settings.llm_timeout) as client:
                        resp = client.post(url, json=payload, headers=headers)
                except httpx.HTTPError as exc:
                    raise LLMError(f"Could not reach the AI provider: {exc}") from exc
            if resp.status_code >= 400:
                raise LLMError(f"AI provider error ({resp.status_code}).")

        try:
            data = resp.json()
            raw = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, ValueError) as exc:
            raise LLMError("Unexpected response shape from AI provider.") from exc

        parsed = _extract_json(raw)
        try:
            content = SummaryContent(**parsed)
        except Exception as exc:  # pydantic ValidationError
            # Partial recovery: keep only known fields.
            allowed = {k: parsed[k] for k in SummaryContent.model_fields if k in parsed}
            try:
                content = SummaryContent(**allowed)
                warnings.append("Some model fields were malformed and were dropped safely.")
            except Exception:
                raise LLMError("The AI response did not match the expected schema.") from exc
        return content, warnings
