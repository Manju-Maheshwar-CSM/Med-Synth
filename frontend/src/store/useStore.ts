import { create } from "zustand";
import type {
  FeedbackSummary,
  Health,
  Paper,
  StoredPaper,
  SummaryResult,
} from "@/types";

type Theme = "light" | "dark";

interface AppState {
  theme: Theme;
  toggleTheme: () => void;

  health: Health | null;
  healthError: boolean;
  setHealth: (h: Health | null, error: boolean) => void;

  papers: StoredPaper[];
  addPaper: (paper: Paper) => void;
  addPapers: (papers: Paper[]) => void;
  removePaper: (id: string) => void;
  upsertSummary: (result: SummaryResult) => void;
  setRating: (paperId: string, rating: number) => void;
  clearPapers: () => void;

  compareSelection: string[];
  toggleCompare: (id: string) => void;
  clearCompare: () => void;

  feedback: FeedbackSummary | null;
  setFeedback: (f: FeedbackSummary) => void;
}

const initialTheme: Theme =
  (localStorage.getItem("medsynth-theme") as Theme) ||
  (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  localStorage.setItem("medsynth-theme", theme);
}
applyTheme(initialTheme);

export const useStore = create<AppState>((set, get) => ({
  theme: initialTheme,
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  health: null,
  healthError: false,
  setHealth: (h, error) => set({ health: h, healthError: error }),

  papers: [],
  addPaper: (paper) =>
    set((s) => {
      if (s.papers.some((p) => p.paper.id === paper.id)) return s;
      return { papers: [{ paper, addedAt: Date.now() }, ...s.papers] };
    }),
  addPapers: (papers) =>
    set((s) => {
      const existing = new Set(s.papers.map((p) => p.paper.id));
      const fresh = papers
        .filter((p) => !existing.has(p.id))
        .map((paper) => ({ paper, addedAt: Date.now() }));
      return { papers: [...fresh, ...s.papers] };
    }),
  removePaper: (id) =>
    set((s) => ({
      papers: s.papers.filter((p) => p.paper.id !== id),
      compareSelection: s.compareSelection.filter((c) => c !== id),
    })),
  upsertSummary: (result) =>
    set((s) => {
      const idx = s.papers.findIndex((p) => p.paper.id === result.paper_id);
      if (idx === -1) return s;
      const papers = [...s.papers];
      papers[idx] = { ...papers[idx], summary: result };
      return { papers };
    }),
  setRating: (paperId, rating) =>
    set((s) => {
      const papers = s.papers.map((p) =>
        p.paper.id === paperId ? { ...p, rating } : p,
      );
      return { papers };
    }),
  clearPapers: () => set({ papers: [], compareSelection: [] }),

  compareSelection: [],
  toggleCompare: (id) =>
    set((s) => {
      if (s.compareSelection.includes(id)) {
        return { compareSelection: s.compareSelection.filter((c) => c !== id) };
      }
      if (s.compareSelection.length >= 5) return s;
      return { compareSelection: [...s.compareSelection, id] };
    }),
  clearCompare: () => set({ compareSelection: [] }),

  feedback: null,
  setFeedback: (f) => set({ feedback: f }),
}));
