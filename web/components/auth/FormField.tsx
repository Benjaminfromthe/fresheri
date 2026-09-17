"use client";

import { forwardRef } from "react";

// ─────────────────────────────────────────────────────────────
// Generic labelled input — shared across all auth forms
// ─────────────────────────────────────────────────────────────

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, className = "", ...rest }, ref) => (
    <div className="space-y-1" data-error={!!error || undefined}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 border rounded-xl text-sm
            focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent
            transition-colors
            ${error
              ? "border-red-400 bg-red-50 placeholder-red-300"
              : "border-gray-200 bg-white hover:border-gray-300 placeholder-gray-400"}
            ${className}
          `}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);

FormField.displayName = "FormField";
export default FormField;
