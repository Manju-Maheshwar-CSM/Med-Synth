import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

let counter = 0;
const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, kind, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m: string) => useToastStore.getState().push("success", m),
  error: (m: string) => useToastStore.getState().push("error", m),
  info: (m: string) => useToastStore.getState().push("info", m),
  warning: (m: string) => useToastStore.getState().push("warning", m),
};

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};
const colors = {
  success: "text-success",
  error: "text-danger",
  info: "text-accent",
  warning: "text-warning",
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-card"
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", colors[t.kind])} />
              <p className="flex-1 text-sm leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
