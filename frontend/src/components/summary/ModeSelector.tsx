import { motion } from "framer-motion";
import type { SummaryMode } from "@/types";
import { MODES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ModeSelector({
  value,
  onChange,
}: {
  value: SummaryMode;
  onChange: (m: SummaryMode) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">Summary mode</label>
      <div className="grid grid-cols-2 gap-2">
        {MODES.map((m) => {
          const active = m.id === value;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border bg-card hover:bg-muted",
              )}
            >
              {active && (
                <motion.span
                  layoutId="mode-active"
                  className="absolute inset-0 rounded-xl ring-2 ring-primary/50"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5 font-semibold">
                <Icon
                  className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")}
                />
                {m.label}
              </span>
              <span className="relative z-10 text-xs leading-snug text-muted-foreground">
                {m.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
