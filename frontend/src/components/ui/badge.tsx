import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "outline";

const styles: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/[0.12] text-success",
  warning: "bg-warning/[0.12] text-warning",
  danger: "bg-danger/[0.12] text-danger",
  outline: "border border-border text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
