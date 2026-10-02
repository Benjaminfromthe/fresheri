"use client";

import { useTranslations } from "next-intl";
import { Sprout, Building2, Home, Truck } from "lucide-react";
import { AuthRole } from "@/lib/auth/schemas";

interface RoleOption {
  role:        AuthRole;
  labelKey:    string;
  descKey:     string;
  icon:        React.ReactNode;
  // inactive icon color
  color:       string;
  // active: icon + label color
  activeColor: string;
  // active: card bg + border
  activeBg:    string;
  // active dark: card bg + border
  activeBgDark: string;
}

const ROLES: RoleOption[] = [
  {
    role:         AuthRole.FARMER,
    labelKey:     "roleFarmer",
    descKey:      "roleFarmerDesc",
    icon:         <Sprout    size={18} />,
    color:        "text-slate-400 dark:text-slate-500",
    activeColor:  "text-emerald-600 dark:text-emerald-400",
    activeBg:     "border-emerald-500 bg-emerald-50",
    activeBgDark: "dark:border-emerald-700 dark:bg-emerald-900/20",
  },
  {
    role:         AuthRole.COMMERCIAL_BUYER,
    labelKey:     "roleCommercial",
    descKey:      "roleCommercialDesc",
    icon:         <Building2 size={18} />,
    color:        "text-slate-400 dark:text-slate-500",
    activeColor:  "text-blue-600 dark:text-blue-400",
    activeBg:     "border-blue-500 bg-blue-50",
    activeBgDark: "dark:border-blue-700 dark:bg-blue-900/20",
  },
  {
    role:         AuthRole.HOUSEHOLD_BUYER,
    labelKey:     "roleHousehold",
    descKey:      "roleHouseholdDesc",
    icon:         <Home      size={18} />,
    color:        "text-slate-400 dark:text-slate-500",
    activeColor:  "text-purple-600 dark:text-purple-400",
    activeBg:     "border-purple-500 bg-purple-50",
    activeBgDark: "dark:border-purple-700 dark:bg-purple-900/20",
  },
  {
    role:         AuthRole.LOGISTICS_PARTNER,
    labelKey:     "roleLogistics",
    descKey:      "roleLogisticsDesc",
    icon:         <Truck     size={18} />,
    color:        "text-slate-400 dark:text-slate-500",
    activeColor:  "text-amber-600 dark:text-amber-400",
    activeBg:     "border-amber-500 bg-amber-50",
    activeBgDark: "dark:border-amber-700 dark:bg-amber-900/20",
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
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
        {t("selectRole")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {ROLES.map(({ role, labelKey, descKey, icon, color, activeColor, activeBg, activeBgDark }) => {
          const isActive = value === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => onChange(role)}
              className={`
                flex items-start gap-2.5 p-3 rounded-xl border-2 text-left
                transition-all duration-150 ease-in-out select-none
                ${isActive
                  ? `${activeBg} ${activeBgDark}`
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }
              `}
            >
              <span className={`mt-0.5 shrink-0 ${isActive ? activeColor : color}`}>
                {icon}
              </span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold leading-tight ${isActive ? activeColor : "text-slate-700 dark:text-slate-300"}`}>
                  {t(labelKey as Parameters<typeof t>[0])}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">
                  {t(descKey as Parameters<typeof t>[0])}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
