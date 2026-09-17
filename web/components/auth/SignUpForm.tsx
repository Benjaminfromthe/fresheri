"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, User, MapPin, Building2, Truck, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

import {
  AuthRole,
  getSignUpSchema,
  SignUpValues,
} from "@/lib/auth/schemas";

import RoleToggle       from "./RoleToggle";
import PasswordInput    from "./PasswordInput";
import PasswordStrength from "./PasswordStrength";
import FormField        from "./FormField";

interface SignUpFormProps {
  onSuccess?: () => void;
}

// ─────────────────────────────────────────────────────────────
// Safe i18n error translator
// Returns the translated string if the key exists, otherwise
// returns the raw Zod message so errors always display.
// ─────────────────────────────────────────────────────────────

function useErrorTranslator() {
  const t = useTranslations("auth");
  return (msg?: string): string | undefined => {
    if (!msg) return undefined;
    try {
      // Only translate keys that start with "err" (our Zod error keys)
      if (msg.startsWith("err")) {
        return t(msg as Parameters<typeof t>[0]);
      }
      return msg;
    } catch {
      return msg;
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Role-specific extra field sections
// ─────────────────────────────────────────────────────────────

type FieldSectionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  translateErr: (msg?: string) => string | undefined;
  t: (k: string) => string;
};

function FarmerFields({ register, errors, translateErr, t }: FieldSectionProps) {
  return (
    <>
      <FormField
        label={t("farmName")}
        placeholder="e.g. Kirinyaga Farmers Cooperative"
        icon={<MapPin size={15} />}
        error={translateErr(errors.farmName?.message)}
        {...register("farmName")}
      />
      <FormField
        label={t("cooperativeRegNumber")}
        placeholder="e.g. COOP-2024-001 (optional)"
        icon={<Building2 size={15} />}
        error={translateErr(errors.cooperativeRegNumber?.message)}
        {...register("cooperativeRegNumber")}
      />
      <FormField
        label={t("farmLocation")}
        placeholder="e.g. Kirinyaga District"
        icon={<MapPin size={15} />}
        error={translateErr(errors.farmLocation?.message)}
        {...register("farmLocation")}
      />
    </>
  );
}

function CommercialFields({ register, errors, translateErr, t }: FieldSectionProps) {
  return (
    <>
      <FormField
        label={t("businessName")}
        placeholder="e.g. Grand Hotel Kigali"
        icon={<Building2 size={15} />}
        error={translateErr(errors.businessName?.message)}
        {...register("businessName")}
      />
      <FormField
        label={t("businessRegNumber")}
        placeholder="e.g. TIN-123456789 (optional)"
        icon={<Building2 size={15} />}
        error={translateErr(errors.businessRegNumber?.message)}
        {...register("businessRegNumber")}
      />
      <FormField
        label={t("businessAddress")}
        placeholder="e.g. KG 7 Ave, Kigali"
        icon={<MapPin size={15} />}
        error={translateErr(errors.businessAddress?.message)}
        {...register("businessAddress")}
      />
    </>
  );
}

function LogisticsFields({ register, errors, translateErr, t }: FieldSectionProps) {
  return (
    <>
      <FormField
        label={t("vehicleType")}
        placeholder="e.g. 3-ton truck"
        icon={<Truck size={15} />}
        error={translateErr(errors.vehicleType?.message)}
        {...register("vehicleType")}
      />
      <FormField
        label={t("vehicleRegNumber")}
        placeholder="e.g. KAA 123A (optional)"
        icon={<Truck size={15} />}
        error={translateErr(errors.vehicleRegNumber?.message)}
        {...register("vehicleRegNumber")}
      />
      <FormField
        label={t("operatingRegion")}
        placeholder="e.g. Nairobi, Kirinyaga"
        icon={<MapPin size={15} />}
        error={translateErr(errors.operatingRegion?.message)}
        {...register("operatingRegion")}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main SignUpForm
// ─────────────────────────────────────────────────────────────

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const t           = useTranslations("auth");
  const translateErr = useErrorTranslator();

  const [role, setRole]                   = useState<AuthRole>(AuthRole.FARMER);
  const [watchedPassword, setWatchedPassword] = useState("");
  const [submitError, setSubmitError]     = useState<string | null>(null);

  const schema = getSignUpSchema(role);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    mode: "onTouched", // show errors as soon as field is touched & left
  });

  const passwordValue = (watch("password" as keyof SignUpValues) as string) ?? "";

  const handleRoleChange = useCallback(
    (newRole: AuthRole) => {
      setRole(newRole);
      reset();
      setWatchedPassword("");
      setSubmitError(null);
    },
    [reset]
  );

  const onSubmit = async (_data: SignUpValues) => {
    setSubmitError(null);
    try {
      // TODO: replace with real API call POST /api/auth/signup
      await new Promise((r) => setTimeout(r, 600));
      onSuccess?.();
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    }
  };

  // Scroll to first error field when validation fails
  const onInvalid = () => {
    const firstErrorEl = document.querySelector("[data-error='true']") as HTMLElement | null;
    if (firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = firstErrorEl.querySelector("input") as HTMLInputElement | null;
      input?.focus();
    } else {
      // fallback — scroll form top into view
      document.querySelector("form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Collect all current error messages for the top banner
  const errorEntries = Object.entries(errors as Record<string, { message?: string }>);
  const hasErrors    = errorEntries.length > 0;

  // Build human-readable list of failing fields for the banner
  const errorFieldLabels: Record<string, string> = {
    firstName:            t("firstName"),
    lastName:             t("lastName"),
    phone:                t("phone"),
    password:             t("password"),
    confirmPassword:      t("confirmPassword"),
    farmName:             t("farmName"),
    farmLocation:         t("farmLocation"),
    businessName:         t("businessName"),
    businessAddress:      t("businessAddress"),
    vehicleType:          t("vehicleType"),
    operatingRegion:      t("operatingRegion"),
  };

  const failingFields = errorEntries
    .map(([key]) => errorFieldLabels[key] ?? key)
    .join(", ");

  const fieldProps = { register, errors, translateErr, t };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">

      {/* Role selector */}
      <RoleToggle value={role} onChange={handleRoleChange} />

      <div className="border-t border-gray-100 pt-1" />

      {/* Validation summary banner — shown after a failed submit attempt */}
      {hasErrors && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-600">Please complete all required fields:</p>
            <p className="text-xs text-red-500 mt-0.5">{failingFields}</p>
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{submitError}</p>
        </div>
      )}

      {/* First name + Last name */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label={t("firstName")}
          placeholder="Jean"
          autoComplete="given-name"
          icon={<User size={15} />}
          error={translateErr((errors as Record<string, { message?: string }>).firstName?.message)}
          {...register("firstName" as keyof SignUpValues)}
        />
        <FormField
          label={t("lastName")}
          placeholder="Mutabazi"
          autoComplete="family-name"
          icon={<User size={15} />}
          error={translateErr((errors as Record<string, { message?: string }>).lastName?.message)}
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
        error={translateErr((errors as Record<string, { message?: string }>).phone?.message)}
        {...register("phone" as keyof SignUpValues)}
      />

      {/* Role-specific fields */}
      {(role === AuthRole.FARMER || role === AuthRole.COOPERATIVE) && (
        <FarmerFields {...fieldProps} />
      )}
      {role === AuthRole.COMMERCIAL_BUYER && (
        <CommercialFields {...fieldProps} />
      )}
      {role === AuthRole.LOGISTICS_PARTNER && (
        <LogisticsFields {...fieldProps} />
      )}

      {/* Password + strength */}
      <div className="space-y-1">
        <PasswordInput
          label={t("password")}
          autoComplete="new-password"
          error={translateErr((errors as Record<string, { message?: string }>).password?.message)}
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
        error={translateErr((errors as Record<string, { message?: string }>).confirmPassword?.message)}
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
        <button type="button" className="text-green-600 hover:underline font-medium">
          {t("termsLink")}
        </button>{" "}
        {t("and")}{" "}
        <button type="button" className="text-green-600 hover:underline font-medium">
          {t("privacyLink")}
        </button>.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98]"
      >
        {isSubmitting
          ? <><Loader2 size={16} className="animate-spin" /> {t("signingUp")}</>
          : t("signUpBtn")}
      </button>

    </form>
  );
}
