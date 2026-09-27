"""Base abstractions for the summarization engine."""
from __future__ import annotations

from abc import ABC, abstractmethod

from ...models.schemas import SummaryContent, SummaryLength, SummaryMode

# Target sentence/item budgets per length setting. Used by BOTH the mock engine
# and the LLM prompt so that "length" genuinely shapes generation (not truncation).
LENGTH_BUDGET: dict[SummaryLength, dict[str, int]] = {
    SummaryLength.short: {"tldr_sents": 1, "findings": 3, "methods": 2, "limits": 2, "sentences": 3},
    SummaryLength.medium: {"tldr_sents": 2, "findings": 4, "methods": 3, "limits": 3, "sentences": 5},
    SummaryLength.detailed: {"tldr_sents": 3, "findings": 6, "methods": 5, "limits": 4, "sentences": 8},
}

LENGTH_WORDS: dict[SummaryLength, str] = {
    SummaryLength.short: "very concise (~60-90 words total)",
    SummaryLength.medium: "moderate (~120-180 words total)",
    SummaryLength.detailed: "thorough (~220-320 words total)",
}


class Summarizer(ABC):
    """A summarization engine (mock or LLM-backed)."""

    name: str = "base"

    @abstractmethod
    def summarize(
        self, source: str, mode: SummaryMode, length: SummaryLength
    ) -> tuple[SummaryContent, list[str]]:
        """Return (structured summary content, warnings)."""
        raise NotImplementedError
