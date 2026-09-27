import { motion } from "framer-motion";
import type { SummaryLength } from "@/types";
import { LENGTHS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LengthSelector({
  value,
  onChange,
}: {
  value: SummaryLength;
  onChange: (l: SummaryLength) => void;
}) {
  const active = LENGTHS.find((l) => l.id === value) ?? LENGTHS[1];
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <label className="text-sm font-medium">Summary length</label>
        <span className="text-xs text-muted-foreground">{active.hint}</span>
      </div>
      <div
        role="radiogroup"
        aria-label="Summary length"
        className="inline-flex w-full items-center gap-1 rounded-xl bg-muted p-1"
      >
        {LENGTHS.map((l) => {
          const isActive = l.id === value;
          return (
            <button
              key={l.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(l.id)}
              className={cn(
                "relative flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="length-active"
                  className="absolute inset-0 rounded-lg bg-card shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{l.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
