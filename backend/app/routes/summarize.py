"""Summarization endpoints (single + batch)."""
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException

from ..models.api import (
    BatchRowResult,
    BatchSummarizeRequest,
    BatchSummarizeResponse,
    SummarizeRequest,
)
from ..models.schemas import Paper, SummaryResult
from ..services.store import store
from ..services.summarization.service import summarize_text
from ..utils.text import validate_abstract

router = APIRouter(prefix="/api", tags=["summarize"])


def _persist_paper(req_paper) -> Paper:
    paper = Paper(
        id=str(uuid.uuid4()),
        title=req_paper.title or "Untitled abstract",
        authors=req_paper.authors,
        journal=req_paper.journal,
        publication_date=req_paper.publication_date,
        pmid=req_paper.pmid,
        abstract=req_paper.abstract.strip(),
        source=req_paper.source,
    )
    return store.add_paper(paper)


@router.post("/summarize", response_model=SummaryResult)
def summarize(req: SummarizeRequest) -> SummaryResult:
    ok, msg = validate_abstract(req.paper.abstract)
    if not ok:
        raise HTTPException(status_code=422, detail=msg)
    paper = _persist_paper(req.paper)
    result = summarize_text(paper.abstract, req.mode, req.length, paper.id)
    store.set_summary(result)
    return result


@router.post("/summarize/batch", response_model=BatchSummarizeResponse)
def summarize_batch(req: BatchSummarizeRequest) -> BatchSummarizeResponse:
    rows: list[BatchRowResult] = []
    succeeded = 0
    for idx, item in enumerate(req.items):
        name = item.name or f"Paper {idx + 1}"
        ok, msg = validate_abstract(item.abstract)
        if not ok:
            rows.append(BatchRowResult(name=name, status="error", error=msg))
            continue
        try:
            paper = store.add_paper(Paper(
                id=str(uuid.uuid4()), title=name, abstract=item.abstract.strip(),
                source="upload",
            ))
            result = summarize_text(paper.abstract, req.mode, req.length, paper.id)
            store.set_summary(result)
            rows.append(BatchRowResult(
                name=name, status="ok", paper_id=paper.id, result=result))
            succeeded += 1
        except Exception as exc:  # isolate failures per paper
            rows.append(BatchRowResult(name=name, status="error", error=str(exc)))
    return BatchSummarizeResponse(
        rows=rows, total=len(req.items), succeeded=succeeded,
        failed=len(req.items) - succeeded,
    )
