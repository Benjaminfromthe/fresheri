"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ThemeToggle — simple light ↔ dark toggle.
// Lazy-mounted to avoid SSR hydration mismatch.
// aria-label translated via next-intl. focus-visible ring.
// ─────────────────────────────────────────────────────────────

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        aria-hidden="true"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? t("switchToLight") : t("switchToDark")}
      title={isDark ? t("switchToLight") : t("switchToDark")}
      className="
        w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer
        border border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
        text-slate-500 dark:text-amber-400
        hover:border-emerald-400 dark:hover:border-emerald-600
        hover:bg-slate-50 dark:hover:bg-slate-800/60
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950
        transition-all duration-200 ease-in-out
      "
    >
      {isDark
        ? <Sun  size={16} className="text-amber-400" aria-hidden="true" />
        : <Moon size={16} className="text-slate-500" aria-hidden="true" />
      }
    </button>
  );
}
