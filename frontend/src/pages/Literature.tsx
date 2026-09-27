import { useRef, useState } from "react";
import {
  Library,
  Upload,
  Sparkles,
  Play,
  Loader2,
  Trash2,
  Plus,
  FileJson,
  FileText,
  Table as TableIcon,
  GitCompareArrows,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { Paper, SummaryLength, SummaryMode } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { ModeSelector } from "@/components/summary/ModeSelector";
import { LengthSelector } from "@/components/summary/LengthSelector";
import { AlignmentBadge } from "@/components/summary/AlignmentBadge";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { SAMPLES } from "@/data/samples";
import {
  downloadFile,
  storedPapersToCSV,
  storedPapersToJSON,
  storedPapersToMarkdown,
} from "@/lib/export";

interface QueueItem {
  name: string;
  abstract: string;
}

export function Literature() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [mode, setMode] = useState<SummaryMode>("structured");
  const [length, setLength] = useState<SummaryLength>("short");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const papers = useStore((s) => s.papers);
  const addPaper = useStore((s) => s.addPaper);
  const upsertSummary = useStore((s) => s.upsertSummary);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const compareSelection = useStore((s) => s.compareSelection);
  const removePaper = useStore((s) => s.removePaper);

  const summarized = papers.filter((p) => p.summary);

  const loadSamples = () => {
    setQueue((q) => {
      const names = new Set(q.map((i) => i.name));
      const add = SAMPLES.filter((s) => !names.has(s.title)).map((s) => ({
        name: s.title,
        abstract: s.text,
      }));
      return [...q, ...add];
    });
    toast.info("Demo abstracts added to the queue");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const txt = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".txt"));
    if (!txt.length) {
      toast.error("Only .txt files are supported.");
      return;
    }
    const items = await Promise.all(
      txt.map(
        (f) =>
          new Promise<QueueItem>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ name: f.name.replace(/\.txt$/i, ""), abstract: String(reader.result ?? "") });
            reader.readAsText(f);
          }),
      ),
    );
    setQueue((q) => [...q, ...items]);
    toast.info(`${items.length} file(s) added to the queue`);
  };

  const processAll = async () => {
    const items = queue.filter((i) => i.abstract.trim().length >= 40);
    if (!items.length) {
      toast.error("Add at least one abstract (40+ characters).");
      return;
    }
    setProgress({ done: 0, total: items.length });
    try {
      const res = await api.summarizeBatch(items, mode, length);
      let ok = 0;
      for (const row of res.rows) {
        if (row.status === "ok" && row.result) {
          ok++;
          const src = items.find((i) => i.name === row.name);
          const paper: Paper = {
            id: row.result.paper_id,
            title: row.name || row.result.content.title || "Untitled",
            authors: [],
            journal: "",
            publication_date: "",
            pmid: "",
            abstract: src?.abstract ?? "",
            source: "batch",
          };
          addPaper(paper);
          upsertSummary(row.result);
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      setQueue([]);
      toast.success(`Processed ${ok}/${res.total} · ${res.failed} failed`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Batch processing failed.");
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Literature"
        subtitle="Batch-process multiple abstracts and export a structured comparison table."
        actions={
          summarized.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "medsynth-library.csv",
                    storedPapersToCSV(summarized),
                    "text/csv",
                  )
                }
              >
                <TableIcon className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "medsynth-library.json",
                    storedPapersToJSON(summarized),
                    "application/json",
                  )
                }
              >
                <FileJson className="h-3.5 w-3.5" /> JSON
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "medsynth-library.md",
                    storedPapersToMarkdown(summarized),
                    "text/markdown",
                  )
                }
              >
                <FileText className="h-3.5 w-3.5" /> Markdown
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Batch builder */}
      <Card className="mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Library className="h-4 w-4 text-primary" /> Batch queue
            {queue.length > 0 && <Badge variant="primary">{queue.length}</Badge>}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="subtle" onClick={loadSamples}>
              <Sparkles className="h-3.5 w-3.5" /> Add demo set
            </Button>
            <Button size="sm" variant="subtle" onClick={() => fileRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Add .txt files
            </Button>
            <Button
              size="sm"
              variant="subtle"
              onClick={() => setQueue((q) => [...q, { name: `Abstract ${q.length + 1}`, abstract: "" }])}
            >
              <Plus className="h-3.5 w-3.5" /> Add blank
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
          </div>
        </div>

        {queue.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Queue is empty. Add the demo set, upload .txt files, or add a blank row.
          </p>
        ) : (
          <div className="space-y-3">
            {queue.map((item, i) => (
              <div key={i} className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    value={item.name}
                    onChange={(e) =>
                      setQueue((q) =>
                        q.map((it, j) => (j === i ? { ...it, name: e.target.value } : it)),
                      )
                    }
                    className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    onClick={() => setQueue((q) => q.filter((_, j) => j !== i))}
                    className="text-muted-foreground hover:text-danger"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={item.abstract}
                  onChange={(e) =>
                    setQueue((q) =>
                      q.map((it, j) => (j === i ? { ...it, abstract: e.target.value } : it)),
                    )
                  }
                  rows={3}
                  placeholder="Paste abstract text…"
                  className="w-full resize-y rounded-lg border border-border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ModeSelector value={mode} onChange={setMode} />
          <LengthSelector value={length} onChange={setLength} />
        </div>

        {progress && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Processing…</span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={processAll}
          disabled={!!progress || queue.length === 0}
        >
          {progress ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Processing…
            </>
          ) : (
            <>
              <Play className="h-5 w-5" /> Process all
            </>
          )}
        </Button>
      </Card>

      {/* Results table */}
      {summarized.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No processed papers yet"
          description="Add abstracts to the queue above and run Process All to build your literature table."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Paper</th>
                  <th className="px-4 py-3 font-medium">Study type</th>
                  <th className="px-4 py-3 font-medium">Key finding</th>
                  <th className="px-4 py-3 font-medium">Alignment</th>
                  <th className="px-4 py-3 font-medium">Compare</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summarized.map((p) => (
                  <tr key={p.paper.id} className="align-top">
                    <td className="max-w-xs px-4 py-3">
                      <p className="font-medium leading-snug">{p.paper.title}</p>
                      <p className="text-xs text-muted-foreground">{p.paper.source}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="accent">{p.summary!.content.study_type}</Badge>
                    </td>
                    <td className="max-w-sm px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                      {p.summary!.content.key_findings[0] ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <AlignmentBadge alignment={p.summary!.alignment} compact />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={compareSelection.includes(p.paper.id)}
                        onChange={() => toggleCompare(p.paper.id)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                        aria-label={`Select ${p.paper.title} for comparison`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removePaper(p.paper.id)}
                        className="text-muted-foreground hover:text-danger"
                        aria-label="Remove paper"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {compareSelection.length >= 2 && (
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">
                {compareSelection.length} selected for comparison
              </span>
              <Link to="/compare">
                <Button size="sm">
                  <GitCompareArrows className="h-4 w-4" /> Compare selected
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
