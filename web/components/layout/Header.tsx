"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Sprout, Menu, X, User, ShoppingBag, ChevronDown, LogOut, Settings, Package } from "lucide-react";
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

  const [mobileOpen, setMobileOpen]     = useState(false);
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
    { href: "/",        label: t("marketplace")  },
    { href: "/about",   label: t("about")        },
    { href: "/contact", label: t("contactTitle") },
  ] as const;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  return (
    <header className="
      sticky top-0 z-40 w-full
      bg-slate-50 dark:bg-slate-950
      backdrop-blur-sm
      border-b border-slate-200 dark:border-slate-800
      shadow-sm
      transition-all duration-200 ease-in-out
    ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center group-hover:bg-emerald-700 transition-colors duration-200">
            <Sprout size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-lg tracking-tight">
            {tc("appName")}
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200 ease-in-out
                ${isActive(href)
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }
              `}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <ThemeToggle />

          {user ? (
            /* ── Logged-in: avatar + dropdown ── */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="
                  flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl
                  border border-slate-200 dark:border-slate-700
                  hover:border-emerald-400 dark:hover:border-emerald-600
                  hover:bg-slate-100 dark:hover:bg-slate-800/60
                  text-sm font-medium text-slate-700 dark:text-slate-300
                  transition-all duration-200 ease-in-out
                "
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:inline max-w-24 truncate">{user.firstName}</span>
                <ChevronDown size={13} className={`transition-transform duration-150 ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="
                  absolute right-0 top-full mt-2 w-52
                  bg-white dark:bg-slate-900
                  rounded-2xl shadow-xl
                  border border-slate-200 dark:border-slate-800
                  overflow-hidden z-50
                  animate-in fade-in slide-in-from-top-1 duration-150
                ">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm truncate">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                      {user.role.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    <Link
                      href="/marketplace"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                    >
                      <ShoppingBag size={15} className="text-slate-400 dark:text-slate-500" />
                      {t("marketplace")}
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                    >
                      <Package size={15} className="text-slate-400 dark:text-slate-500" />
                      My Orders
                    </Link>
                    <Link
                      href="/auth"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
                    >
                      <Settings size={15} className="text-slate-400 dark:text-slate-500" />
                      {t("profile")}
                    </Link>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-slate-100 dark:border-slate-800 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
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
                className="
                  hidden sm:flex items-center gap-1.5
                  text-sm font-medium
                  text-slate-700 dark:text-slate-300
                  hover:text-emerald-600 dark:hover:text-emerald-400
                  border border-slate-200 dark:border-slate-700
                  hover:border-emerald-400 dark:hover:border-emerald-600
                  px-3 py-1.5 rounded-xl
                  transition-all duration-200 ease-in-out
                "
              >
                <User size={14} />
                {t("signIn")}
              </Link>
              <Link
                href="/auth"
                className="
                  hidden sm:flex items-center gap-1.5
                  text-sm font-semibold text-white
                  bg-emerald-600 hover:bg-emerald-700
                  px-3 py-1.5 rounded-xl
                  transition-all duration-200 ease-in-out
                "
              >
                <ShoppingBag size={14} />
                {t("signUp")}
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="
              md:hidden w-9 h-9 flex items-center justify-center rounded-xl
              border border-slate-200 dark:border-slate-700
              text-slate-600 dark:text-slate-400
              hover:bg-slate-100 dark:hover:bg-slate-800/60
              transition-all duration-200 ease-in-out
            "
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
        <div className="
          md:hidden
          border-t border-slate-200 dark:border-slate-800
          bg-slate-50 dark:bg-slate-950
          px-4 py-4 space-y-1 shadow-md
          transition-all duration-200 ease-in-out
        ">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`
                block px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 ease-in-out
                ${isActive(href)
                  ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }
              `}
            >
              {label}
            </Link>
          ))}

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {user.role.replace(/_/g, " ").toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-200"
                >
                  <LogOut size={15} />
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all duration-200"
                >
                  <User size={14} />{t("signIn")}
                </Link>
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all duration-200"
                >
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
