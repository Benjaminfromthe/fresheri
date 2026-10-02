"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type React from "react";

// ─────────────────────────────────────────────────────────────
// ThemeProvider
//
// disableTransitionOnChange: next-themes briefly adds a
// .no-transition class on <html> around every theme swap,
// which prevents the jarring mid-animation flash when the
// page reloads with a different stored theme.
// ─────────────────────────────────────────────────────────────

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="fresheri_theme"
    >
      {children}
    </NextThemesProvider>
  );
}
