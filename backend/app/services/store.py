"""In-memory, session-scoped storage. No database; nothing is persisted to disk.

Deliberately simple: this app must not store patient data or secrets. All state
lives in process memory and is lost on restart.
"""
from __future__ import annotations

import threading

from ..models.api import FeedbackRequest, FeedbackSummary
from ..models.schemas import Paper, SummaryResult


class MemoryStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._papers: dict[str, Paper] = {}
        self._summaries: dict[str, SummaryResult] = {}  # paper_id -> latest summary
        self._feedback: list[FeedbackRequest] = []

    # ── papers ──────────────────────────────────────────────────────
    def add_paper(self, paper: Paper) -> Paper:
        with self._lock:
            self._papers[paper.id] = paper
        return paper

    def get_paper(self, paper_id: str) -> Paper | None:
        return self._papers.get(paper_id)

    def list_papers(self) -> list[Paper]:
        return list(self._papers.values())

    def delete_paper(self, paper_id: str) -> bool:
        with self._lock:
            existed = self._papers.pop(paper_id, None) is not None
            self._summaries.pop(paper_id, None)
        return existed

    # ── summaries ───────────────────────────────────────────────────
    def set_summary(self, result: SummaryResult) -> None:
        with self._lock:
            self._summaries[result.paper_id] = result

    def get_summary(self, paper_id: str) -> SummaryResult | None:
        return self._summaries.get(paper_id)

    # ── feedback ────────────────────────────────────────────────────
    def add_feedback(self, fb: FeedbackRequest) -> None:
        with self._lock:
            self._feedback.append(fb)

    def feedback_summary(self) -> FeedbackSummary:
        fb = self._feedback
        n = len(fb)
        if n == 0:
            return FeedbackSummary(count=0, avg_overall=0, avg_accuracy=0,
                                   avg_relevance=0, avg_completeness=0)
        return FeedbackSummary(
            count=n,
            avg_overall=round(sum(f.overall for f in fb) / n, 2),
            avg_accuracy=round(sum(f.accuracy for f in fb) / n, 2),
            avg_relevance=round(sum(f.relevance for f in fb) / n, 2),
            avg_completeness=round(sum(f.completeness for f in fb) / n, 2),
        )

    def stats(self) -> dict[str, float | int]:
        summaries = list(self._summaries.values())
        avg_align = (
            round(sum(s.alignment.score for s in summaries) / len(summaries))
            if summaries else 0
        )
        return {
            "papers": len(self._papers),
            "summaries": len(summaries),
            "avg_alignment": avg_align,
            "feedback_count": len(self._feedback),
        }


store = MemoryStore()
