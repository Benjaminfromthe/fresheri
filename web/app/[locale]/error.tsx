"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("[Page Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-150">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-500 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("somethingWrong")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{t("somethingWrongDesc")}</p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-red-400 dark:text-red-500 mt-2 font-mono">{error.message}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950"
          >
            <RefreshCw size={15} />
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Home size={15} />
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
