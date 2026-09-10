"use client";

import { Package, Truck, Lock } from "lucide-react";
import { DeliveryOption } from "@/types/marketplace";

interface FulfillmentToggleProps {
  value: DeliveryOption;
  onChange: (v: DeliveryOption) => void;
  availableOptions: DeliveryOption[];
  currency: string;
  deliveryFee: number;
  /** Show in compact card mode (no descriptions) */
  compact?: boolean;
}

export default function FulfillmentToggle({
  value,
  onChange,
  availableOptions,
  currency,
  deliveryFee,
  compact = false,
}: FulfillmentToggleProps) {
  const canPickup   = availableOptions.includes("SELF_PICKUP");
  const canDeliver  = availableOptions.includes("DELIVERED");

  return (
    <fieldset className="space-y-2">
      {!compact && (
        <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Fulfillment Method
        </legend>
      )}

      <div className={compact ? "flex gap-2" : "space-y-2"}>
        {/* ── Self Pickup ── */}
        <label
          className={`
            flex ${compact ? "flex-col items-center gap-1 flex-1" : "items-start gap-3"}
            p-3 rounded-xl border-2 cursor-pointer transition-all select-none
            ${!canPickup ? "opacity-40 cursor-not-allowed" : ""}
            ${value === "SELF_PICKUP" && canPickup
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300 bg-white"}
          `}
        >
          <input
            type="radio"
            name="fulfillment"
            value="SELF_PICKUP"
            checked={value === "SELF_PICKUP"}
            disabled={!canPickup}
            onChange={() => canPickup && onChange("SELF_PICKUP")}
            className="sr-only"
          />
          <div className={`flex items-center ${compact ? "flex-col gap-1" : "gap-3 w-full"}`}>
            <div className={`rounded-lg p-1.5 shrink-0 ${
              value === "SELF_PICKUP" ? "bg-green-100" : "bg-gray-100"
            }`}>
              <Package size={compact ? 16 : 18} className={
                value === "SELF_PICKUP" ? "text-green-600" : "text-gray-400"
              } />
            </div>
            <div className={compact ? "text-center" : "flex-1"}>
              <p className={`font-semibold text-sm ${
                value === "SELF_PICKUP" ? "text-green-700" : "text-gray-700"
              }`}>
                {compact ? "Pickup" : "Self-Pickup from Cooperative"}
              </p>
              {!compact && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Collect directly — exact location & contact unlocked after confirmation
                </p>
              )}
              <p className={`text-xs font-medium mt-0.5 ${
                value === "SELF_PICKUP" ? "text-green-600" : "text-gray-400"
              }`}>
                Free
              </p>
            </div>
            {!compact && value === "SELF_PICKUP" && (
              <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                <Lock size={10} />
                Location unlocked post-order
              </div>
            )}
          </div>
        </label>

        {/* ── Delivery ── */}
        <label
          className={`
            flex ${compact ? "flex-col items-center gap-1 flex-1" : "items-start gap-3"}
            p-3 rounded-xl border-2 cursor-pointer transition-all select-none
            ${!canDeliver ? "opacity-40 cursor-not-allowed" : ""}
            ${value === "DELIVERED" && canDeliver
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300 bg-white"}
          `}
        >
          <input
            type="radio"
            name="fulfillment"
            value="DELIVERED"
            checked={value === "DELIVERED"}
            disabled={!canDeliver}
            onChange={() => canDeliver && onChange("DELIVERED")}
            className="sr-only"
          />
          <div className={`flex items-center ${compact ? "flex-col gap-1" : "gap-3 w-full"}`}>
            <div className={`rounded-lg p-1.5 shrink-0 ${
              value === "DELIVERED" ? "bg-purple-100" : "bg-gray-100"
            }`}>
              <Truck size={compact ? 16 : 18} className={
                value === "DELIVERED" ? "text-purple-600" : "text-gray-400"
              } />
            </div>
            <div className={compact ? "text-center" : "flex-1"}>
              <p className={`font-semibold text-sm ${
                value === "DELIVERED" ? "text-purple-700" : "text-gray-700"
              }`}>
                {compact ? "Delivery" : "Request Delivery to My Address"}
              </p>
              {!compact && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Logistics agent dispatched — farmer contact stays private
                </p>
              )}
              <p className={`text-xs font-medium mt-0.5 ${
                value === "DELIVERED" ? "text-purple-600" : "text-gray-400"
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
