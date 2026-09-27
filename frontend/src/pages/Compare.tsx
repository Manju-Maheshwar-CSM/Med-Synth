import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GitCompareArrows,
  Play,
  Loader2,
  Check,
  Minus,
  AlertTriangle,
  Lightbulb,
  Download,
} from "lucide-react";
import type { CompareResponse, SummaryLength, SummaryMode } from "@/types";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { ModeSelector } from "@/components/summary/ModeSelector";
import { LengthSelector } from "@/components/summary/LengthSelector";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { downloadFile } from "@/lib/export";

export function Compare() {
  const papers = useStore((s) => s.papers);
  const selection = useStore((s) => s.compareSelection);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);

  const [mode, setMode] = useState<SummaryMode>("researcher");
  const [length, setLength] = useState<SummaryLength>("short");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompareResponse | null>(null);

  const selected = papers.filter((p) => selection.includes(p.paper.id));

  const run = async () => {
    if (selection.length < 2) {
      toast.error("Select at least 2 papers to compare.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.compare(selection, mode, length);
      setResult(res);
      toast.success(`Compared ${res.papers.length} papers`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Comparison failed.");
    } finally {
      setLoading(false);
    }
  };

  if (papers.length < 2) {
    return (
      <div>
        <PageHeader
          title="Compare"
          subtitle="Contrast 2–5 papers side by side with neutral, source-grounded phrasing."
        />
        <EmptyState
          icon={GitCompareArrows}
          title="Need at least two papers"
          description="Summarize or batch-process a few abstracts first, then return here to compare them."
          action={
            <Link to="/literature">
              <Button size="sm">Go to Literature</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Compare"
        subtitle="Contrast 2–5 papers side by side with neutral, source-grounded phrasing."
        actions={
          result ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadFile(
                  "medsynth-comparison.json",
                  JSON.stringify(result, null, 2),
                  "application/json",
                )
              }
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </Button>
          ) : undefined
        }
      />

      {/* Selection */}
      <Card className="mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            Select papers ({selection.length}/5)
          </h3>
          {selection.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {papers.map((p) => {
            const on = selection.includes(p.paper.id);
            const disabled = !on && selection.length >= 5;
            return (
              <button
                key={p.paper.id}
                onClick={() => toggleCompare(p.paper.id)}
                disabled={disabled}
                className={
                  "flex items-center gap-2 rounded-xl border p-3 text-left text-sm transition-colors disabled:opacity-40 " +
                  (on
                    ? "border-primary/40 bg-primary/[0.06]"
                    : "border-border hover:bg-muted")
                }
              >
                <span
                  className={
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border " +
                    (on ? "border-primary bg-primary text-primary-foreground" : "border-border")
                  }
                >
                  {on && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 truncate">{p.paper.title}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ModeSelector value={mode} onChange={setMode} />
          <LengthSelector value={length} onChange={setLength} />
        </div>

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={run}
          disabled={loading || selection.length < 2}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Comparing…
            </>
          ) : (
            <>
              <Play className="h-5 w-5" /> Compare {selection.length} papers
            </>
          )}
        </Button>
      </Card>

      {result && <ComparisonResult result={result} selectedTitles={selected.map((s) => s.paper.title)} />}
    </div>
  );
}

function ComparisonResult({
  result,
  selectedTitles,
}: {
  result: CompareResponse;
  selectedTitles: string[];
}) {
  // Column labels come from the matrix rows (backend assigns a label per paper).
  const columns = Array.from(
    result.matrix.reduce((set, row) => {
      Object.keys(row.values).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-5 py-3">
          <h3 className="text-sm font-semibold">Comparison matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Dimension
                </th>
                {columns.map((c) => (
                  <th key={c} className="px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.matrix.map((row) => (
                <tr key={row.dimension} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.dimension}
                  </td>
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-3 text-xs leading-relaxed text-foreground/90">
                      {row.values[c] || <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <InsightCard
          icon={Check}
          accent="text-success"
          title="Common findings"
          items={result.common_findings}
          empty="No shared findings detected across these papers."
        />
        <InsightCard
          icon={Minus}
          accent="text-accent"
          title="Differences"
          items={result.differences}
          empty="No notable differences detected."
        />
        <InsightCard
          icon={AlertTriangle}
          accent="text-warning"
          title="Potentially conflicting directions"
          items={result.conflicting_findings}
          empty="No conflicting directions detected. Interpret with caution — this is a heuristic."
        />
        <InsightCard
          icon={Lightbulb}
          accent="text-primary"
          title="Research gaps"
          items={result.research_gaps}
          empty="No explicit gaps surfaced from the stated limitations."
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Neutral comparison of {selectedTitles.length} papers · engine: {result.engine}. This
        is a heuristic aid, not a meta-analysis or clinical recommendation.
      </p>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  accent,
  title,
  items,
  empty,
}: {
  icon: typeof Check;
  accent: string;
  title: string;
  items: string[];
  empty: string;
}) {
  const clean = items.filter((x) => x && x.trim());
  return (
    <Card className="p-5">
      <h3 className="mb-2.5 flex items-center gap-2 text-sm font-semibold">
        <Icon className={"h-4 w-4 " + accent} /> {title}
        {clean.length > 0 && <Badge variant="outline">{clean.length}</Badge>}
      </h3>
      {clean.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {clean.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-foreground/90">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
