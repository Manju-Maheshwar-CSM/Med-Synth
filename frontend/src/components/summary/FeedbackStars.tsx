import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeedbackStars({
  value = 0,
  onRate,
  size = "md",
  label,
  readOnly = false,
}: {
  value?: number;
  onRate?: (n: number) => void;
  size?: "sm" | "md";
  label?: string;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHover(0)}
        role="radiogroup"
        aria-label={label ?? "Rating"}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onClick={() => !readOnly && onRate?.(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            aria-checked={value === n}
            role="radio"
            className={cn(
              "rounded transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default",
            )}
          >
            <Star
              className={cn(
                dim,
                "transition-colors",
                n <= shown
                  ? "fill-warning text-warning"
                  : "fill-transparent text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
