"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ThemeToggle — Sun/Moon button placed in the header
// Mounted lazily to avoid SSR mismatch (useTheme reads localStorage)
// ─────────────────────────────────────────────────────────────

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Placeholder to preserve layout space
    return (
      <div className="w-9 h-9 rounded-xl border border-gray-200" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="
        w-9 h-9 flex items-center justify-center rounded-xl
        border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800
        text-gray-600 dark:text-amber-400
        hover:bg-gray-50 dark:hover:bg-gray-700
        hover:border-green-400 dark:hover:border-amber-400
        transition-all duration-200 cursor-pointer
      "
    >
      {isDark ? (
        <Sun size={16} className="text-amber-400" />
      ) : (
        <Moon size={16} className="text-gray-600" />
      )}
    </button>
  );
}
