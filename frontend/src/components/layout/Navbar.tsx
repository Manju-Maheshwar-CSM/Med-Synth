import { NavLink } from "react-router-dom";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { BackendStatus } from "./BackendStatus";
import { SettingsMenu } from "./SettingsMenu";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center gap-4">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
            <Activity className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Med<span className="text-primary">Synth</span>
          </span>
        </NavLink>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full bg-primary"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <BackendStatus />
          </div>
          <ThemeToggle />
          <SettingsMenu />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-3 py-2 md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
