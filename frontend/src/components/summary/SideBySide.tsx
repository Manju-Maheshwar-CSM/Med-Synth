import { useMemo } from "react";
import type { SummaryResult } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Matches percentages, p-values, n=, CIs, ratios, and plain figures.
const NUM_RE =
  /(\bp\s*[<>=]\s*0?\.\d+|\b(?:HR|OR|RR)\s*=?\s*\d+(?:\.\d+)?|\bn\s*=\s*[\d,]+|\b\d+(?:\.\d+)?\s*%|\b\d+(?:\.\d+)?\s*(?:mg|kg|mmHg|months?|weeks?|years?)\b|\b\d+(?:,\d{3})+(?:\.\d+)?\b|\b\d+\.\d+\b)/gi;

interface Token {
  text: string;
  kind: "num" | "term" | "text";
}

function tokenize(text: string, terms: string[]): Token[] {
  // First split on numbers, then within text segments highlight terms.
  const termList = terms
    .map((t) => t.trim())
    .filter((t) => t.length > 2)
    .sort((a, b) => b.length - a.length);
  const termRe =
    termList.length > 0
      ? new RegExp(
          `\\b(${termList.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
          "gi",
        )
      : null;

  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  NUM_RE.lastIndex = 0;
  while ((m = NUM_RE.exec(text)) !== null) {
    if (m.index > last) pushText(text.slice(last, m.index), termRe, out);
    out.push({ text: m[0], kind: "num" });
    last = m.index + m[0].length;
  }
  if (last < text.length) pushText(text.slice(last), termRe, out);
  return out;
}

function pushText(seg: string, termRe: RegExp | null, out: Token[]) {
  if (!termRe) {
    out.push({ text: seg, kind: "text" });
    return;
  }
  let last = 0;
  let m: RegExpExecArray | null;
  termRe.lastIndex = 0;
  while ((m = termRe.exec(seg)) !== null) {
    if (m.index > last) out.push({ text: seg.slice(last, m.index), kind: "text" });
    out.push({ text: m[0], kind: "term" });
    last = m.index + m[0].length;
  }
  if (last < seg.length) out.push({ text: seg.slice(last), kind: "text" });
}

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  const tokens = useMemo(() => tokenize(text, terms), [text, terms]);
  return (
    <>
      {tokens.map((t, i) =>
        t.kind === "num" ? (
          <mark key={i} className="mark-num">
            {t.text}
          </mark>
        ) : t.kind === "term" ? (
          <mark key={i} className="mark-term">
            {t.text}
          </mark>
        ) : (
          <span key={i}>{t.text}</span>
        ),
      )}
    </>
  );
}

export function SideBySide({
  abstract,
  result,
}: {
  abstract: string;
  result: SummaryResult;
}) {
  const c = result.content;
  const terms = useMemo(
    () => [...c.important_terms, ...c.keywords],
    [c.important_terms, c.keywords],
  );

  const summaryText = useMemo(() => {
    const parts = [c.tldr, ...c.key_findings, c.conclusion].filter(
      (x) => x && x.trim() && x.trim() !== "Not stated in the provided abstract.",
    );
    return parts.join("\n\n");
  }, [c]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="font-medium text-muted-foreground">Highlights:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="mark-num rounded px-1">42%</span> figures &amp; statistics
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="mark-term rounded px-1">terms</span> key medical terms
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Original abstract</h3>
            <Badge variant="outline">Source</Badge>
          </div>
          <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            <Highlighted text={abstract} terms={terms} />
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">MedSynth summary</h3>
            <Badge variant="primary">Generated</Badge>
          </div>
          <div className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            <Highlighted text={summaryText} terms={terms} />
          </div>
        </Card>
      </div>
    </div>
  );
}
