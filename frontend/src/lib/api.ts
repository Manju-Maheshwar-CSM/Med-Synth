import type {
  BatchRowResult,
  CompareResponse,
  FeedbackSummary,
  Health,
  Paper,
  PubMedSearchItem,
  SummaryLength,
  SummaryMode,
  SummaryResult,
} from "@/types";

// Vite dev server proxies /api -> http://localhost:8000 (see vite.config.ts).
const BASE = import.meta.env.VITE_API_BASE ?? "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let resp: Response;
  try {
    resp = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(
      "Could not reach the MedSynth backend. Is it running on port 8000?",
      0,
    );
  }
  if (!resp.ok) {
    let detail = `Request failed (${resp.status}).`;
    try {
      const body = await resp.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore */
    }
    throw new ApiError(detail, resp.status);
  }
  return resp.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/api/health"),

  summarize: (
    abstract: string,
    mode: SummaryMode,
    length: SummaryLength,
    meta?: Partial<Paper>,
  ) =>
    request<SummaryResult>("/api/summarize", {
      method: "POST",
      body: JSON.stringify({
        paper: {
          abstract,
          title: meta?.title ?? null,
          authors: meta?.authors ?? [],
          journal: meta?.journal ?? "",
          publication_date: meta?.publication_date ?? "",
          pmid: meta?.pmid ?? "",
          source: meta?.source ?? "manual",
        },
        mode,
        length,
      }),
    }),

  summarizeBatch: (
    items: { name: string; abstract: string }[],
    mode: SummaryMode,
    length: SummaryLength,
  ) =>
    request<{
      rows: BatchRowResult[];
      total: number;
      succeeded: number;
      failed: number;
    }>("/api/summarize/batch", {
      method: "POST",
      body: JSON.stringify({ items, mode, length }),
    }),

  compare: (paperIds: string[], mode: SummaryMode, length: SummaryLength) =>
    request<CompareResponse>("/api/compare", {
      method: "POST",
      body: JSON.stringify({ paper_ids: paperIds, mode, length }),
    }),

  feedback: (payload: {
    summary_id?: string;
    paper_id?: string;
    overall: number;
    accuracy: number;
    relevance: number;
    completeness: number;
    comment?: string;
  }) =>
    request<FeedbackSummary>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  feedbackSummary: () => request<FeedbackSummary>("/api/feedback"),

  pubmedFetch: (pmid: string) =>
    request<Paper>(`/api/pubmed/${encodeURIComponent(pmid)}`),

  pubmedSearch: (q: string) =>
    request<{ results: PubMedSearchItem[] }>(
      `/api/pubmed/search?q=${encodeURIComponent(q)}`,
    ),

  uploadFiles: async (files: File[]): Promise<Paper[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    const resp = await fetch(`${BASE}/api/upload`, { method: "POST", body: form });
    if (!resp.ok) {
      let detail = "Upload failed.";
      try {
        const b = await resp.json();
        if (b?.detail) detail = b.detail;
      } catch {
        /* ignore */
      }
      throw new ApiError(detail, resp.status);
    }
    return resp.json();
  },
};
