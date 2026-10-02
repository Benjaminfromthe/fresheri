"use client";

import { useState, useTransition } from "react";
import { useTranslations }         from "next-intl";
import {
  X, ShieldCheck, Package, Phone, CheckCircle2, Sprout,
} from "lucide-react";
import { safeTFactory, AUTH_GATE_FALLBACKS } from "@/lib/i18n-safe";
import type { GateAction }                   from "@/lib/auth/use-auth-gate";
import SignInForm                             from "./SignInForm";
import SignUpForm                             from "./SignUpForm";
import GoogleSignInButton                    from "./GoogleSignInButton";
import LanguageSwitcher                      from "@/components/LanguageSwitcher";

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
  const t    = safeTFactory(rawT as never, AUTH_GATE_FALLBACKS);

  const [tab, setTab]       = useState<Tab>("signup");
  const [, startTransition] = useTransition();

  if (!open) return null;

  const switchTab = (next: Tab) => startTransition(() => setTab(next));
  const actionKey = action ? ACTION_KEY_MAP[action] : null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
    >
      <div className="
        bg-white dark:bg-slate-900
        w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden
        flex flex-col md:flex-row max-h-[90vh]
        transition-colors duration-150
      ">

        {/* ── Left: value proposition panel ── */}
        <div className="relative hidden md:flex flex-col justify-between bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white p-8 w-80 shrink-0">
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
                <p className="text-xs text-emerald-200 font-medium uppercase tracking-wide mb-1">
                  Why sign up?
                </p>
                <p className="text-sm font-semibold leading-snug">{t(actionKey)}</p>
              </div>
            )}
            <div className="space-y-3">
              {VALUE_PROPS.map(({ icon: Icon, key }) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={13} className="text-white" />
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <div className="relative z-10 flex items-start gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2.5">
            <ShieldCheck size={13} className="text-emerald-300 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-100 leading-relaxed">{t("privacy")}</p>
          </div>
        </div>

        {/* ── Right: auth form panel ── */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white dark:bg-slate-900">

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xl leading-tight">
                {t("title")}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs leading-snug">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <LanguageSwitcher />
              <button
                onClick={onClose}
                aria-label={tc("close")}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tab pills */}
          <div className="px-6 pb-4 shrink-0">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              {(["signup", "signin"] as Tab[]).map((tb) => (
                <button
                  key={tb}
                  type="button"
                  onClick={() => switchTab(tb)}
                  className={`
                    flex-1 py-2 rounded-lg text-sm font-semibold
                    transition-all duration-150 ease-in-out
                    ${tab === tb
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                    }
                  `}
                >
                  {tb === "signup" ? t("signUpBtn") : t("signInBtn")}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
            <GoogleSignInButton onSuccess={onAuthSuccess} />

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {tab === "signup"
              ? <SignUpForm onSuccess={onAuthSuccess} />
              : <SignInForm onSuccess={onAuthSuccess} />
            }

            {/* Switch tab */}
            <p className="text-sm text-center text-slate-500 dark:text-slate-400">
              {tab === "signup" ? t("alreadyHave") : t("noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab(tab === "signup" ? "signin" : "signup")}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold transition-colors"
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
