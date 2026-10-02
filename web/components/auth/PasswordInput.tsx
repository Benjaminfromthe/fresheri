"use client";

import { useState, forwardRef } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Lock } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ error, label, className = "", ...rest }, ref) => {
    const t       = useTranslations("auth");
    const [visible, setVisible] = useState(false);

    return (
      <div className="space-y-1.5" data-error={!!error || undefined}>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Lock size={15} />
          </div>
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            className={`
              w-full pl-10 pr-11 py-3 border-2 rounded-xl text-sm
              text-slate-900 dark:text-slate-100
              bg-white dark:bg-slate-800
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:outline-none
              focus:border-emerald-500 focus:ring-2
              focus:ring-emerald-100 dark:focus:ring-emerald-900/30
              transition-all duration-150 ease-in-out
              ${error
                ? "border-red-400 bg-red-50 dark:bg-red-950/30 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30"
                : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }
              ${className}
            `}
            {...rest}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
