"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Sprout } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { toast }          from "@/components/ui/Toaster";
import LanguageSwitcher   from "@/components/LanguageSwitcher";
import MarketingPanel     from "./MarketingPanel";
import SignInForm         from "./SignInForm";
import SignUpForm         from "./SignUpForm";
import GoogleSignInButton from "./GoogleSignInButton";

type Tab = "signin" | "signup";

// ─────────────────────────────────────────────────────────────
// Spring-animated tab switcher
// ─────────────────────────────────────────────────────────────

function TabSwitcher({
  tab,
  onSwitch,
  labels,
}: {
  tab:      Tab;
  onSwitch: (t: Tab) => void;
  labels:   { signin: string; signup: string };
}) {
  const signinRef = useRef<HTMLButtonElement>(null);
  const signupRef = useRef<HTMLButtonElement>(null);
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = tab === "signin" ? signinRef : signupRef;
    if (activeRef.current) {
      const { offsetLeft, offsetWidth } = activeRef.current;
      setPill({ left: offsetLeft, width: offsetWidth });
    }
  }, [tab]);

  return (
    <div className="relative flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1.5 gap-1">
      {/* Sliding pill */}
      <div
        className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm transition-[left,width]"
        style={{
          left:       `${pill.left}px`,
          width:      `${pill.width}px`,
          transition: "left 0.28s cubic-bezier(0.34,1.56,0.64,1), width 0.2s ease",
        }}
      />
      {(["signin", "signup"] as Tab[]).map((t_) => (
        <button
          key={t_}
          ref={t_ === "signin" ? signinRef : signupRef}
          type="button"
          onClick={() => onSwitch(t_)}
          className={`
            relative z-10 flex-1 py-2.5 rounded-xl text-sm font-semibold
            transition-colors duration-150 select-none
            ${tab === t_
              ? "text-slate-900 dark:text-slate-100"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }
          `}
        >
          {t_ === "signin" ? labels.signin : labels.signup}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AuthCard
// ─────────────────────────────────────────────────────────────

export default function AuthCard() {
  const t      = useTranslations("auth");
  const tt     = useTranslations("toast");
  const router = useRouter();

  const [tab, setTab]       = useState<Tab>("signin");
  const [, startTransition] = useTransition();

  const switchTab = (next: Tab) => startTransition(() => setTab(next));

  const handleSignupSuccess = () => { toast.success(tt("signupSuccess")); router.replace("/marketplace"); };
  const handleSigninSuccess = () => { toast.success(tt("signinSuccess")); router.replace("/marketplace"); };
  const handleGoogleSuccess = () => { toast.success(tt("signinSuccess")); router.replace("/marketplace"); };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950 transition-colors duration-150">

      {/* ── Left: marketing panel ── */}
      <div className="flex-1 max-w-[460px] xl:max-w-[520px] shrink-0">
        <MarketingPanel />
      </div>

      {/* ── Right: auth form ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 min-h-screen overflow-y-auto transition-colors duration-150">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          {/* Mobile logo — hidden on desktop */}
          <div className="flex items-center gap-2 md:opacity-0 md:pointer-events-none">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 text-base">Fresheri</span>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-16 py-8 max-w-lg w-full mx-auto">

          <div className="mb-6">
            <TabSwitcher
              tab={tab}
              onSwitch={switchTab}
              labels={{ signin: t("tabSignIn"), signup: t("tabSignUp") }}
            />
          </div>

          <GoogleSignInButton onSuccess={handleGoogleSuccess} />

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-xs text-slate-400 dark:text-slate-600 font-medium tracking-wide">
              {t("orContinueWith")}
            </span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <div key={tab} style={{ animation: "fadeSlideIn 0.2s ease-out" }}>
            {tab === "signin"
              ? <SignInForm onSuccess={handleSigninSuccess} />
              : <SignUpForm onSuccess={handleSignupSuccess} />
            }
          </div>

          {/* Mobile privacy note */}
          <div className="mt-8 md:hidden bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl px-4 py-3">
            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              🔒 {t("privacyNotice")}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
