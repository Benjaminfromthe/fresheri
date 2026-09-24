"use client";

import { useState, useTransition } from "react";
import { useTranslations }         from "next-intl";
import {
  X, ShieldCheck, Package, Phone, CheckCircle2,
  Loader2, ArrowRight, Sprout,
} from "lucide-react";
import { safeTFactory, AUTH_GATE_FALLBACKS } from "@/lib/i18n-safe";
import type { GateAction }                   from "@/lib/auth/use-auth-gate";
import SignInForm                             from "./SignInForm";
import SignUpForm                             from "./SignUpForm";
import GoogleSignInButton                    from "./GoogleSignInButton";
import LanguageSwitcher                      from "@/components/LanguageSwitcher";

// ─────────────────────────────────────────────────────────────
// AuthGateModal
// Non-intrusive modal that intercepts unauthenticated actions.
// Shows value props + sign-in / sign-up forms inline.
// ─────────────────────────────────────────────────────────────

interface AuthGateModalProps {
  open:          boolean;
  action:        GateAction | null;
  onClose:       () => void;
  onAuthSuccess: () => void;
}

type Tab = "signup" | "signin";

const ACTION_KEY_MAP: Record<GateAction, string> = {
  viewDetails: "actionViewDetails",
  placeOrder:  "actionPlaceOrder",
  contact:     "actionContact",
  publish:     "actionPublish",
  wishlist:    "actionWishlist",
  filter:      "actionFilter",
};

const VALUE_PROPS = [
  { icon: Package,      key: "valueProp1" },
  { icon: Phone,        key: "valueProp2" },
  { icon: CheckCircle2, key: "valueProp3" },
] as const;

export default function AuthGateModal({
  open, action, onClose, onAuthSuccess,
}: AuthGateModalProps) {
  const rawT = useTranslations("authGate");
  const tc   = useTranslations("common");
  // Safe fallback — never renders raw keys
  const t    = safeTFactory(rawT as never, AUTH_GATE_FALLBACKS);

  const [tab, setTab]       = useState<Tab>("signup");
  const [, startTransition] = useTransition();

  if (!open) return null;

  const switchTab = (next: Tab) => startTransition(() => setTab(next));
  const actionKey = action ? ACTION_KEY_MAP[action] : null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* ── Left: Value proposition panel ── */}
        <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 text-white p-8 w-80 shrink-0">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sprout size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl">{tc("appName")}</span>
          </div>

          {/* Action context */}
          <div className="relative z-10 space-y-5">
            {actionKey && (
              <div className="bg-white/15 rounded-2xl px-4 py-3 border border-white/20">
                <p className="text-xs text-green-200 font-medium uppercase tracking-wide mb-1">
                  Why sign up?
                </p>
                <p className="text-sm font-semibold leading-snug">
                  {t(actionKey)}
                </p>
              </div>
            )}

            {/* Value props */}
            <div className="space-y-3">
              {VALUE_PROPS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={13} className="text-white" />
                  </div>
                  <p className="text-xs text-green-100 leading-relaxed">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="relative z-10 flex items-start gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
            <ShieldCheck size={13} className="text-green-300 shrink-0 mt-0.5" />
            <p className="text-xs text-green-100 leading-relaxed">{t("privacy")}</p>
          </div>
        </div>

        {/* ── Right: Auth form panel ── */}
        <div className="flex-1 flex flex-col overflow-y-auto">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div>
              <h2 className="font-bold text-gray-900 text-xl leading-tight">
                {t("title")}
              </h2>
              <p className="text-gray-500 text-sm mt-1 max-w-xs leading-snug">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <LanguageSwitcher />
              <button
                onClick={onClose}
                aria-label={tc("close")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tab pills */}
          <div className="px-6 pb-4 shrink-0">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["signup", "signin"] as Tab[]).map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => switchTab(tb)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    tab === tb
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tb === "signup" ? t("signUpBtn") : t("signInBtn")}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            {/* Google button */}
            <GoogleSignInButton onSuccess={onAuthSuccess} />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Form */}
            {tab === "signup" ? (
              <SignUpForm onSuccess={onAuthSuccess} />
            ) : (
              <SignInForm onSuccess={onAuthSuccess} />
            )}

            {/* Switch tab link */}
            <p className="text-sm text-center text-gray-500">
              {tab === "signup" ? t("alreadyHave") : t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab(tab === "signup" ? "signin" : "signup")}
                className="text-green-600 hover:text-green-800 font-semibold transition-colors"
              >
                {tab === "signup" ? t("signInBtn") : t("signUpBtn")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
