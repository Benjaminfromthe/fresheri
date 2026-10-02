"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";

interface PrivacyBadgeProps {
  /** Pass a translated string to override the default message */
  message?: string;
  compact?: boolean;
}

export default function PrivacyBadge({ message, compact = false }: PrivacyBadgeProps) {
  const t    = useTranslations("privacy");
  const text = message ?? t("badgeDefault");

  if (compact) {
    return (
      <span className="
        inline-flex items-center gap-1 text-xs font-medium
        bg-blue-50 dark:bg-blue-950/40
        text-blue-600 dark:text-blue-400
        border border-blue-100 dark:border-blue-900/30
        px-2 py-0.5 rounded-full
        transition-all duration-200 ease-in-out
      ">
        <ShieldCheck size={10} />
        {t("badgeCompact")}
      </span>
    );
  }

  return (
    <div className="
      flex items-start gap-2 rounded-xl px-3 py-2.5
      bg-blue-50 dark:bg-blue-950/30
      border border-blue-100 dark:border-blue-900/40
      transition-all duration-200 ease-in-out
    ">
      <ShieldCheck size={14} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
      <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{text}</p>
    </div>
  );
}
