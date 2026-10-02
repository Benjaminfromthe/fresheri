"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Mode = "light" | "dark" | "system";

// ─────────────────────────────────────────────────────────────
// ThemeToggle — 3-state cycle: light → dark → system → light
//
// • Lazy-mounted to avoid SSR hydration mismatch.
// • Placeholder preserves header layout before mount.
// • aria-label and title translated via next-intl.
// • focus-visible ring for keyboard accessibility.
// ─────────────────────────────────────────────────────────────

const CYCLE: Mode[] = ["light", "dark", "system"];

const ICON: Record<Mode, React.ReactNode> = {
  light:  <Sun    size={16} aria-hidden="true" />,
  dark:   <Moon   size={16} aria-hidden="true" />,
  system: <Monitor size={15} aria-hidden="true" />,
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Same-size placeholder so header layout doesn't shift before mount
  if (!mounted) {
    return (
      <div
        className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        aria-hidden="true"
      />
    );
  }

  const current = (theme as Mode | undefined) ?? "system";
  const next    = CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length];

  const labels: Record<Mode, string> = {
    light:  t("switchToDark"),
    dark:   t("switchToSystem"),
    system: t("switchToLight"),
  };

  const modeLabel: Record<Mode, string> = {
    light:  t("light"),
    dark:   t("dark"),
    system: t("system"),
  };

  return (
    <button
      onClick={() => setTheme(next)}
      aria-label={labels[current]}
      title={`${modeLabel[current]} — ${labels[current]}`}
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
      {ICON[current]}
    </button>
  );
}
