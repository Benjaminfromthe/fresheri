import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Home, AlertTriangle } from "lucide-react";

export default function LocaleNotFound() {
  const t = useTranslations("errors");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
          <AlertTriangle size={32} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("pageNotFound")}</h1>
          <p className="text-gray-500 text-sm mt-2">{t("pageNotFoundDesc")}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Home size={15} />
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
