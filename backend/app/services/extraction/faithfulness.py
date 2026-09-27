"""Transparent, heuristic *source-alignment* indicator.

IMPORTANT: This is NOT a clinically validated accuracy score. It measures how
well the generated summary is grounded in the source text using simple,
explainable overlap signals.
"""
from __future__ import annotations

from ...models.schemas import SourceAlignment, SummaryContent
from . import text as T


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def _coverage(summary_terms: set[str], source_terms: set[str]) -> float:
    """Fraction of summary content grounded in the source (precision-style)."""
    if not summary_terms:
        return 0.0
    return len(summary_terms & source_terms) / len(summary_terms)


def compute_alignment(source: str, content: SummaryContent) -> SourceAlignment:
    """Compare a generated summary against its source text."""
    summary_text = " ".join(
        [
            content.tldr, content.background, content.research_question,
            content.study_type, content.population, content.conclusion,
            content.clinical_relevance,
            *content.methods, *content.key_findings, *content.limitations,
            *content.source_facts,
        ]
    )

    src_nums = T.numeric_key_set(source)
    sum_nums = T.numeric_key_set(summary_text)
    # Numbers in the summary that do NOT appear in the source = potential fabrication.
    unsupported = sorted(sum_nums - src_nums)
    if sum_nums:
        numeric_overlap = len(sum_nums & src_nums) / len(sum_nums)
    else:
        numeric_overlap = 1.0  # no numbers claimed → nothing to contradict

    src_terms = set(t.lower() for t in T.extract_terms(source, limit=50))
    sum_terms = set(t.lower() for t in T.extract_terms(summary_text, limit=50))
    term_overlap = _jaccard(sum_terms, src_terms)

    src_words = set(w for w in T._tokenize(source) if w not in T._STOPWORDS and len(w) > 3)
    sum_words = set(w for w in T._tokenize(summary_text) if w not in T._STOPWORDS and len(w) > 3)
    coverage = _coverage(sum_words, src_words)

    # Weighted blend — numeric grounding weighted highest for medical faithfulness.
    raw = 0.45 * numeric_overlap + 0.30 * coverage + 0.25 * (term_overlap if src_terms else coverage)
    # Penalise each unsupported number.
    raw -= 0.06 * len(unsupported)
    score = max(0, min(100, round(raw * 100)))

    if score >= 80:
        band = "High"
    elif score >= 60:
        band = "Moderate"
    else:
        band = "Low"

    signals = [
        f"Numeric grounding: {round(numeric_overlap * 100)}% of summary figures found in source",
        f"Terminology overlap: {round(term_overlap * 100)}%",
        f"Lexical coverage: {round(coverage * 100)}%",
    ]
    if unsupported:
        signals.append(
            f"{len(unsupported)} figure(s) in the summary were not located verbatim in the source"
        )

    return SourceAlignment(
        score=score,
        band=band,
        numeric_overlap=round(numeric_overlap, 3),
        term_overlap=round(term_overlap, 3),
        coverage=round(coverage, 3),
        unsupported_numbers=unsupported[:10],
        signals=signals,
    )
