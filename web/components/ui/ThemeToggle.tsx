"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ThemeToggle — Sun/Moon button in the header
// Lazy-mounted to avoid SSR hydration mismatch.
// ─────────────────────────────────────────────────────────────

export default function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted]       = useState(false);

  useEffect(() => setMounted(true), []);

  // Preserve header layout before mount
  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="
        w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer
        border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
        text-slate-600 dark:text-amber-400
        hover:border-emerald-400 dark:hover:border-amber-500
        hover:bg-slate-50 dark:hover:bg-slate-800/60
        transition-all duration-200 ease-in-out
      "
    >
      {isDark
        ? <Sun  size={16} className="text-amber-400" />
        : <Moon size={16} className="text-slate-500" />
      }
    </button>
  );
}
