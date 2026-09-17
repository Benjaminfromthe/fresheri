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
      <div className="space-y-1" data-error={!!error || undefined}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Lock size={15} />
          </div>
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            className={`
              w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
              transition-colors
              ${error ? "border-red-400 bg-red-50" : "border-gray-200 bg-white hover:border-gray-300"}
              ${className}
            `}
            {...rest}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
export default PasswordInput;
