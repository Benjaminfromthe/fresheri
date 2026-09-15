"use client";

import { useTranslations } from "next-intl";
import { Sprout, Building2, Home, Truck } from "lucide-react";
import { AuthRole } from "@/lib/auth/schemas";

interface RoleOption {
  role:     AuthRole;
  labelKey: string;
  descKey:  string;
  icon:     React.ReactNode;
  color:    string;
  activeColor: string;
  activeBg: string;
}

const ROLES: RoleOption[] = [
  {
    role:        AuthRole.FARMER,
    labelKey:    "roleFarmer",
    descKey:     "roleFarmerDesc",
    icon:        <Sprout size={18} />,
    color:       "text-gray-400",
    activeColor: "text-green-600",
    activeBg:    "border-green-500 bg-green-50",
  },
  {
    role:        AuthRole.COMMERCIAL_BUYER,
    labelKey:    "roleCommercial",
    descKey:     "roleCommercialDesc",
    icon:        <Building2 size={18} />,
    color:       "text-gray-400",
    activeColor: "text-blue-600",
    activeBg:    "border-blue-500 bg-blue-50",
  },
  {
    role:        AuthRole.HOUSEHOLD_BUYER,
    labelKey:    "roleHousehold",
    descKey:     "roleHouseholdDesc",
    icon:        <Home size={18} />,
    color:       "text-gray-400",
    activeColor: "text-purple-600",
    activeBg:    "border-purple-500 bg-purple-50",
  },
  {
    role:        AuthRole.LOGISTICS_PARTNER,
    labelKey:    "roleLogistics",
    descKey:     "roleLogisticsDesc",
    icon:        <Truck size={18} />,
    color:       "text-gray-400",
    activeColor: "text-amber-600",
    activeBg:    "border-amber-500 bg-amber-50",
  },
];

interface RoleToggleProps {
  value:    AuthRole;
  onChange: (role: AuthRole) => void;
}

export default function RoleToggle({ value, onChange }: RoleToggleProps) {
  const t = useTranslations("auth");

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
        {t("selectRole")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(({ role, labelKey, descKey, icon, color, activeColor, activeBg }) => {
          const isActive = value === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={`
                flex items-start gap-2.5 p-3 rounded-xl border-2 text-left
                transition-all duration-150 select-none
                ${isActive
                  ? activeBg
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"}
              `}
            >
              <span className={`mt-0.5 shrink-0 ${isActive ? activeColor : color}`}>
                {icon}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isActive ? activeColor : "text-gray-700"}`}>
                  {t(labelKey)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t(descKey)}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
