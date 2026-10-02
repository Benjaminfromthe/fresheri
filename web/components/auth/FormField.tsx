"use client";

import { forwardRef } from "react";

// ─────────────────────────────────────────────────────────────
// FormField — labelled input for auth forms.
// Dark: slate-800 bg, slate-700 border at rest,
// emerald-500 on focus, red-400 on error.
// ─────────────────────────────────────────────────────────────

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, icon, className = "", ...rest }, ref) => (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full ${icon ? "pl-10" : "pl-3.5"} pr-3.5 py-3
            border-2 rounded-xl text-sm
            text-slate-900 dark:text-slate-100
            bg-white dark:bg-slate-800
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none
            focus:border-emerald-500 focus:ring-2
            focus:ring-emerald-100 dark:focus:ring-emerald-900/30
            transition-all duration-150 ease-in-out
            ${error
              ? "border-red-400 bg-red-50 dark:bg-red-950/30 placeholder:text-red-300 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
            }
            ${className}
          `}
          {...rest}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  )
);

FormField.displayName = "FormField";
export default FormField;
