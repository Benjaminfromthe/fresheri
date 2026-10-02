"use client";

import { forwardRef, useState } from "react";

// ─────────────────────────────────────────────────────────────
// FloatingInput — label floats up when field is focused/filled
// Dark-mode: bg-slate-900 surface, slate-700 border at rest,
// green-500 on focus, red-400 on error.
// ─────────────────────────────────────────────────────────────

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label:        string;
  error?:       string;
  inputPrefix?: React.ReactNode;
  suffix?:      React.ReactNode;
  shake?:       boolean;
}

const FloatingInput = forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, error, inputPrefix, suffix, shake = false, className = "", ...rest }, ref) => {
    const [focused, setFocused] = useState(false);

    const hasValue   = Boolean(rest.value || rest.defaultValue);
    const isFloating = focused || hasValue || Boolean(rest.placeholder);

    return (
      <div className="relative w-full">
        <div
          className={`
            relative flex items-center w-full rounded-2xl border-2
            bg-white dark:bg-slate-900
            transition-all duration-200 ease-in-out
            ${error
              ? "border-red-400 shadow-sm shadow-red-100 dark:shadow-red-950/30"
              : focused
                ? "border-emerald-500 shadow-sm shadow-emerald-100 dark:shadow-emerald-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }
            ${shake ? "animate-[shake_0.35s_ease-in-out]" : ""}
          `}
        >
          {/* Left prefix (e.g. country code) */}
          {inputPrefix && (
            <div className="flex items-center pl-3.5 shrink-0">
              {inputPrefix}
              <div className="ml-2.5 w-px h-5 bg-slate-200 dark:bg-slate-700 mr-1" />
            </div>
          )}

          {/* Floating label */}
          <label
            className={`
              absolute pointer-events-none select-none font-medium transition-all duration-200
              ${inputPrefix ? "left-24" : "left-4"}
              ${isFloating
                ? "-top-2.5 text-[10px] px-1.5 rounded-md z-10 " +
                  "bg-white dark:bg-slate-900 " +
                  (error
                    ? "text-red-500"
                    : focused
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-500 dark:text-slate-400")
                : "top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500"
              }
            `}
          >
            {label}
          </label>

          {/* Input */}
          <input
            ref={ref}
            className={`
              w-full bg-transparent outline-none text-sm
              text-slate-900 dark:text-slate-100
              py-3.5 placeholder-transparent
              ${inputPrefix ? "pl-2" : "pl-4"}
              ${suffix ? "pr-10" : "pr-4"}
              ${className}
            `}
            onFocus={(e) => { setFocused(true);  rest.onFocus?.(e); }}
            onBlur={(e)  => { setFocused(false); rest.onBlur?.(e);  }}
            {...rest}
          />

          {/* Right suffix (e.g. show/hide password) */}
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1 px-1">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}

        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20%     { transform: translateX(-6px); }
            40%     { transform: translateX(6px); }
            60%     { transform: translateX(-4px); }
            80%     { transform: translateX(4px); }
          }
        `}</style>
      </div>
    );
  }
);

FloatingInput.displayName = "FloatingInput";
export default FloatingInput;
