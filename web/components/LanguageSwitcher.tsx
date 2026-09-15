"use client";

import { useTransition, useRef, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ChevronDown, Check } from "lucide-react";

// ── Locale metadata ──────────────────────────────────────────

type Locale = (typeof routing.locales)[number];

const LOCALE_META: Record<Locale, { flag: string; label: string; short: string }> = {
  en: { flag: "🇬🇧", label: "English",     short: "EN" },
  rw: { flag: "🇷🇼", label: "Kinyarwanda", short: "RW" },
  fr: { flag: "🇫🇷", label: "Français",    short: "FR" },
};

const LOCALE_COOKIE = "NEXT_LOCALE";

function setLocaleCookie(locale: Locale) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

// ─────────────────────────────────────────────────────────────
// LanguageSwitcher
// ─────────────────────────────────────────────────────────────

export default function LanguageSwitcher() {
  const t            = useTranslations("language");
  const locale       = useLocale() as Locale;
  const router       = useRouter();
  const pathname     = usePathname();
  const [open, setOpen]           = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef  = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  function switchLocale(next: Locale) {
    if (next === locale) { setOpen(false); return; }
    // Persist in cookie + localStorage for middleware + client reads
    setLocaleCookie(next);
    try { localStorage.setItem(LOCALE_COOKIE, next); } catch { /* SSR safe */ }
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
    setOpen(false);
  }

  const current = LOCALE_META[locale];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
        disabled={isPending}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200
          text-sm font-medium text-gray-700 bg-white
          hover:border-green-400 hover:text-green-700
          transition-colors select-none
          ${isPending ? "opacity-60 cursor-wait" : "cursor-pointer"}
        `}
      >
        <span className="text-base leading-none" aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline">{current.short}</span>
        <ChevronDown
          size={13}
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label={t("selectLanguage")}
          className="
            absolute right-0 top-full mt-1.5 z-50
            w-44 bg-white rounded-xl shadow-lg border border-gray-100
            overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {routing.locales.map((loc) => {
            const meta    = LOCALE_META[loc as Locale];
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(loc as Locale)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left
                  ${isActive
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                  }
                `}
              >
                <span className="text-lg leading-none" aria-hidden="true">{meta.flag}</span>
                <span className="flex-1">{t(loc)}</span>
                <span className="text-xs text-gray-400 font-mono">{meta.short}</span>
                {isActive && <Check size={13} className="text-green-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
