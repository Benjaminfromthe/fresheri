"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, Users, MapPin, ShieldCheck } from "lucide-react";

export default function StatsStrip() {
  const t = useTranslations("landing");

  const STATS = [
    { icon: TrendingUp,  valueKey: "stat1Value", labelKey: "stat1Label", color: "text-green-600"  },
    { icon: Users,       valueKey: "stat2Value", labelKey: "stat2Label", color: "text-blue-600"   },
    { icon: MapPin,      valueKey: "stat3Value", labelKey: "stat3Label", color: "text-purple-600" },
    { icon: ShieldCheck, valueKey: "stat4Value", labelKey: "stat4Label", color: "text-amber-600"  },
  ] as const;

  return (
    <section className="bg-white border-y border-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
          {t("statTitle")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, valueKey, labelKey, color }) => (
            <div key={valueKey} className="text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 mb-2 ${color}`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t(valueKey)}</p>
              <p className="text-xs text-gray-500 mt-1">{t(labelKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
