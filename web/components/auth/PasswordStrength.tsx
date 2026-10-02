"use client";

import { useTranslations } from "next-intl";
import { scorePassword } from "@/lib/auth/schemas";

interface PasswordStrengthProps {
  password: string;
}

const STRENGTH_CONFIG = [
  { min: 1, labelKey: "passwordStrengthWeak",   bar: "bg-red-400",    text: "text-red-500 dark:text-red-400"    },
  { min: 2, labelKey: "passwordStrengthFair",   bar: "bg-amber-400",  text: "text-amber-600 dark:text-amber-400" },
  { min: 3, labelKey: "passwordStrengthGood",   bar: "bg-blue-400",   text: "text-blue-600 dark:text-blue-400"   },
  { min: 4, labelKey: "passwordStrengthStrong", bar: "bg-emerald-500",text: "text-emerald-600 dark:text-emerald-400" },
] as const;

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const t     = useTranslations("auth");
  const score = scorePassword(password);

  if (score === 0) return null;

  const config = STRENGTH_CONFIG[score - 1];

  return (
    <div className="space-y-1.5 mt-1">
      {/* 4-segment bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              seg <= score ? config.bar : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      {/* Label + hint */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${config.text}`}>
          {t(config.labelKey)}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {t("passwordStrengthHint")}
        </span>
      </div>
    </div>
  );
}
