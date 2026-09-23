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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("somethingWrong")}</h1>
          <p className="text-gray-500 text-sm mt-2">{t("somethingWrongDesc")}</p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-red-400 mt-2 font-mono">{error.message}</p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <RefreshCw size={15} />
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Home size={15} />
            {t("goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
