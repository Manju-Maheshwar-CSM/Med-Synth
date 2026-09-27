import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsCtx {
  value: string;
  setValue: (v: string) => void;
  id: string;
}
const Ctx = React.createContext<TabsCtx | null>(null);

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  return (
    <Ctx.Provider value={{ value, setValue: onValueChange, id }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-muted p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {active && (
        <motion.span
          layoutId={`tab-${ctx.id}`}
          className="absolute inset-0 rounded-lg bg-card shadow-soft"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ctx = React.useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
