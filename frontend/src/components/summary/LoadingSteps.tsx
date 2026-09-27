import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STEPS = [
  "Parsing abstract structure",
  "Extracting figures & key terms",
  "Composing faithful summary",
  "Scoring source alignment",
];

export function LoadingSteps() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 650);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-5">
      <div className="space-y-2.5 rounded-2xl border border-border bg-card p-4">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={label} className="flex items-center gap-2.5 text-sm">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full",
                  done && "bg-success/[0.15] text-success",
                  current && "bg-primary/10 text-primary",
                  !done && !current && "bg-muted text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : current ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span className={cn(done || current ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 rounded-2xl border border-border bg-card p-6"
      >
        <Skeleton className="h-5 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </motion.div>
    </div>
  );
}
