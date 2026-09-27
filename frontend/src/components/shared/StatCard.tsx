import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "primary",
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: "primary" | "accent" | "success" | "warning";
  delay?: number;
}) {
  const accentMap = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    success: "bg-success/[0.12] text-success",
    warning: "bg-warning/[0.12] text-warning",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
    >
      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <span
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              accentMap[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
