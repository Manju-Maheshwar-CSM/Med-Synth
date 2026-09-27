import { ShieldCheck, ShieldAlert, ShieldQuestion, Info } from "lucide-react";
import { motion } from "framer-motion";
import type { SourceAlignment } from "@/types";
import { Tooltip } from "@/components/ui/tooltip";
import { ALIGNMENT_NOTE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const bandStyle: Record<
  SourceAlignment["band"],
  { ring: string; text: string; track: string; bar: string; Icon: typeof ShieldCheck }
> = {
  High: {
    ring: "border-success/30 bg-success/[0.08]",
    text: "text-success",
    track: "bg-success/15",
    bar: "bg-success",
    Icon: ShieldCheck,
  },
  Moderate: {
    ring: "border-warning/30 bg-warning/[0.08]",
    text: "text-warning",
    track: "bg-warning/15",
    bar: "bg-warning",
    Icon: ShieldQuestion,
  },
  Low: {
    ring: "border-danger/30 bg-danger/[0.08]",
    text: "text-danger",
    track: "bg-danger/15",
    bar: "bg-danger",
    Icon: ShieldAlert,
  },
};

export function AlignmentBadge({
  alignment,
  compact = false,
}: {
  alignment: SourceAlignment;
  compact?: boolean;
}) {
  const s = bandStyle[alignment.band];
  const { Icon } = s;

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
          s.ring,
          s.text,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {alignment.score}% · {alignment.band}
      </span>
    );
  }

  return (
    <div className={cn("rounded-2xl border p-4", s.ring)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", s.text)} />
          <span className="text-sm font-semibold">Source Alignment</span>
          <Tooltip content={ALIGNMENT_NOTE}>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </Tooltip>
        </div>
        <span className={cn("text-2xl font-bold tabular-nums", s.text)}>
          {alignment.score}%
        </span>
      </div>

      <div className={cn("mt-3 h-2 w-full overflow-hidden rounded-full", s.track)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${alignment.score}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", s.bar)}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={cn("font-semibold", s.text)}>{alignment.band} alignment</span>
        <span className="text-muted-foreground">
          {alignment.unsupported_numbers.length > 0
            ? `${alignment.unsupported_numbers.length} unverified figure(s)`
            : "All figures trace to source"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <Metric label="Numeric" value={alignment.numeric_overlap} />
        <Metric label="Terms" value={alignment.term_overlap} />
        <Metric label="Coverage" value={alignment.coverage} />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {ALIGNMENT_NOTE}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-background/60 py-1.5">
      <div className="text-sm font-semibold tabular-nums">
        {Math.round(value * 100)}%
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
