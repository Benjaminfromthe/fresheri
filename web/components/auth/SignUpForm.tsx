"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Building2, Truck, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

import { AuthRole, getSignUpSchema, SignUpValues } from "@/lib/auth/schemas";
import { authSignUp, saveSession } from "@/lib/api-client";
import { scorePassword } from "@/lib/auth/schemas";

import RoleToggle             from "./RoleToggle";
import FloatingInput          from "./FloatingInput";
import FloatingPasswordInput  from "./FloatingPasswordInput";
import CountryCodePicker      from "./CountryCodePicker";

interface SignUpFormProps {
  onSuccess?: () => void;
}

// ── Safe i18n error translator ────────────────────────────────

function useErrorTranslator() {
  const t = useTranslations("auth");
  return (msg?: string): string | undefined => {
    if (!msg) return undefined;
    try {
      return msg.startsWith("err") ? t(msg as Parameters<typeof t>[0]) : msg;
    } catch { return msg; }
  };
}

// ── Password strength bar ─────────────────────────────────────

const STRENGTH_COLORS = ["", "bg-red-400", "bg-amber-400", "bg-blue-400", "bg-green-500"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

function InlinePasswordStrength({ password }: { password: string }) {
  const score = scorePassword(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5 px-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              seg <= score ? STRENGTH_COLORS[score] : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${["","text-red-500","text-amber-500","text-blue-500","text-green-600"][score]}`}>
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  );
}

// ── Role-specific field sections ──────────────────────────────

type FSP = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any; errors: any;
  te: (msg?: string) => string | undefined;
  t:  (k: string)   => string;
};

function FarmerFields({ register, errors, te, t }: FSP) {
  return (
    <>
      <FloatingInput label={t("farmName")} placeholder="e.g. Nyabihu Cooperative" icon={<MapPin size={15}/>} error={te(errors.farmName?.message)} {...register("farmName")} />
      <FloatingInput label={t("cooperativeRegNumber")} placeholder="COOP-2024-001 (optional)" icon={<Building2 size={15}/>} error={te(errors.cooperativeRegNumber?.message)} {...register("cooperativeRegNumber")} />
      <FloatingInput label={t("farmLocation")} placeholder="e.g. Musanze District" icon={<MapPin size={15}/>} error={te(errors.farmLocation?.message)} {...register("farmLocation")} />
    </>
  );
}

function CommercialFields({ register, errors, te, t }: FSP) {
  return (
    <>
      <FloatingInput label={t("businessName")} placeholder="e.g. Grand Hotel Kigali" icon={<Building2 size={15}/>} error={te(errors.businessName?.message)} {...register("businessName")} />
      <FloatingInput label={t("businessRegNumber")} placeholder="TIN-123456789 (optional)" icon={<Building2 size={15}/>} error={te(errors.businessRegNumber?.message)} {...register("businessRegNumber")} />
      <FloatingInput label={t("businessAddress")} placeholder="e.g. KG 7 Ave, Kigali" icon={<MapPin size={15}/>} error={te(errors.businessAddress?.message)} {...register("businessAddress")} />
    </>
  );
}

function LogisticsFields({ register, errors, te, t }: FSP) {
  return (
    <>
      <FloatingInput label={t("vehicleType")} placeholder="e.g. 3-ton truck" icon={<Truck size={15}/>} error={te(errors.vehicleType?.message)} {...register("vehicleType")} />
      <FloatingInput label={t("vehicleRegNumber")} placeholder="RAA 001 A (optional)" icon={<Truck size={15}/>} error={te(errors.vehicleRegNumber?.message)} {...register("vehicleRegNumber")} />
      <FloatingInput label={t("operatingRegion")} placeholder="e.g. Kigali, Musanze" icon={<MapPin size={15}/>} error={te(errors.operatingRegion?.message)} {...register("operatingRegion")} />
    </>
  );
}

// ── Main SignUpForm ───────────────────────────────────────────

export default function SignUpForm({ onSuccess }: SignUpFormProps) {
  const t  = useTranslations("auth");
  const te = useErrorTranslator();

  const [role, setRole]           = useState<AuthRole>(AuthRole.FARMER);
  const [countryCode, setCC]      = useState("+250");
  const [watchedPwd, setWatchedPwd] = useState("");
  const [submitError, setError]   = useState<string | null>(null);
  const [shakePhone, setShake]    = useState(false);

  const schema = getSignUpSchema(role);

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: { role: AuthRole.FARMER } as Partial<SignUpValues>,
  });

  const phoneVal = watch("phone" as keyof SignUpValues) as string ?? "";
  const pwdVal   = watch("password" as keyof SignUpValues) as string ?? "";

  const handleRoleChange = useCallback(
    (newRole: AuthRole) => {
      setRole(newRole);
      reset({ role: newRole } as Partial<SignUpValues>);
      setWatchedPwd(""); setError(null);
      setTimeout(() => setValue("role" as keyof SignUpValues, newRole as never), 0);
    },
    [reset, setValue]
  );

  const onSubmit = async (_data: SignUpValues) => {
    setError(null);
    try {
      const result = await authSignUp({
        firstName: _data.firstName as string,
        lastName:  _data.lastName  as string,
        phone:     _data.phone     as string,
        password:  _data.password  as string,
        role,
        farmName:             (_data as Record<string,string>).farmName,
        cooperativeRegNumber: (_data as Record<string,string>).cooperativeRegNumber,
        farmLocation:         (_data as Record<string,string>).farmLocation,
        businessName:         (_data as Record<string,string>).businessName,
        businessRegNumber:    (_data as Record<string,string>).businessRegNumber,
        businessAddress:      (_data as Record<string,string>).businessAddress,
        vehicleType:          (_data as Record<string,string>).vehicleType,
        vehicleRegNumber:     (_data as Record<string,string>).vehicleRegNumber,
        operatingRegion:      (_data as Record<string,string>).operatingRegion,
      });
      saveSession(result);
      onSuccess?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const onInvalid = () => {
    const el = document.querySelector("[data-error='true']") as HTMLElement | null;
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el?.querySelector("input") as HTMLInputElement | null)?.focus();
  };

  const errorEntries  = Object.entries(errors as Record<string, { message?: string }>);
  const hasErrors     = errorEntries.length > 0;
  const failingFields = errorEntries.map(([k]) => ({
    firstName: t("firstName"), lastName: t("lastName"), phone: t("phone"),
    password: t("password"), confirmPassword: t("confirmPassword"),
    farmName: t("farmName"), farmLocation: t("farmLocation"),
    businessName: t("businessName"), businessAddress: t("businessAddress"),
    vehicleType: t("vehicleType"), operatingRegion: t("operatingRegion"),
  } as Record<string,string>)[k] ?? k).join(", ");

  const fp = { register, errors, te, t };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-4">
      <input type="hidden" {...register("role" as keyof SignUpValues)} value={role} />

      {/* Role selector */}
      <RoleToggle value={role} onChange={handleRoleChange} />
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Error banners */}
      {hasErrors && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-3 py-2.5">
          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">Please complete all required fields:</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-0.5">{failingFields}</p>
          </div>
        </div>
      )}
      {submitError && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl px-3 py-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Sign up failed</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{submitError}</p>
          </div>
        </div>
      )}

      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
        <FloatingInput label={t("firstName")} placeholder=" " autoComplete="given-name"
          error={te((errors as Record<string,{message?:string}>).firstName?.message)}
          {...register("firstName" as keyof SignUpValues)} />
        <FloatingInput label={t("lastName")} placeholder=" " autoComplete="family-name"
          error={te((errors as Record<string,{message?:string}>).lastName?.message)}
          {...register("lastName" as keyof SignUpValues)} />
      </div>

      {/* Phone with country code */}
      <FloatingInput
        label={t("phone")} type="tel" autoComplete="tel"
        shake={shakePhone}
        value={phoneVal}
        inputPrefix={<CountryCodePicker value={countryCode} onChange={setCC} />}
        error={te((errors as Record<string,{message?:string}>).phone?.message)}
        {...register("phone" as keyof SignUpValues)}
      />

      {/* Role-specific fields */}
      {(role === AuthRole.FARMER || role === AuthRole.COOPERATIVE) && <FarmerFields {...fp} />}
      {role === AuthRole.COMMERCIAL_BUYER  && <CommercialFields {...fp} />}
      {role === AuthRole.LOGISTICS_PARTNER && <LogisticsFields {...fp} />}

      {/* Password + inline strength */}
      <div className="space-y-1.5">
        <FloatingPasswordInput
          label={t("password")} autoComplete="new-password"
          error={te((errors as Record<string,{message?:string}>).password?.message)}
          {...register("password" as keyof SignUpValues, {
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setWatchedPwd(e.target.value),
          })}
        />
        <InlinePasswordStrength password={watchedPwd || pwdVal} />
      </div>

      {/* Confirm password */}
      <FloatingPasswordInput
        label={t("confirmPassword")} autoComplete="new-password"
        error={te((errors as Record<string,{message?:string}>).confirmPassword?.message)}
        {...register("confirmPassword" as keyof SignUpValues)}
      />

      {/* Privacy notice */}
      <div className="flex items-start gap-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl px-3.5 py-3">
        <ShieldCheck size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">{t("privacyNotice")}</p>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
        {t("termsNotice")}{" "}
        <button type="button" className="text-green-600 hover:underline font-medium">{t("termsLink")}</button>{" "}
        {t("and")}{" "}
        <button type="button" className="text-green-600 hover:underline font-medium">{t("privacyLink")}</button>.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-70 text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-green-600/20 hover:shadow-green-600/30"
      >
        {isSubmitting
          ? <><Loader2 size={17} className="animate-spin" /><span>{t("signingUp")}</span></>
          : <span>{t("signUpBtn")}</span>}
      </button>
    </form>
  );
}
