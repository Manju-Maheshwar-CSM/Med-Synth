import { Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Navbar } from "./Navbar";
import { Toaster } from "@/components/ui/toast";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { DISCLAIMER, TAGLINE } from "@/lib/constants";

export function Layout() {
  useBackendHealth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex-1 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
            <span className="max-w-2xl">{DISCLAIMER}</span>
          </div>
          <span className="shrink-0 font-medium">MedSynth — {TAGLINE}</span>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}
