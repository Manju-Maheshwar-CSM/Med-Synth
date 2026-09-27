import type { StoredPaper, SummaryResult } from "@/types";

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function summaryToMarkdown(r: SummaryResult, title?: string): string {
  const c = r.content;
  const lines: string[] = [];
  lines.push(`# ${title || c.title || "MedSynth Summary"}`);
  lines.push("");
  lines.push(
    `> Mode: **${r.mode}** · Length: **${r.length}** · Engine: **${r.engine}** · Source Alignment: **${r.alignment.score}% (${r.alignment.band})**`,
  );
  lines.push("");
  const sec = (h: string, body?: string) => {
    if (body && body.trim()) {
      lines.push(`## ${h}`, body.trim(), "");
    }
  };
  const list = (h: string, items: string[]) => {
    const clean = items.filter((x) => x && x.trim());
    if (clean.length) {
      lines.push(`## ${h}`);
      clean.forEach((i) => lines.push(`- ${i}`));
      lines.push("");
    }
  };
  sec("TL;DR", c.tldr);
  sec("Background", c.background);
  sec("Research Question", c.research_question);
  sec("Study Type", c.study_type);
  sec("Population", c.population);
  list("Methods", c.methods);
  list("Key Findings", c.key_findings);
  sec("Conclusion", c.conclusion);
  list("Limitations", c.limitations);
  sec("Clinical Relevance", c.clinical_relevance);
  list("Important Terms", c.important_terms);
  list("Source-Derived Facts", c.source_facts);
  list("AI Interpretation", c.interpretations);
  list("Quality Notes", c.quality_notes);
  lines.push("---");
  lines.push(
    "_Source Alignment is a heuristic indicator, not a validated medical accuracy score._",
  );
  lines.push(
    "_MedSynth summarizes scientific literature and is not a substitute for professional medical judgment or clinical advice._",
  );
  return lines.join("\n");
}

export function summaryToText(r: SummaryResult, title?: string): string {
  return summaryToMarkdown(r, title)
    .replace(/^#+\s/gm, "")
    .replace(/[*_>]/g, "")
    .replace(/^-\s/gm, "• ");
}

function csvEscape(v: string): string {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

export function storedPapersToCSV(items: StoredPaper[]): string {
  const header = [
    "name",
    "study_type",
    "tldr",
    "key_findings",
    "conclusion",
    "source_alignment",
    "alignment_band",
    "engine",
    "important_terms",
  ];
  const rows = items.map((it) => {
    const c = it.summary?.content;
    return [
      it.paper.title,
      c?.study_type ?? "",
      c?.tldr ?? "",
      (c?.key_findings ?? []).join(" | "),
      c?.conclusion ?? "",
      it.summary ? String(it.summary.alignment.score) : "",
      it.summary?.alignment.band ?? "",
      it.summary?.engine ?? "",
      (c?.important_terms ?? []).join("; "),
    ]
      .map((x) => csvEscape(String(x)))
      .join(",");
  });
  return [header.map(csvEscape).join(","), ...rows].join("\n");
}

export function storedPapersToJSON(items: StoredPaper[]): string {
  return JSON.stringify(
    items.map((it) => ({
      paper: it.paper,
      summary: it.summary ?? null,
      rating: it.rating ?? null,
    })),
    null,
    2,
  );
}

export function storedPapersToMarkdown(items: StoredPaper[]): string {
  return items
    .filter((it) => it.summary)
    .map((it) => summaryToMarkdown(it.summary!, it.paper.title))
    .join("\n\n<div style='page-break-after: always'></div>\n\n");
}
