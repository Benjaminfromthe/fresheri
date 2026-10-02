"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ThemeToggle — light ↔ dark toggle.
//
// Icon convention: shows the mode you will SWITCH TO on click.
//   • In dark mode  → shows Sun  → "Switch to light"
//   • In light mode → shows Moon → "Switch to dark"
//
// Lazy-mounted to avoid SSR hydration mismatch.
// aria-label + title translated via next-intl.
// focus-visible ring for keyboard accessibility.
// ─────────────────────────────────────────────────────────────

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Preserve header layout before mount
  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  // Label describes the action — what the click will DO
  const label = isDark ? t("switchToLight") : t("switchToDark");

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className="
        w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer
        border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
        hover:border-emerald-400 dark:hover:border-emerald-600
        hover:bg-slate-50 dark:hover:bg-slate-800/60
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950
        transition-all duration-200 ease-in-out
      "
    >
      {/* Icon = destination mode */}
      {isDark
        ? <Sun  size={16} className="text-amber-400" aria-hidden="true" />
        : <Moon size={16} className="text-slate-500" aria-hidden="true" />
      }
    </button>
  );
}
