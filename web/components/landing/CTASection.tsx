"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function CTASection() {
  const t = useTranslations("landing");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 py-16 sm:py-20">
      {/* Decorative blur circles */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
          {t("ctaTitle")}
        </h2>
        <p className="text-green-100 text-base sm:text-lg mb-8 max-w-xl mx-auto">
          {t("ctaSub")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth"
            className="flex items-center justify-center gap-2 bg-white text-green-700 font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors text-sm active:scale-95"
          >
            <ShoppingBag size={16} />
            {t("ctaSignUp")}
          </Link>
          <Link
            href="/marketplace"
            className="flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-xl hover:border-white hover:bg-white/10 transition-all text-sm active:scale-95"
          >
            {t("ctaBrowse")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
