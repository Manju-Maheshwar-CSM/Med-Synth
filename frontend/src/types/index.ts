// Types mirroring the MedSynth backend schemas.

export type SummaryMode = "concise" | "structured" | "clinician" | "researcher";
export type SummaryLength = "short" | "medium" | "detailed";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  publication_date: string;
  pmid: string;
  abstract: string;
  source: string;
}

export interface SourceAlignment {
  score: number;
  band: "High" | "Moderate" | "Low";
  numeric_overlap: number;
  term_overlap: number;
  coverage: number;
  unsupported_numbers: string[];
  signals: string[];
}

export interface SummaryContent {
  title: string;
  tldr: string;
  background: string;
  research_question: string;
  study_type: string;
  population: string;
  methods: string[];
  key_findings: string[];
  conclusion: string;
  limitations: string[];
  clinical_relevance: string;
  keywords: string[];
  source_facts: string[];
  interpretations: string[];
  quality_notes: string[];
  important_terms: string[];
}

export interface SummaryResult {
  id: string;
  paper_id: string;
  mode: SummaryMode;
  length: SummaryLength;
  engine: string;
  content: SummaryContent;
  alignment: SourceAlignment;
  warnings: string[];
  created_at: string;
}

export interface BatchRowResult {
  name: string;
  status: "ok" | "error";
  paper_id: string;
  result: SummaryResult | null;
  error: string;
}

export interface ComparisonRow {
  dimension: string;
  values: Record<string, string>;
}

export interface CompareResponse {
  papers: Paper[];
  matrix: ComparisonRow[];
  common_findings: string[];
  differences: string[];
  conflicting_findings: string[];
  research_gaps: string[];
  engine: string;
}

export interface FeedbackSummary {
  count: number;
  avg_overall: number;
  avg_accuracy: number;
  avg_relevance: number;
  avg_completeness: number;
}

export interface Health {
  status: string;
  mode: string;
  model: string;
  version: string;
}

export interface PubMedSearchItem {
  pmid: string;
  title: string;
  journal: string;
  pubdate: string;
  authors: string;
}

// A locally-tracked record combining a paper with its latest summary + feedback.
export interface StoredPaper {
  paper: Paper;
  summary?: SummaryResult;
  rating?: number;
  addedAt: number;
}
