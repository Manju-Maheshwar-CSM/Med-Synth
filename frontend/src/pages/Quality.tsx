import { useEffect } from "react";
import { Star, ShieldCheck, MessagesSquare, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedbackStars } from "@/components/summary/FeedbackStars";
import { AlignmentBadge } from "@/components/summary/AlignmentBadge";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";
import { ALIGNMENT_NOTE } from "@/lib/constants";

export function Quality() {
  const papers = useStore((s) => s.papers);
  const feedback = useStore((s) => s.feedback);
  const setFeedback = useStore((s) => s.setFeedback);

  useEffect(() => {
    api.feedbackSummary().then(setFeedback).catch(() => {});
  }, [setFeedback]);

  const summarized = papers.filter((p) => p.summary);
  const rated = papers.filter((p) => p.rating);

  const bands = { High: 0, Moderate: 0, Low: 0 };
  summarized.forEach((p) => {
    bands[p.summary!.alignment.band]++;
  });
  const total = summarized.length || 1;

  return (
    <div>
      <PageHeader
        title="Quality"
        subtitle="Session feedback and source-alignment trends. All ratings are in-memory and reset when you reload."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={MessagesSquare}
          label="Ratings collected"
          value={feedback?.count ?? 0}
          accent="accent"
        />
        <StatCard
          icon={Star}
          label="Avg. overall"
          value={feedback?.count ? feedback.avg_overall.toFixed(1) : "—"}
          accent="warning"
          delay={0.05}
        />
        <StatCard
          icon={ShieldCheck}
          label="Avg. faithfulness"
          value={feedback?.count ? feedback.avg_accuracy.toFixed(1) : "—"}
          accent="success"
          delay={0.1}
        />
        <StatCard
          icon={TrendingUp}
          label="Summaries"
          value={summarized.length}
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Feedback averages */}
        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold">Feedback averages</h3>
          {feedback?.count ? (
            <div className="space-y-3">
              <Dimension label="Overall" value={feedback.avg_overall} />
              <Dimension label="Faithfulness" value={feedback.avg_accuracy} />
              <Dimension label="Relevance" value={feedback.avg_relevance} />
              <Dimension label="Completeness" value={feedback.avg_completeness} />
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No feedback yet. Rate a summary to populate these averages.
            </p>
          )}
        </Card>

        {/* Alignment distribution */}
        <Card className="p-5">
          <h3 className="mb-1 text-base font-semibold">Source-alignment distribution</h3>
          <p className="mb-4 text-xs text-muted-foreground">{ALIGNMENT_NOTE}</p>
          {summarized.length ? (
            <div className="space-y-3">
              <BandBar label="High (≥80%)" count={bands.High} total={total} color="bg-success" />
              <BandBar
                label="Moderate (60–79%)"
                count={bands.Moderate}
                total={total}
                color="bg-warning"
              />
              <BandBar label="Low (<60%)" count={bands.Low} total={total} color="bg-danger" />
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No summaries yet.
            </p>
          )}
        </Card>
      </div>

      {/* Rated papers */}
      <div className="mt-6">
        <h3 className="mb-3 text-base font-semibold">Rated summaries</h3>
        {rated.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No rated summaries yet"
            description="Generate a summary and rate it — your ratings appear here for the session."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rated.map((p) => (
              <Card key={p.paper.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.paper.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <FeedbackStars value={p.rating} size="sm" readOnly />
                    {p.summary && (
                      <Badge variant="outline">{p.summary.content.study_type}</Badge>
                    )}
                  </div>
                </div>
                {p.summary && <AlignmentBadge alignment={p.summary.alignment} compact />}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dimension({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <FeedbackStars value={Math.round(value)} size="sm" readOnly />
        <span className="w-8 text-right text-sm font-semibold tabular-nums">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function BandBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = Math.round((count / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={"h-full rounded-full " + color} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
