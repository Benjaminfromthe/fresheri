import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Home, AlertTriangle } from "lucide-react";

export default function LocaleNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-150">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-amber-500 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{t("pageNotFound")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{t("pageNotFoundDesc")}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950"
        >
          <Home size={15} />
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
