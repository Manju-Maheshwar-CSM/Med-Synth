import { useState } from "react";
import { MessageSquareHeart, Check } from "lucide-react";
import type { SummaryResult } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { FeedbackStars } from "./FeedbackStars";
import { api, ApiError } from "@/lib/api";
import { useStore } from "@/store/useStore";

const DIMENSIONS = [
  { key: "overall", label: "Overall" },
  { key: "accuracy", label: "Faithfulness" },
  { key: "relevance", label: "Relevance" },
  { key: "completeness", label: "Completeness" },
] as const;

type Key = (typeof DIMENSIONS)[number]["key"];

export function FeedbackInline({ result }: { result: SummaryResult }) {
  const [scores, setScores] = useState<Record<Key, number>>({
    overall: 0,
    accuracy: 0,
    relevance: 0,
    completeness: 0,
  });
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const setRating = useStore((s) => s.setRating);
  const setFeedback = useStore((s) => s.setFeedback);

  const submit = async () => {
    if (scores.overall === 0) {
      toast.error("Please give at least an overall rating.");
      return;
    }
    setBusy(true);
    try {
      const summary = await api.feedback({
        summary_id: result.id,
        paper_id: result.paper_id,
        overall: scores.overall,
        accuracy: scores.accuracy || scores.overall,
        relevance: scores.relevance || scores.overall,
        completeness: scores.completeness || scores.overall,
        comment: comment.trim() || undefined,
      });
      setFeedback(summary);
      setRating(result.paper_id, scores.overall);
      setSent(true);
      toast.success("Thanks for the feedback!");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not submit feedback.");
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/[0.14] text-success">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium">Feedback recorded</p>
          <p className="text-xs text-muted-foreground">
            Stored for this session only — see the Quality page for aggregates.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <MessageSquareHeart className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold">Rate this summary</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {DIMENSIONS.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{d.label}</span>
            <FeedbackStars
              size="sm"
              value={scores[d.key]}
              onRate={(n) => setScores((s) => ({ ...s, [d.key]: n }))}
            />
          </div>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional comment…"
        className="w-full resize-none rounded-xl border border-border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button size="sm" onClick={submit} disabled={busy}>
        Submit feedback
      </Button>
    </Card>
  );
}
