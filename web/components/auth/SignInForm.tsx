"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signInSchema, SignInValues } from "@/lib/auth/schemas";
import { authSignIn, saveSession }    from "@/lib/api-client";
import FloatingInput          from "./FloatingInput";
import FloatingPasswordInput  from "./FloatingPasswordInput";
import CountryCodePicker      from "./CountryCodePicker";

interface SignInFormProps {
  onSuccess?: () => void;
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const t = useTranslations("auth");
  const [countryCode, setCountryCode] = useState("+250");
  const [shakePhone, setShakePhone]   = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { rememberMe: false },
    mode: "onTouched",
  });

  const phoneValue = watch("phone") ?? "";

  const onSubmit = async (_data: SignInValues) => {
    setGlobalError(null);
    try {
      const result = await authSignIn({ phone: _data.phone, password: _data.password });
      saveSession(result);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Please try again.";
      setGlobalError(msg);
      // Shake the phone field
      setShakePhone(true);
      setTimeout(() => setShakePhone(false), 400);
    }
  };

  const e = (key?: string): string | undefined => {
    if (!key) return undefined;
    try { return key.startsWith("err") ? t(key as Parameters<typeof t>[0]) : key; }
    catch { return key; }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* Global error */}
      {globalError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
          <span className="text-red-500 text-base">⚠</span>
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">{globalError}</p>
        </div>
      )}

      {/* Phone with country code */}
      <FloatingInput
        label={t("phone")}
        type="tel"
        autoComplete="tel"
        shake={shakePhone}
        error={e(errors.phone?.message)}
        value={phoneValue}
        inputPrefix={
          <CountryCodePicker value={countryCode} onChange={setCountryCode} />
        }
        {...register("phone")}
      />

      {/* Password */}
      <FloatingPasswordInput
        label={t("password")}
        autoComplete="current-password"
        error={e(errors.password?.message)}
        {...register("password")}
      />

      {/* Remember me + forgot */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2.5 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              className="peer sr-only"
              {...register("rememberMe")}
            />
            <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 peer-checked:bg-green-600 peer-checked:border-green-600 transition-all" />
            <svg className="absolute inset-0 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
              viewBox="0 0 16 16" fill="none">
              <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
            {t("rememberMe")}
          </span>
        </label>
        <button type="button" className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 font-medium transition-colors">
          {t("forgotPassword")}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-70 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-green-600/20 hover:shadow-green-600/30 mt-2"
      >
        {isSubmitting ? (
          <><Loader2 size={17} className="animate-spin" /><span>{t("signingIn")}</span></>
        ) : (
          <span>{t("signInBtn")}</span>
        )}
      </button>
    </form>
  );
}
