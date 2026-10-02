"use client";

import { useTranslations } from "next-intl";
import { Package, Truck, Lock } from "lucide-react";
import { DeliveryOption } from "@/types/marketplace";

interface FulfillmentToggleProps {
  value:            DeliveryOption;
  onChange:         (v: DeliveryOption) => void;
  availableOptions: DeliveryOption[];
  currency:         string;
  deliveryFee:      number;
  compact?:         boolean;
}

export default function FulfillmentToggle({
  value, onChange, availableOptions, currency, deliveryFee, compact = false,
}: FulfillmentToggleProps) {
  const t  = useTranslations("fulfillment");
  const tc = useTranslations("common");

  const canPickup  = availableOptions.includes("SELF_PICKUP");
  const canDeliver = availableOptions.includes("DELIVERED");

  // ── Card classes ─────────────────────────────────────────
  const card = (active: boolean, disabled: boolean) => `
    flex ${compact ? "flex-col items-center gap-1 flex-1" : "items-start gap-3"}
    p-3 rounded-xl border-2 cursor-pointer select-none
    transition-all duration-200 ease-in-out
    ${disabled ? "opacity-40 cursor-not-allowed" : ""}
    ${active
      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
    }
  `;

  // ── Icon container ────────────────────────────────────────
  const iconBg = (active: boolean, variant: "pickup" | "delivery") => {
    if (!active) return "bg-slate-100 dark:bg-slate-700";
    return variant === "pickup"
      ? "bg-emerald-100 dark:bg-emerald-900/40"
      : "bg-purple-100 dark:bg-purple-900/40";
  };

  return (
    <fieldset className="space-y-2">
      {!compact && (
        <legend className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
          {t("method")}
        </legend>
      )}

      <div className={compact ? "flex gap-2" : "space-y-2"}>

        {/* ── Self Pickup ── */}
        <label className={card(value === "SELF_PICKUP" && canPickup, !canPickup)}>
          <input
            type="radio" name="fulfillment" value="SELF_PICKUP"
            checked={value === "SELF_PICKUP"} disabled={!canPickup}
            onChange={() => canPickup && onChange("SELF_PICKUP")}
            className="sr-only"
          />
          <div className={`flex items-center ${compact ? "flex-col gap-1" : "gap-3 w-full"}`}>
            <div className={`rounded-lg p-1.5 shrink-0 ${iconBg(value === "SELF_PICKUP", "pickup")}`}>
              <Package
                size={compact ? 16 : 18}
                className={value === "SELF_PICKUP"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
                }
              />
            </div>
            <div className={compact ? "text-center" : "flex-1"}>
              <p className={`font-semibold text-sm ${
                value === "SELF_PICKUP"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {compact ? t("selfPickupCompact") : t("selfPickup")}
              </p>
              {!compact && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {t("selfPickupDescription")}
                </p>
              )}
              <p className={`text-xs font-medium mt-0.5 ${
                value === "SELF_PICKUP"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}>
                {tc("free")}
              </p>
            </div>
            {!compact && value === "SELF_PICKUP" && (
              <div className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 px-2 py-1 rounded-lg shrink-0">
                <Lock size={10} />
                {t("selfPickupUnlockBadge")}
              </div>
            )}
          </div>
        </label>

        {/* ── Delivery ── */}
        <label className={card(value === "DELIVERED" && canDeliver, !canDeliver)}>
          <input
            type="radio" name="fulfillment" value="DELIVERED"
            checked={value === "DELIVERED"} disabled={!canDeliver}
            onChange={() => canDeliver && onChange("DELIVERED")}
            className="sr-only"
          />
          <div className={`flex items-center ${compact ? "flex-col gap-1" : "gap-3 w-full"}`}>
            <div className={`rounded-lg p-1.5 shrink-0 ${iconBg(value === "DELIVERED", "delivery")}`}>
              <Truck
                size={compact ? 16 : 18}
                className={value === "DELIVERED"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-400 dark:text-slate-500"
                }
              />
            </div>
            <div className={compact ? "text-center" : "flex-1"}>
              <p className={`font-semibold text-sm ${
                value === "DELIVERED"
                  ? "text-purple-700 dark:text-purple-400"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {compact ? t("deliveryCompact") : t("delivery")}
              </p>
              {!compact && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {t("deliveryDescription")}
                </p>
              )}
              <p className={`text-xs font-medium mt-0.5 ${
                value === "DELIVERED"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}>
                +{currency} {deliveryFee.toLocaleString()}
              </p>
            </div>
          </div>
        </label>
      </div>
    </fieldset>
  );
}
