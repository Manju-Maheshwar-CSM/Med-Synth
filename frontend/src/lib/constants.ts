import type { SummaryLength, SummaryMode } from "@/types";
import {
  FileText,
  Layers,
  Stethoscope,
  Microscope,
  type LucideIcon,
} from "lucide-react";

export const TAGLINE = "From Medical Literature to Meaning.";

export const DISCLAIMER =
  "MedSynth summarizes scientific literature and is not a substitute for professional medical judgment or clinical advice.";

export const ALIGNMENT_NOTE =
  "This is a heuristic source-alignment indicator, not a validated medical accuracy score.";

export interface ModeMeta {
  id: SummaryMode;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const MODES: ModeMeta[] = [
  {
    id: "concise",
    label: "Concise",
    description: "A 2–3 sentence TL;DR: what was studied, found, and concluded.",
    icon: FileText,
  },
  {
    id: "structured",
    label: "Structured",
    description: "Background, question, methods, population, findings, conclusion, limitations.",
    icon: Layers,
  },
  {
    id: "clinician",
    label: "Clinician",
    description: "Population, intervention, comparator, outcomes & practical implications.",
    icon: Stethoscope,
  },
  {
    id: "researcher",
    label: "Researcher",
    description: "Design, methodology, statistics, limitations & research gaps.",
    icon: Microscope,
  },
];

export const LENGTHS: { id: SummaryLength; label: string; hint: string }[] = [
  { id: "short", label: "Short", hint: "~60–90 words" },
  { id: "medium", label: "Medium", hint: "~120–180 words" },
  { id: "detailed", label: "Detailed", hint: "~220–320 words" },
];

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/summarize", label: "Summarize" },
  { to: "/literature", label: "Literature" },
  { to: "/compare", label: "Compare" },
  { to: "/quality", label: "Quality" },
];
