import { Tooltip } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

export function BackendStatus() {
  const health = useStore((s) => s.health);
  const error = useStore((s) => s.healthError);

  const connected = !!health && !error;
  const mode = health?.mode;

  const label = connected
    ? mode === "api"
      ? "API mode"
      : "Offline demo"
    : "Backend offline";

  const tip = connected
    ? mode === "api"
      ? `Connected · LLM API mode (${health?.model})`
      : "Connected · deterministic mock engine (no API key required)"
    : "Cannot reach the backend on port 8000. Start it with uvicorn.";

  return (
    <Tooltip content={tip} side="bottom">
      <span
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
          connected
            ? "border-border bg-card text-foreground"
            : "border-danger/30 bg-danger/[0.08] text-danger",
        )}
      >
        <span className="relative flex h-2 w-2">
          {connected && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
                mode === "api" ? "bg-accent" : "bg-success",
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              connected ? (mode === "api" ? "bg-accent" : "bg-success") : "bg-danger",
            )}
          />
        </span>
        {label}
      </span>
    </Tooltip>
  );
}
