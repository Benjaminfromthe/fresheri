"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, User, MapPin, Building2, Truck, Loader2, ShieldCheck } from "lucide-react";

import {
  AuthRole,
  getSignUpSchema,
  SignUpValues,
} from "@/lib/auth/schemas";

import RoleToggle      from "./RoleToggle";
import PasswordInput   from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import FormField       from "./FormField";

interface SignUpFormProps {
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Role-specific extra field sections
// ─────────────────────────────────────────────────────────────

function FarmerFields({
  register, errors, t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any; errors: any; t: (k: string) => string;
}) {
  return (
    <>
      <FormField
        label={t("farmName")}
        placeholder="e.g. Kirinyaga Farmers Cooperative"
        icon={<MapPin size={15} />}
        error={errors.farmName?.message ? t(errors.farmName.message) : undefined}
        {...register("farmName")}
      />
      <FormField
        label={t("cooperativeRegNumber")}
        placeholder="e.g. COOP-2024-001"
        icon={<Building2 size={15} />}
        error={errors.cooperativeRegNumber?.message ? t(errors.cooperativeRegNumber.message) : undefined}
        {...register("cooperativeRegNumber")}
      />
      <FormField
        label={t("farmLocation")}
        placeholder="e.g. Kirinyaga District"
        icon={<MapPin size={15} />}
        error={errors.farmLocation?.message ? t(errors.farmLocation.message) : undefined}
        {...register("farmLocation")}
      />
    </>
  );
}

function CommercialFields({
  register, errors, t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any; errors: any; t: (k: string) => string;
}) {
  return (
    <>
      <FormField
        label={t("businessName")}
        placeholder="e.g. Grand Hotel Kigali"
        icon={<Building2 size={15} />}
        error={errors.businessName?.message ? t(errors.businessName.message) : undefined}
        {...register("businessName")}
      />
      <FormField
        label={t("businessRegNumber")}
        placeholder="e.g. TIN-123456789"
        icon={<Building2 size={15} />}
        error={errors.businessRegNumber?.message ? t(errors.businessRegNumber.message) : undefined}
        {...register("businessRegNumber")}
      />
      <FormField
        label={t("businessAddress")}
        placeholder="e.g. KG 7 Ave, Kigali"
        icon={<MapPin size={15} />}
        error={errors.businessAddress?.message ? t(errors.businessAddress.message) : undefined}
        {...register("businessAddress")}
      />
    </>
  );
}

function LogisticsFields({
  register, errors, t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any; errors: any; t: (k: string) => string;
}) {
  return (
    <>
      <FormField
        label={t("vehicleType")}
        placeholder="e.g. 3-ton truck"
        icon={<Truck size={15} />}
        error={errors.vehicleType?.message ? t(errors.vehicleType.message) : undefined}
        {...register("vehicleType")}
      />
      <FormField
        label={t("vehicleRegNumber")}
        placeholder="e.g. KAA 123A"
        icon={<Truck size={15} />}
        error={errors.vehicleRegNumber?.message ? t(errors.vehicleRegNumber.message) : undefined}
        {...register("vehicleRegNumber")}
      />
      <FormField
        label={t("operatingRegion")}
        placeholder="e.g. Nairobi, Kirinyaga"
        icon={<MapPin size={15} />}
        error={errors.operatingRegion?.message ? t(errors.operatingRegion.message) : undefined}
        {...register("operatingRegion")}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main SignUpForm
// ─────────────────────────────────────────────────────────────

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const t = useTranslations("auth");
  const [role, setRole] = useState<AuthRole>(AuthRole.FARMER);
  const [watchedPassword, setWatchedPassword] = useState("");

  const schema = getSignUpSchema(role);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
  });

  // Watch password for strength indicator
  const passwordValue = watch("password" as keyof SignUpValues) as string ?? "";

  // When role changes, reset form to avoid stale field values
  const handleRoleChange = useCallback(
    (newRole: AuthRole) => {
      setRole(newRole);
      reset();
      setWatchedPassword("");
    },
    [reset]
  );

  const onSubmit = async (_data: SignUpValues) => {
    // TODO: wire to POST /api/auth/signup when backend auth endpoint is ready.
    // For now simulate a brief API call so the loading spinner is visible.
    await new Promise((r) => setTimeout(r, 600));
    onSuccess?.();
  };

  // Translate Zod error key → i18n string
  const e = (msg?: string) => (msg ? t(msg as Parameters<typeof t>[0]) : undefined);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

      {/* Role selector */}
      <RoleToggle value={role} onChange={handleRoleChange} />

      {/* Divider */}
      <div className="border-t border-gray-100 pt-1" />

      {/* Base fields: first name + last name side by side */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t("firstName")}
          placeholder="Jean"
          autoComplete="given-name"
          icon={<User size={15} />}
          error={e((errors as Record<string, { message?: string }>).firstName?.message)}
          {...register("firstName" as keyof SignUpValues)}
        />
        <FormField
          label={t("lastName")}
          placeholder="Mutabazi"
          autoComplete="family-name"
          icon={<User size={15} />}
          error={e((errors as Record<string, { message?: string }>).lastName?.message)}
          {...register("lastName" as keyof SignUpValues)}
        />
      </div>

      {/* Phone */}
      <FormField
        label={t("phone")}
        placeholder={t("phoneHint")}
        type="tel"
        autoComplete="tel"
        icon={<Phone size={15} />}
        error={e((errors as Record<string, { message?: string }>).phone?.message)}
        {...register("phone" as keyof SignUpValues)}
      />

      {/* Role-specific extra fields */}
      {(role === AuthRole.FARMER || role === AuthRole.COOPERATIVE) && (
        <FarmerFields register={register} errors={errors} t={t} />
      )}
      {role === AuthRole.COMMERCIAL_BUYER && (
        <CommercialFields register={register} errors={errors} t={t} />
      )}
      {role === AuthRole.LOGISTICS_PARTNER && (
        <LogisticsFields register={register} errors={errors} t={t} />
      )}

      {/* Password */}
      <div className="space-y-1">
        <PasswordInput
          label={t("password")}
          autoComplete="new-password"
          error={e((errors as Record<string, { message?: string }>).password?.message)}
          {...register("password" as keyof SignUpValues, {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setWatchedPassword(e.target.value),
          })}
        />
        <PasswordStrength password={watchedPassword || passwordValue} />
      </div>

      {/* Confirm password */}
      <PasswordInput
        label={t("confirmPassword")}
        autoComplete="new-password"
        error={e((errors as Record<string, { message?: string }>).confirmPassword?.message)}
        {...register("confirmPassword" as keyof SignUpValues)}
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <ShieldCheck size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-700">{t("privacyNoticeTitle")}</p>
          <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">{t("privacyNotice")}</p>
        </div>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        {t("termsNotice")}{" "}
        <button type="button" className="text-green-600 hover:underline font-medium">{t("termsLink")}</button>{" "}
        {t("and")}{" "}
        <button type="button" className="text-green-600 hover:underline font-medium">{t("privacyLink")}</button>.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {isSubmitting
          ? <><Loader2 size={16} className="animate-spin" />{t("signingUp")}</>
          : t("signUpBtn")}
      </button>

    </form>
  );
}
