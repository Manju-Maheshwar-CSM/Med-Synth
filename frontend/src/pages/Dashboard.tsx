import { Link } from "react-router-dom";
import {
  Wand2,
  Library,
  GitCompareArrows,
  Star,
  FileText,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlignmentBadge } from "@/components/summary/AlignmentBadge";
import { useStore } from "@/store/useStore";
import { TAGLINE } from "@/lib/constants";

export function Dashboard() {
  const papers = useStore((s) => s.papers);
  const health = useStore((s) => s.health);
  const healthError = useStore((s) => s.healthError);

  const summarized = papers.filter((p) => p.summary);
  const avgAlignment = summarized.length
    ? Math.round(
        summarized.reduce((a, p) => a + (p.summary?.alignment.score ?? 0), 0) /
          summarized.length,
      )
    : 0;
  const rated = papers.filter((p) => p.rating);
  const avgRating = rated.length
    ? (rated.reduce((a, p) => a + (p.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";

  return (
    <div>
      <PageHeader
        title={
          <>
            Med<span className="text-primary">Synth</span>
          </>
        }
        subtitle={TAGLINE}
        actions={
          <Link to="/summarize">
            <Button size="lg">
              <Wand2 className="h-5 w-5" /> New summary
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Papers processed"
          value={papers.length}
          sub="This session"
          delay={0}
        />
        <StatCard
          icon={ShieldCheck}
          label="Avg. source alignment"
          value={summarized.length ? `${avgAlignment}%` : "—"}
          sub={`${summarized.length} summarized`}
          accent="success"
          delay={0.05}
        />
        <StatCard
          icon={Star}
          label="Avg. rating"
          value={avgRating}
          sub={`${rated.length} rated`}
          accent="warning"
          delay={0.1}
        />
        <StatCard
          icon={Activity}
          label="Engine"
          value={healthError || !health ? "Offline" : health.mode === "api" ? "AI" : "Mock"}
          sub={health?.model ?? "not connected"}
          accent="accent"
          delay={0.15}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">Recent papers</h3>
              <Link to="/literature">
                <Button size="sm" variant="ghost">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            {papers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No papers yet. Generate your first summary to get started.
                </p>
                <Link to="/summarize">
                  <Button size="sm" className="mt-3">
                    <Wand2 className="h-4 w-4" /> Summarize
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {papers.slice(0, 5).map((p) => (
                  <li
                    key={p.paper.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.paper.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.summary?.content.study_type || "Not summarized"} ·{" "}
                        {p.paper.source}
                      </p>
                    </div>
                    {p.summary && (
                      <AlignmentBadge alignment={p.summary.alignment} compact />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <QuickLink
            to="/summarize"
            icon={Wand2}
            title="Summarize"
            desc="One abstract → faithful summary"
          />
          <QuickLink
            to="/literature"
            icon={Library}
            title="Literature"
            desc="Batch-process many abstracts"
          />
          <QuickLink
            to="/compare"
            icon={GitCompareArrows}
            title="Compare"
            desc="Contrast 2–5 papers neutrally"
          />
          <QuickLink
            to="/quality"
            icon={Star}
            title="Quality"
            desc="Feedback & alignment trends"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: string;
  icon: typeof Wand2;
  title: string;
  desc: string;
}) {
  return (
    <Link to={to}>
      <Card className="group flex items-center gap-3 p-4 transition-colors hover:bg-muted/50">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </Card>
    </Link>
  );
}
