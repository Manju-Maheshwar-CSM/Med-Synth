"""Neutral multi-paper comparison built on top of the summarization engine."""
from __future__ import annotations

from collections import Counter

from ..models.api import ComparisonRow, CompareResponse
from ..models.schemas import Paper, SummaryLength, SummaryMode
from .extraction import text as T
from .summarization.service import get_summarizer

_POSITIVE = ("increase", "increased", "higher", "improve", "improved", "benefit",
             "effective", "reduction", "reduced", "lower", "significant")
_NEGATIVE = ("no significant", "not significant", "no difference", "no benefit",
             "ineffective", "did not", "no effect", "failed", "no association")


def _short(text: str, words: int = 32) -> str:
    if not text:
        return "Not stated in the provided abstract."
    parts = text.split()
    return text if len(parts) <= words else " ".join(parts[:words]).rstrip(",.;") + "…"


def compare_papers(papers: list[Paper], mode: SummaryMode, length: SummaryLength) -> CompareResponse:
    engine = get_summarizer()
    labels: dict[str, str] = {}
    summaries: dict[str, object] = {}
    engine_name = engine.name

    for i, p in enumerate(papers):
        labels[p.id] = p.title[:60] if p.title and p.title != "Untitled abstract" else f"Study {chr(65 + i)}"
        try:
            content, _ = engine.summarize(p.abstract, SummaryMode.structured, length)
        except Exception:
            from .summarization.mock import MockSummarizer
            content, _ = MockSummarizer().summarize(p.abstract, SummaryMode.structured, length)
            engine_name = "mock"
        summaries[p.id] = content

    dimensions = [
        ("Research Question", lambda c: _short(c.research_question)),
        ("Study Type", lambda c: c.study_type or "Not stated in the provided abstract."),
        ("Population", lambda c: _short(c.population)),
        ("Methods", lambda c: _short(" ".join(c.methods))),
        ("Key Findings", lambda c: _short(" ".join(c.key_findings), 45)),
        ("Conclusion", lambda c: _short(c.conclusion)),
        ("Limitations", lambda c: _short(" ".join(c.limitations))),
    ]
    matrix: list[ComparisonRow] = []
    for dim, fn in dimensions:
        values = {pid: fn(summaries[pid]) for pid in labels}  # type: ignore[arg-type]
        matrix.append(ComparisonRow(dimension=dim, values=values))

    # Common findings: medical terms shared across ALL papers.
    term_sets = [set(t.lower() for t in T.extract_terms(p.abstract, 40)) for p in papers]
    common_terms = set.intersection(*term_sets) if term_sets else set()
    common_findings = [
        f"All {len(papers)} studies reference: " + ", ".join(sorted(common_terms)[:8])
    ] if common_terms else []

    # Differences: study types / populations that diverge.
    differences: list[str] = []
    study_types = {labels[p.id]: (summaries[p.id].study_type or "unspecified") for p in papers}  # type: ignore[union-attr]
    if len(set(study_types.values())) > 1:
        differences.append(
            "The studies differed in design: "
            + "; ".join(f"{lbl} — {st}" for lbl, st in study_types.items())
        )
    all_terms = Counter(t for ts in term_sets for t in ts)
    unique_terms = [t for t, cnt in all_terms.items() if cnt == 1]
    if unique_terms:
        differences.append("Topics unique to a single study: " + ", ".join(sorted(unique_terms)[:8]))

    # Conflicting findings: opposite directional language across papers (neutral phrasing).
    conflicting: list[str] = []
    directions: dict[str, str] = {}
    for p in papers:
        blob = " ".join(summaries[p.id].key_findings).lower() + " " + summaries[p.id].conclusion.lower()  # type: ignore[union-attr]
        pos = any(w in blob for w in _POSITIVE)
        neg = any(w in blob for w in _NEGATIVE)
        if neg and not pos:
            directions[labels[p.id]] = "reported no significant / negative effect"
        elif pos and not neg:
            directions[labels[p.id]] = "reported a positive / significant effect"
    if len(set(directions.values())) > 1:
        conflicting.append(
            "Potentially divergent directions of effect: "
            + "; ".join(f"{lbl} {d}" for lbl, d in directions.items())
            + " — review the source abstracts to confirm; MedSynth does not adjudicate which is correct."
        )

    # Research gaps: aggregate stated limitations + uncertainty.
    gaps: list[str] = []
    for p in papers:
        lims = [l for l in summaries[p.id].limitations if l and "Not stated" not in l]  # type: ignore[union-attr]
        if lims:
            gaps.append(f"{labels[p.id]}: {_short(lims[0])}")
    if not gaps:
        gaps.append("No explicit limitations were stated across the provided abstracts.")

    return CompareResponse(
        papers=papers,
        matrix=matrix,
        common_findings=common_findings,
        differences=differences or ["No major structural differences detected across the abstracts."],
        conflicting_findings=conflicting or ["No clearly conflicting directions of effect were detected."],
        research_gaps=gaps,
        engine=engine_name,
    )
