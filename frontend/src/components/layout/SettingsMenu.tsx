import { useState, useRef, useEffect } from "react";
import { Settings, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { ALIGNMENT_NOTE, DISCLAIMER } from "@/lib/constants";

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const health = useStore((s) => s.health);
  const error = useStore((s) => s.healthError);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings & info"
        aria-expanded={open}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Settings className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card p-4 shadow-card"
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold">MedSynth · Settings</h4>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Engine mode</span>
                {error || !health ? (
                  <Badge variant="danger">Offline</Badge>
                ) : health.mode === "api" ? (
                  <Badge variant="accent">API · {health.model}</Badge>
                ) : (
                  <Badge variant="success">Mock (offline)</Badge>
                )}
              </div>
              <p className="rounded-lg bg-muted p-2.5 text-xs leading-relaxed text-muted-foreground">
                The engine is configured on the <b>backend</b> via environment
                variables (<code>LLM_MODE</code>, <code>LLM_API_KEY</code>,{" "}
                <code>LLM_MODEL</code>). Mock mode needs no API key and runs fully
                offline.
              </p>
              <div className="rounded-lg border border-border p-2.5 text-xs leading-relaxed text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">{ALIGNMENT_NOTE}</p>
                <p>{DISCLAIMER}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
