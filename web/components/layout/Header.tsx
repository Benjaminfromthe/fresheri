"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Sprout, Menu, X, User, ShoppingBag, ChevronDown, LogOut, Settings } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import LanguageSwitcher  from "@/components/LanguageSwitcher";
import ThemeToggle       from "@/components/ui/ThemeToggle";
import { getStoredUser, clearSession } from "@/lib/api-client";
import { toast }         from "@/components/ui/Toaster";

// ─────────────────────────────────────────────────────────────
// Header — shared across all pages
// ─────────────────────────────────────────────────────────────

export default function Header() {
  const t        = useTranslations("navigation");
  const tc       = useTranslations("common");
  const tt       = useTranslations("toast");
  const pathname = usePathname();
  const router   = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ firstName: string; lastName: string; role: string } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Read auth state on mount + when storage changes
  useEffect(() => {
    const read = () => {
      const stored = getStoredUser();
      setUser(stored ? { firstName: stored.firstName, lastName: stored.lastName, role: stored.role } : null);
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    toast.success(tt("signoutSuccess"));
    router.push("/");
  };

  const NAV_LINKS = [
    { href: "/",          label: t("marketplace")  },
    { href: "/about",     label: t("about")        },
    { href: "/contact",   label: t("contactTitle") },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center group-hover:bg-green-700 transition-colors">
            <Sprout size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-slate-100 text-lg tracking-tight">{tc("appName")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            /* ── Logged-in: user avatar + dropdown menu ── */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-green-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium text-gray-700 dark:text-slate-300"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                {/* Avatar circle */}
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:inline max-w-24 truncate">{user.firstName}</span>
                <ChevronDown size={13} className={`transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150">

                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                    <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 capitalize">
                      {user.role.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      href="/marketplace"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ShoppingBag size={15} className="text-gray-400 dark:text-slate-500" />
                      {t("marketplace")}
                    </Link>
                    <Link
                      href="/auth"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Settings size={15} className="text-gray-400 dark:text-slate-500" />
                      {t("profile")}
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 dark:border-slate-800 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={15} />
                      {t("logout")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Guest: Sign In + Sign Up ── */
            <>
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-green-400 border border-gray-200 dark:border-slate-700 hover:border-green-400 px-3 py-1.5 rounded-xl transition-colors"
              >
                <User size={14} />
                {t("signIn")}
              </Link>
              <Link
                href="/auth"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ShoppingBag size={14} />
                {t("signUp")}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? tc("close") : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 space-y-1 shadow-md">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(href)
                  ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                  : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              {label}
            </Link>
          ))}

          <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 capitalize">{user.role.replace(/_/g, " ").toLowerCase()}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <User size={14} />{t("signIn")}
                </Link>
                <Link href="/auth" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold">
                  <ShoppingBag size={14} />{t("signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
