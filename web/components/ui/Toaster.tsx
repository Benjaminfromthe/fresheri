"use client";

import { Toaster as Sonner } from "sonner";
import { useLocale } from "next-intl";

// ─────────────────────────────────────────────────────────────
// Global Toaster — mounted once in the locale layout.
// Position, duration and styles apply across all pages.
// Use the `toast` helper from sonner directly in components.
// ─────────────────────────────────────────────────────────────

export { toast } from "sonner";

export default function Toaster() {
  const locale = useLocale();

  return (
    <Sonner
      position="top-center"
      duration={4000}
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "var(--font-geist-sans, system-ui, sans-serif)",
          borderRadius: "14px",
          fontSize: "14px",
        },
        classNames: {
          toast:       "shadow-lg border",
          success:     "border-green-200 bg-green-50 text-green-900",
          error:       "border-red-200 bg-red-50 text-red-900",
          info:        "border-blue-200 bg-blue-50 text-blue-900",
          warning:     "border-amber-200 bg-amber-50 text-amber-900",
          description: "text-xs opacity-80",
        },
      }}
    />
  );
}
