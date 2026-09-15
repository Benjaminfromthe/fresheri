"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin, CalendarCheck, Package, Leaf,
  Minus, Plus, ShoppingCart, BadgeCheck, ShieldCheck, Users,
} from "lucide-react";
import { ProduceListing, DeliveryOption } from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import PrivacyBadge      from "./PrivacyBadge";
import FulfillmentToggle from "./FulfillmentToggle";

interface ProduceCardProps {
  listing: ProduceListing;
  onAddToCart: (listing: ProduceListing, qty: number, fulfillment: DeliveryOption) => void;
}

function formatDate(iso: string, locale?: string) {
  return new Date(iso).toLocaleDateString(locale ?? "en", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatQty(qty: number, unit: string, kgLabel: string, tLabel: string) {
  if (unit === "KG" && qty >= 1000) return `${(qty / 1000).toFixed(1)} ${tLabel}`;
  return `${qty.toLocaleString()} ${kgLabel}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: "bg-emerald-50 text-emerald-700",
  Grains:     "bg-amber-50 text-amber-700",
  Tubers:     "bg-orange-50 text-orange-700",
  Fruits:     "bg-pink-50 text-pink-700",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Vegetables: "from-emerald-400 to-green-600",
  Grains:     "from-amber-400 to-yellow-600",
  Tubers:     "from-orange-400 to-amber-600",
  Fruits:     "from-pink-400 to-rose-600",
};

export default function ProduceCard({ listing, onAddToCart }: ProduceCardProps) {
  const t  = useTranslations("marketplace");
  const tc = useTranslations("common");
  const tf = useTranslations("fulfillment");

  const defaultFulfillment: DeliveryOption = listing.deliveryOptions[0] ?? "SELF_PICKUP";
  const [qty, setQty]               = useState(listing.minimumOrderQty);
  const [fulfillment, setFulfillment] = useState<DeliveryOption>(defaultFulfillment);
  const [added, setAdded]           = useState(false);

  const step      = listing.minimumOrderQty;
  const minQty    = listing.minimumOrderQty;
  const maxQty    = listing.availableQuantity;
  const lineTotal = qty * listing.unitPrice + (fulfillment === "DELIVERED" ? BASE_DELIVERY_FEE : 0);

  const handleAdd = () => {
    onAddToCart(listing, qty, fulfillment);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isSoldOut  = listing.status === "SOLD_OUT";
  const badgeColor = CATEGORY_COLORS[listing.categoryName] ?? "bg-gray-100 text-gray-600";
  const gradient   = CATEGORY_GRADIENTS[listing.categoryName] ?? "from-green-400 to-teal-600";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">

      {/* Image / Placeholder */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {listing.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.imageUrls[0]} alt={listing.produceName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white/60 text-5xl font-bold select-none">{listing.produceName.charAt(0)}</span>
        )}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {listing.categoryName}
        </span>
        {listing.isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full">
            <Leaf size={10} />{tc("organic")}
          </span>
        )}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">{tc("soldOut")}</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">
            {listing.produceName}
            {listing.variety && <span className="ml-1 text-gray-400 font-normal text-sm">({listing.variety})</span>}
          </h2>
          <div className="flex items-center gap-1 mt-0.5">
            {listing.sellerVerified
              ? <BadgeCheck size={13} className="text-blue-500 shrink-0" />
              : <ShieldCheck size={13} className="text-gray-300 shrink-0" />}
            <span className="text-xs text-gray-500 truncate">
              <Users size={10} className="inline mr-0.5 text-gray-400" />
              {t("cooperativeIn", { region: listing.region.replace(" District", "") })}
            </span>
          </div>
        </div>

        <ul className="space-y-1">
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="text-green-500 shrink-0" />
            {listing.region}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck size={12} className="text-green-500 shrink-0" />
            {t("harvestedOn", { date: formatDate(listing.harvestDate) })}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={12} className="text-green-500 shrink-0" />
            {t("remaining", { qty: formatQty(listing.availableQuantity, listing.unit, tc("kgUnit"), tc("tonUnit")) })}
            {listing.status === "PARTIALLY_SOLD" && (
              <span className="ml-1 text-amber-500 font-medium">· {tc("partialStock")}</span>
            )}
          </li>
        </ul>

        <PrivacyBadge compact />

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-green-700">
            {listing.currency} {listing.unitPrice.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">{listing.unit === "KG" ? tc("perKg") : tc("perTon")}</span>
        </div>

        {!isSoldOut && (
          <div className="mt-auto space-y-3">
            <FulfillmentToggle
              value={fulfillment}
              onChange={setFulfillment}
              availableOptions={listing.deliveryOptions}
              currency={listing.currency}
              deliveryFee={BASE_DELIVERY_FEE}
              compact
            />

            {fulfillment === "SELF_PICKUP" && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                🔒 {tf("pickupLockMessage")}
              </p>
            )}

            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
              <button onClick={() => setQty((q) => Math.max(minQty, q - step))} disabled={qty <= minQty} aria-label={tc("minLabel")}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <Minus size={14} />
              </button>
              <div className="text-center">
                <span className="font-semibold text-gray-800 text-sm">{qty.toLocaleString()} {tc("kgUnit")}</span>
                <p className="text-xs text-gray-400">
                  {listing.currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {fulfillment === "DELIVERED" && <span className="text-purple-500"> {t("inclDelivery")}</span>}
                </p>
              </div>
              <button onClick={() => setQty((q) => Math.min(maxQty, q + step))} disabled={qty >= maxQty} aria-label="+"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition">
                <Plus size={14} />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {t("minQtyHint", { min: minQty.toLocaleString(), step: step.toLocaleString() })}
            </p>

            <button
              onClick={handleAdd}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 bg-green-600 hover:bg-green-700 text-white"
            >
              <ShoppingCart size={15} />
              {added
                ? t("addedConfirmation")
                : fulfillment === "SELF_PICKUP"
                ? t("addToOrderPickup")
                : t("addToOrderDelivery")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
