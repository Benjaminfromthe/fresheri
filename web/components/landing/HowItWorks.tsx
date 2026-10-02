"use client";

import { useTranslations } from "next-intl";
import { Search, Truck, CheckCircle2 } from "lucide-react";

export default function HowItWorks() {
  const t = useTranslations("landing");

  const STEPS = [
    {
      icon: Search,
      titleKey: "how1Title",
      descKey:  "how1Desc",
      step:     "01",
      lightBg:  "bg-emerald-100 text-emerald-700",
      darkBg:   "dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      icon: Truck,
      titleKey: "how2Title",
      descKey:  "how2Desc",
      step:     "02",
      lightBg:  "bg-blue-100 text-blue-700",
      darkBg:   "dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      icon: CheckCircle2,
      titleKey: "how3Title",
      descKey:  "how3Desc",
      step:     "03",
      lightBg:  "bg-purple-100 text-purple-700",
      darkBg:   "dark:bg-purple-900/30 dark:text-purple-400",
    },
  ] as const;

  return (
    <section id="how" className="bg-slate-50 dark:bg-slate-950 py-16 sm:py-20 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-12">
          {t("howTitle")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map(({ icon: Icon, titleKey, descKey, step, lightBg, darkBg }) => (
            <div key={step} className="relative text-center">
              <div className="flex items-center justify-center mb-4 relative">
                {/* Icon pill */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${lightBg} ${darkBg}`}>
                  <Icon size={26} />
                </div>
                {/* Step number badge — high-contrast in both modes */}
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-full flex items-center justify-center leading-none">
                  {step}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-2">
                {t(titleKey)}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                {t(descKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
