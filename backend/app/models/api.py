"""Request / response models for the API routes."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from .schemas import Paper, SummaryLength, SummaryMode, SummaryResult


class PaperInput(BaseModel):
    title: Optional[str] = None
    authors: list[str] = Field(default_factory=list)
    journal: str = ""
    publication_date: str = ""
    pmid: str = ""
    abstract: str = Field(..., min_length=1)
    source: str = "manual"


class SummarizeRequest(BaseModel):
    paper: PaperInput
    mode: SummaryMode = SummaryMode.structured
    length: SummaryLength = SummaryLength.medium


class BatchItem(BaseModel):
    name: str = ""
    abstract: str = Field(..., min_length=1)


class BatchSummarizeRequest(BaseModel):
    items: list[BatchItem]
    mode: SummaryMode = SummaryMode.structured
    length: SummaryLength = SummaryLength.medium


class BatchRowResult(BaseModel):
    name: str
    status: str  # "ok" | "error"
    paper_id: str = ""
    result: Optional[SummaryResult] = None
    error: str = ""


class BatchSummarizeResponse(BaseModel):
    rows: list[BatchRowResult]
    total: int
    succeeded: int
    failed: int


class CompareRequest(BaseModel):
    paper_ids: list[str] = Field(..., min_length=2, max_length=5)
    mode: SummaryMode = SummaryMode.researcher
    length: SummaryLength = SummaryLength.medium


class ComparisonRow(BaseModel):
    dimension: str
    values: dict[str, str]  # paper_id -> value


class CompareResponse(BaseModel):
    papers: list[Paper]
    matrix: list[ComparisonRow]
    common_findings: list[str] = Field(default_factory=list)
    differences: list[str] = Field(default_factory=list)
    conflicting_findings: list[str] = Field(default_factory=list)
    research_gaps: list[str] = Field(default_factory=list)
    engine: str = "mock"


class FeedbackRequest(BaseModel):
    summary_id: str = ""
    paper_id: str = ""
    overall: int = Field(ge=1, le=5)
    accuracy: int = Field(ge=1, le=5)
    relevance: int = Field(ge=1, le=5)
    completeness: int = Field(ge=1, le=5)
    comment: str = ""


class FeedbackSummary(BaseModel):
    count: int
    avg_overall: float
    avg_accuracy: float
    avg_relevance: float
    avg_completeness: float


class HealthResponse(BaseModel):
    status: str
    mode: str
    model: str = ""
    version: str = "1.0.0"
