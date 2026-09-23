"use client";

import { forwardRef } from "react";

// ─────────────────────────────────────────────────────────────
// Generic labelled input — used across all auth forms.
// Design: clearly visible border at rest, green ring on focus,
// red border on error. Never invisible.
// ─────────────────────────────────────────────────────────────

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, className = "", ...rest }, ref) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${icon ? "pl-10" : "pl-3.5"} pr-3.5 py-3
            border-2 rounded-xl text-sm text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100
            transition-all duration-150
            ${error
              ? "border-red-400 bg-red-50 placeholder:text-red-300 focus:border-red-500 focus:ring-red-100"
              : "border-gray-300 bg-white hover:border-gray-400"}
            ${className}
          `}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
);

FormField.displayName = "FormField";
export default FormField;
