"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Loader2 } from "lucide-react";
import { signInSchema, SignInValues } from "@/lib/auth/schemas";
import PasswordInput from "./PasswordInput";
import FormField     from "./FormField";

interface SignInFormProps {
  onSuccess?: () => void;
}

export default function SignInForm({ onSuccess }: SignInFormProps) {
  const t = useTranslations("auth");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { rememberMe: false },
    mode: "onTouched",
  });

  const onSubmit = async (_data: SignInValues) => {
    // TODO: wire to POST /api/auth/signin when backend auth endpoint is ready.
    await new Promise((r) => setTimeout(r, 600));
    onSuccess?.();
  };

  // Safe error translator — never throws on missing keys
  const e = (key?: string): string | undefined => {
    if (!key) return undefined;
    try {
      if (key.startsWith("err")) return t(key as Parameters<typeof t>[0]);
      return key;
    } catch { return key; }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* Phone */}
      <FormField
        label={t("phone")}
        placeholder={t("phoneHint")}
        type="tel"
        autoComplete="tel"
        icon={<Phone size={15} />}
        error={e(errors.phone?.message)}
        {...register("phone")}
      />

      {/* Password */}
      <PasswordInput
        label={t("password")}
        autoComplete="current-password"
        error={e(errors.password?.message)}
        {...register("password")}
      />

      {/* Remember me + forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-400"
            {...register("rememberMe")}
          />
          <span className="text-sm text-gray-600">{t("rememberMe")}</span>
        </label>
        <button type="button" className="text-sm text-green-600 hover:text-green-800 transition-colors font-medium">
          {t("forgotPassword")}
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {isSubmitting
          ? <><Loader2 size={16} className="animate-spin" />{t("signingIn")}</>
          : t("signInBtn")}
      </button>

    </form>
  );
}
