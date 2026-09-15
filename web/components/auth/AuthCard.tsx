"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Sprout, CheckCircle2 } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MarketingPanel   from "./MarketingPanel";
import SignInForm        from "./SignInForm";
import SignUpForm        from "./SignUpForm";

type Tab = "signin" | "signup";

// ─────────────────────────────────────────────────────────────
// Success overlay shown after a successful auth action
// ─────────────────────────────────────────────────────────────

function SuccessOverlay({ tab }: { tab: Tab }) {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
        <CheckCircle2 size={36} className="text-green-500" />
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-xl">
          {tab === "signin" ? t("signIn") : t("signUp")}!
        </h3>
        <p className="text-gray-400 text-sm mt-1">
          {tab === "signin"
            ? "Redirecting to your dashboard…"
            : "Your account is being set up…"}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthCard — the right-side form panel
// ─────────────────────────────────────────────────────────────

export default function AuthCard() {
  const t = useTranslations("auth");
  const [tab, setTab]           = useState<Tab>("signin");
  const [success, setSuccess]   = useState(false);
  const [, startTransition]     = useTransition();

  const switchTab = (next: Tab) => {
    startTransition(() => {
      setTab(next);
      setSuccess(false);
    });
  };

  const handleSuccess = () => setSuccess(true);

  return (
    // Full viewport — left marketing panel + right form
    <div className="min-h-screen flex">

      {/* ── Left: Marketing panel (hidden on mobile) ── */}
      <div className="flex-1 max-w-lg xl:max-w-xl">
        <MarketingPanel />
      </div>

      {/* ── Right: Auth form ── */}
      <div className="flex-1 flex flex-col bg-white min-h-screen overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          {/* Mobile logo — hidden on md where the left panel shows it */}
          <div className="flex items-center gap-2 md:opacity-0 md:pointer-events-none">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900">Fresheri</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-8 max-w-xl w-full mx-auto">

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {tab === "signin" ? t("tabSignIn") : t("tabSignUp")}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {tab === "signin" ? t("noAccount") : t("hasAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab(tab === "signin" ? "signup" : "signin")}
                className="text-green-600 hover:text-green-800 font-semibold transition-colors"
              >
                {tab === "signin" ? t("tabSignUp") : t("tabSignIn")}
              </button>
            </p>
          </div>

          {/* Tab pills */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            {(["signin", "signup"] as Tab[]).map((t_) => (
              <button
                key={t_}
                type="button"
                onClick={() => switchTab(t_)}
                className={`
                  flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200
                  ${tab === t_
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"}
                `}
              >
                {t_ === "signin" ? t("tabSignIn") : t("tabSignUp")}
              </button>
            ))}
          </div>

          {/* Form or success */}
          {success ? (
            <SuccessOverlay tab={tab} />
          ) : tab === "signin" ? (
            <SignInForm onSuccess={handleSuccess} />
          ) : (
            <SignUpForm onSuccess={handleSuccess} />
          )}

          {/* Mobile privacy note */}
          <div className="mt-8 md:hidden bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              🔒 {t("privacyNotice")}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
