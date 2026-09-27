import * as React from "react";
import { cn } from "@/lib/utils";

export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-card animate-fade-in",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
            className,
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
