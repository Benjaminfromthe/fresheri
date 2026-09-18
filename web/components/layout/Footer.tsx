"use client";

import { useTranslations } from "next-intl";
import { Sprout } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t  = useTranslations("landing");
  const tc = useTranslations("common");
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

          {/* Links */}
          <nav className="flex flex-wrap gap-4 text-sm" aria-label="Footer">
            {[
              { label: t("footerPrivacy"),  href: "/privacy"  },
              { label: t("footerTerms"),    href: "/terms"    },
              { label: t("footerContact"),  href: "/contact"  },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 text-xs text-center">
          {t("footerRights", { year: String(year) })}
        </div>
      </div>
    </footer>
  );
}
