"""High-level summarization service: engine selection + result assembly."""
from __future__ import annotations

import uuid

from ...config import get_settings
from ...models.schemas import (
    SummaryLength,
    SummaryMode,
    SummaryResult,
)
from ..extraction.faithfulness import compute_alignment
from .base import Summarizer
from .llm import LLMError, LLMProviderSummarizer
from .mock import MockSummarizer

_mock = MockSummarizer()


def get_summarizer() -> Summarizer:
    """Select the engine based on configuration (mock by default)."""
    settings = get_settings()
    if settings.effective_mode == "api":
        return LLMProviderSummarizer()
    return _mock


def summarize_text(
    source: str,
    mode: SummaryMode,
    length: SummaryLength,
    paper_id: str,
) -> SummaryResult:
    """Run summarization, compute the source-alignment heuristic, assemble result.

    On any LLM failure we transparently fall back to the offline mock engine and
    record a warning — the demo never hard-fails.
    """
    engine = get_summarizer()
    warnings: list[str] = []
    used_engine = engine.name

    try:
        content, warns = engine.summarize(source, mode, length)
        warnings.extend(warns)
    except LLMError as exc:
        content, warns = _mock.summarize(source, mode, length)
        warnings.extend(warns)
        warnings.append(
            f"Unable to reach the AI provider ({exc}). MedSynth switched to offline demo mode."
        )
        used_engine = "mock"

    alignment = compute_alignment(source, content)

    return SummaryResult(
        id=str(uuid.uuid4()),
        paper_id=paper_id,
        mode=mode,
        length=length,
        engine=used_engine,
        content=content,
        alignment=alignment,
        warnings=warnings,
    )
