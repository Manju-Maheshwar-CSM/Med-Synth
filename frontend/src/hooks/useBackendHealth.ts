import { useEffect } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

// Polls the backend health endpoint so the UI can reflect connectivity + mode.
export function useBackendHealth(intervalMs = 20000) {
  const setHealth = useStore((s) => s.setHealth);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const h = await api.health();
        if (active) setHealth(h, false);
      } catch {
        if (active) setHealth(null, true);
      }
    };
    check();
    const timer = setInterval(check, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [setHealth, intervalMs]);
}
