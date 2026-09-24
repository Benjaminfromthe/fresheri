"use client";

import { useTranslations } from "next-intl";
import { Sprout, Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t    = useTranslations("landing");
  const tc   = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">{tc("appName")}</p>
              <p className="text-xs mt-0.5">{t("footerTagline")}</p>
            </div>
          </div>

          {/* Footer links */}
          <nav className="flex flex-wrap gap-5 text-sm" aria-label="Footer navigation">
            <Link href="/marketplace" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/#how" className="hover:text-white transition-colors">
              {t("footerTerms")}
            </Link>
            <Link href="/contact" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Mail size={12} />
              {t("footerContact")}
            </Link>
            <a
              href="mailto:privacy@fresheri.app"
              className="hover:text-white transition-colors"
            >
              {t("footerPrivacy")}
            </a>
          </nav>
        </div>

        {/* Copyright — using unicode escape to avoid encoding corruption */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-center">
          {`\u00A9 ${year} Fresheri. `}
          {t("footerRights", { year: String(year) })
            .replace(/^.*Fresheri\.\s*/i, "") || "All rights reserved."}
        </div>
      </div>
    </footer>
  );
}
