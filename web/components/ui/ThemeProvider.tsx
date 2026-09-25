"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type React from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      storageKey="fresheri_theme"
    >
      {children}
    </NextThemesProvider>
  );
}
