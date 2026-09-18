"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sprout, Menu, X, User, ShoppingBag } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ─────────────────────────────────────────────────────────────
// Header — shared across landing + marketplace + auth pages
// Privacy: no farmer PII in nav; user identity handled client-side
// ─────────────────────────────────────────────────────────────

export default function Header() {
  const t  = useTranslations("navigation");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS = [
    { href: "/",           label: t("home")       },
    { href: "/marketplace",label: t("marketplace") },
    { href: "/#how",       label: t("howItWorks")  },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.replace("/#", "/"));

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors">
            <Sprout size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">{tc("appName")}</span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(href)
                  ? "text-green-700 bg-green-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
              `}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />

          {/* Sign In */}
          <Link
            href="/auth"
            className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-green-700 border border-gray-200 hover:border-green-400 px-3 py-1.5 rounded-xl transition-colors"
          >
            <User size={14} />
            {t("signIn")}
          </Link>

          {/* Sign Up CTA */}
          <Link
            href="/auth"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ShoppingBag size={14} />
            {t("signUp")}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? tc("close") : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 shadow-md">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive(href)
                  ? "text-green-700 bg-green-50"
                  : "text-gray-700 hover:bg-gray-50"}
              `}
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
            >
              <User size={14} />
              {t("signIn")}
            </Link>
            <Link
              href="/auth"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold"
            >
              <ShoppingBag size={14} />
              {t("signUp")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
