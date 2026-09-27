import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export function ThemeToggle() {
  const theme = useStore((s) => s.theme);
  const toggle = useStore((s) => s.toggleTheme);
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </motion.span>
    </button>
  );
}
