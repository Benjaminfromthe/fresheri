"use client";

import { useTransition, useRef, useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { ChevronDown, Check } from "lucide-react";

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

export default function LanguageSwitcher() {
  const t                          = useTranslations("language");
  const locale                     = useLocale() as Locale;
  const router                     = useRouter();
  const pathname                   = usePathname();
  const [open, setOpen]            = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropdownRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function switchLocale(next: Locale) {
    if (next === locale) { setOpen(false); return; }
    setLocaleCookie(next);
    try { localStorage.setItem(LOCALE_COOKIE, next); } catch { /* SSR safe */ }
    startTransition(() => router.replace(pathname, { locale: next }));
    setOpen(false);
  }

  const current = LOCALE_META[locale];

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("selectLanguage")}
        disabled={isPending}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-xl select-none
          border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900
          text-sm font-medium text-slate-700 dark:text-slate-300
          hover:border-emerald-400 dark:hover:border-emerald-600
          hover:text-emerald-600 dark:hover:text-emerald-400
          transition-all duration-200 ease-in-out
          ${isPending ? "opacity-60 cursor-wait" : "cursor-pointer"}
        `}
      >
        <span className="text-base leading-none" aria-hidden="true">{current.flag}</span>
        <span className="hidden sm:inline">{current.short}</span>
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label={t("selectLanguage")}
          className="
            absolute right-0 top-full mt-1.5 z-50
            w-44 rounded-xl shadow-xl overflow-hidden
            bg-white dark:bg-slate-900
            border border-slate-200 dark:border-slate-800
            animate-in fade-in slide-in-from-top-1 duration-150
          "
        >
          {routing.locales.map((loc) => {
            const meta     = LOCALE_META[loc as Locale];
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                role="option"
                aria-selected={isActive}
                onClick={() => switchLocale(loc as Locale)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left
                  transition-all duration-200 ease-in-out
                  ${isActive
                    ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                <span className="text-lg leading-none" aria-hidden="true">{meta.flag}</span>
                <span className="flex-1">{t(loc)}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{meta.short}</span>
                {isActive && <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
