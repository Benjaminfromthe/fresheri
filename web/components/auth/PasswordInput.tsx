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
    const t = useTranslations("auth");
    const [visible, setVisible] = useState(false);

    return (
      <div className="space-y-1.5" data-error={!!error || undefined}>
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            <Lock size={15} />
          </div>
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            className={`
              w-full pl-10 pr-11 py-3 border-2 rounded-xl text-sm text-gray-900
              placeholder:text-gray-400
              focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
              transition-all duration-150
              ${error
                ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"
                : "border-gray-300 bg-white hover:border-gray-400"}
              ${className}
            `}
            {...rest}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors p-1"
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
