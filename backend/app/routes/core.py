"""Comparison, PubMed, feedback, and health endpoints."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ..config import get_settings
from ..models.api import (
    CompareRequest,
    CompareResponse,
    FeedbackRequest,
    FeedbackSummary,
    HealthResponse,
)
from ..models.schemas import Paper
from ..services.comparison import compare_papers
from ..services.pubmed import PubMedError, fetch_pmid, search
from ..services.store import store

router = APIRouter(prefix="/api", tags=["core"])


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    s = get_settings()
    mode = s.effective_mode
    return HealthResponse(
        status="ok",
        mode=mode,
        model=s.llm_model if mode == "api" else "deterministic-mock",
    )


@router.post("/compare", response_model=CompareResponse)
def compare(req: CompareRequest) -> CompareResponse:
    papers: list[Paper] = []
    for pid in req.paper_ids:
        p = store.get_paper(pid)
        if not p:
            raise HTTPException(status_code=404, detail=f"Paper {pid} not found.")
        papers.append(p)
    if len(papers) < 2:
        raise HTTPException(status_code=422, detail="Select at least two papers to compare.")
    return compare_papers(papers, req.mode, req.length)


@router.post("/feedback", response_model=FeedbackSummary)
def feedback(req: FeedbackRequest) -> FeedbackSummary:
    store.add_feedback(req)
    return store.feedback_summary()


@router.get("/feedback", response_model=FeedbackSummary)
def feedback_summary() -> FeedbackSummary:
    return store.feedback_summary()


@router.get("/stats")
def stats() -> dict:
    return store.stats()


@router.get("/pubmed/search")
def pubmed_search(q: str = Query(..., min_length=2), retmax: int = 10) -> dict:
    try:
        return {"results": search(q, retmax=retmax)}
    except PubMedError as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@router.get("/pubmed/{pmid}", response_model=Paper)
def pubmed_fetch(pmid: str) -> Paper:
    try:
        paper = fetch_pmid(pmid)
    except PubMedError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return store.add_paper(paper)
