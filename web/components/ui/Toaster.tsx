"use client";

import { Toaster as Sonner } from "sonner";
import { useLocale } from "next-intl";

// ─────────────────────────────────────────────────────────────
// Global Toaster — mounted once in the locale layout.
// richColors is disabled so we control colors explicitly and
// can provide proper dark-mode variants.
// ─────────────────────────────────────────────────────────────

export { toast } from "sonner";

export default function Toaster() {
  const locale = useLocale();
  void locale; // used for potential future RTL/locale-aware positioning

  return (
    <Sonner
      position="top-center"
      duration={4000}
      closeButton
      toastOptions={{
        style: {
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
          borderRadius: "14px",
          fontSize: "14px",
        },
        classNames: {
          toast:   "shadow-lg border",
          // ── Light mode ──────────────────────────────────────
          // ── Dark mode — rich surfaces so toasts don't blind in dark themes
          success: [
            "border-emerald-200 bg-emerald-50 text-emerald-900",
            "dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200",
          ].join(" "),
          error: [
            "border-red-200 bg-red-50 text-red-900",
            "dark:border-red-800 dark:bg-red-950/80 dark:text-red-200",
          ].join(" "),
          info: [
            "border-blue-200 bg-blue-50 text-blue-900",
            "dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200",
          ].join(" "),
          warning: [
            "border-amber-200 bg-amber-50 text-amber-900",
            "dark:border-amber-700 dark:bg-amber-950/80 dark:text-amber-200",
          ].join(" "),
          description: "text-xs opacity-80",
        },
      }}
    />
  );
}
