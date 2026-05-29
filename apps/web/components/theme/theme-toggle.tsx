"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { mounted, setTheme, theme } = useTheme();
  const isDark = mounted && theme === "dark";
  const nextTheme = isDark ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextTheme} mode`}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 sm:px-3",
        isDark && "border-slate-700 bg-slate-900 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-800 hover:text-indigo-200"
      )}
      onClick={() => setTheme(nextTheme)}
      type="button"
    >
      {isDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}
