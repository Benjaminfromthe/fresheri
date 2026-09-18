"use client";

import { useTranslations } from "next-intl";
import { Search, Truck, CheckCircle2 } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("landing");

  const STEPS = [
    { icon: Search,        titleKey: "how1Title", descKey: "how1Desc", step: "01", color: "bg-green-100 text-green-700"  },
    { icon: Truck,         titleKey: "how2Title", descKey: "how2Desc", step: "02", color: "bg-blue-100 text-blue-700"    },
    { icon: CheckCircle2,  titleKey: "how3Title", descKey: "how3Desc", step: "03", color: "bg-purple-100 text-purple-700" },
  ] as const;

  return (
    <section id="how" className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 mb-12">
          {t("howTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, titleKey, descKey, step, color }) => (
            <div key={step} className="relative text-center">
              {/* Step number connector line */}
              <div className="flex items-center justify-center mb-4 relative">
                <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center`}>
                  <Icon size={26} />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{t(titleKey)}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
