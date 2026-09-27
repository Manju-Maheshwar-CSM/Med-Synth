"""Pydantic schemas shared across the MedSynth backend."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SummaryMode(str, Enum):
    concise = "concise"
    structured = "structured"
    clinician = "clinician"
    researcher = "researcher"


class SummaryLength(str, Enum):
    short = "short"
    medium = "medium"
    detailed = "detailed"


class Paper(BaseModel):
    """Normalized internal representation of a paper / abstract."""

    id: str
    title: str = "Untitled abstract"
    authors: list[str] = Field(default_factory=list)
    journal: str = ""
    publication_date: str = ""
    pmid: str = ""
    abstract: str = ""
    source: str = "manual"  # manual | upload | pubmed


class SourceAlignment(BaseModel):
    """Transparent, heuristic source-alignment indicator (NOT a medical accuracy score)."""

    score: int = Field(ge=0, le=100)
    band: str  # "High" | "Moderate" | "Low"
    numeric_overlap: float = 0.0
    term_overlap: float = 0.0
    coverage: float = 0.0
    unsupported_numbers: list[str] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)


class SummaryContent(BaseModel):
    """The structured summary payload — mirrors the LLM JSON contract."""

    title: str = ""
    tldr: str = ""
    background: str = ""
    research_question: str = ""
    study_type: str = ""
    population: str = ""
    methods: list[str] = Field(default_factory=list)
    key_findings: list[str] = Field(default_factory=list)
    conclusion: str = ""
    limitations: list[str] = Field(default_factory=list)
    clinical_relevance: str = ""
    keywords: list[str] = Field(default_factory=list)
    source_facts: list[str] = Field(default_factory=list)
    interpretations: list[str] = Field(default_factory=list)
    quality_notes: list[str] = Field(default_factory=list)
    important_terms: list[str] = Field(default_factory=list)


class SummaryResult(BaseModel):
    """Full result returned to the client."""

    id: str
    paper_id: str
    mode: SummaryMode
    length: SummaryLength
    engine: str  # "mock" | "api"
    content: SummaryContent
    alignment: SourceAlignment
    warnings: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
