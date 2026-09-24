"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  MapPin, CalendarCheck, Package, Leaf,
  Minus, Plus, ShoppingCart, BadgeCheck,
  ShieldCheck, Users, ArrowRight,
} from "lucide-react";
import { ProduceListing, DeliveryOption } from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import FulfillmentToggle from "./FulfillmentToggle";

// Translation key maps — keep in sync with messages/*/products namespace
const PRODUCT_KEY_MAP: Record<string, string> = {
  "Tomatoes": "tomatoes", "Green Bananas": "greenBananas",
  "Peppers": "peppers", "Cabbage": "cabbage",
  "Irish Potatoes": "irishPotatoes", "African Eggplant": "eggplant",
  "Rice": "rice", "Maize": "maize", "Spinach": "spinach", "Onions": "onions",
};
const CATEGORY_KEY_MAP: Record<string, string> = {
  "Vegetables": "catVegetables", "Grains": "catGrains",
  "Tubers": "catTubers", "Fruits": "catFruits", "Legumes": "catLegumes",
};
const REGION_KEY_MAP: Record<string, string> = {
  "Nyabihu District": "regionNyabihu", "Musanze District": "regionMusanze",
  "Eastern Province": "regionEastern", "Kirehe District": "regionKirehe",
  "Bugesera District": "regionBugesera", "Kirinyaga District": "regionKirinyaga",
  "Mwea District": "regionMwea", "Nyandarua District": "regionNyandarua",
  "Kajiado District": "regionKajiado", "Kiambu District": "regionKiambu",
  "Nakuru District": "regionNakuru",
};

interface ProduceCardProps {
  listing: ProduceListing;
  onAddToCart: (listing: ProduceListing, qty: number, fulfillment: DeliveryOption) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatQty(qty: number, unit: string, kgLabel = "kg", tLabel = "t") {
  if (unit === "KG" && qty >= 1000) return `${(qty / 1000).toFixed(1)} ${tLabel}`;
  return `${qty.toLocaleString()} ${kgLabel}`;
}

// Per-category image fallback gradients — match landing page
const CATEGORY_GRADIENTS: Record<string, string> = {
  Vegetables: "from-emerald-400 to-green-600",
  Grains:     "from-amber-400 to-yellow-600",
  Tubers:     "from-orange-400 to-amber-600",
  Fruits:     "from-lime-400 to-green-500",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  Vegetables: "🥬",
  Grains:     "🌾",
  Tubers:     "🥔",
  Fruits:     "🍌",
};

export default function ProduceCard({ listing, onAddToCart }: ProduceCardProps) {
  const t      = useTranslations("marketplace");
  const tc     = useTranslations("common");
  const tf     = useTranslations("fulfillment");
  const tp     = useTranslations("products");
  const locale = useLocale();

  const defaultFulfillment: DeliveryOption = listing.deliveryOptions[0] ?? "SELF_PICKUP";
  const [qty, setQty]               = useState(listing.minimumOrderQty);
  const [fulfillment, setFulfillment] = useState<DeliveryOption>(defaultFulfillment);
  const [added, setAdded]           = useState(false);
  const [imgLoaded, setImgLoaded]   = useState(false);
  const [imgError, setImgError]     = useState(false);

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
  const gradient   = CATEGORY_GRADIENTS[listing.categoryName] ?? "from-green-400 to-teal-600";
  const emoji      = CATEGORY_EMOJIS[listing.categoryName] ?? "🌿";
  const imageUrl   = listing.imageUrls[0] ?? null;

  // Translated names
  const translatedName     = PRODUCT_KEY_MAP[listing.produceName]    ? tp(PRODUCT_KEY_MAP[listing.produceName]    as Parameters<typeof tp>[0]) : listing.produceName;
  const translatedCategory = CATEGORY_KEY_MAP[listing.categoryName]  ? tp(CATEGORY_KEY_MAP[listing.categoryName]  as Parameters<typeof tp>[0]) : listing.categoryName;
  const translatedRegion   = REGION_KEY_MAP[listing.region]          ? tp(REGION_KEY_MAP[listing.region]          as Parameters<typeof tp>[0]) : listing.region;

  // Locale-aware date
  const loc = locale === "rw" ? "fr-RW" : locale === "fr" ? "fr-FR" : "en-KE";
  const harvestDateStr = new Date(listing.harvestDate).toLocaleDateString(loc, {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Image — real photo or gradient fallback ── */}
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={listing.produceName}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(false); }}
            loading="lazy"
          />
        )}
        {/* Emoji shown only when no image or image failed */}
        {(!imageUrl || !imgLoaded || imgError) && (
          <span className="text-6xl select-none" aria-hidden="true">{emoji}</span>
        )}

        {/* Category badge — translated */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          {translatedCategory}
        </span>

        {/* Organic badge */}
        {listing.isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full z-10">
            <Leaf size={10} />{tc("organic")}
          </span>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <span className="text-white font-bold text-lg tracking-wide">{tc("soldOut")}</span>
          </div>
        )}

        {/* Partial stock pill */}
        {listing.status === "PARTIALLY_SOLD" && !isSoldOut && (
          <span className="absolute bottom-3 right-3 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            {tc("partialStock")}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">

        {/* Name + variety + seller */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {translatedName}
            {listing.variety && (
              <span className="ml-1 font-normal text-gray-400 text-sm">({listing.variety})</span>
            )}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            {listing.sellerVerified
              ? <BadgeCheck size={12} className="text-blue-500 shrink-0" />
              : <ShieldCheck size={12} className="text-gray-300 shrink-0" />}
            <span className="text-xs text-gray-500 truncate">
              <Users size={10} className="inline mr-0.5 text-gray-400" />
              {listing.sellerDisplayName}
            </span>
          </div>
        </div>

        {/* Meta */}
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} className="text-green-500 shrink-0" />
            {translatedRegion}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck size={11} className="text-green-500 shrink-0" />
            {t("harvestedOn", { date: harvestDateStr })}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={11} className="text-green-500 shrink-0" />
            {t("remaining", { qty: formatQty(listing.availableQuantity, listing.unit, tc("kgUnit"), tc("tonUnit")) })}
          </li>
        </ul>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-green-700">
            {listing.currency} {listing.unitPrice.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">
            {listing.unit === "KG" ? tc("perKg") : tc("perTon")}
          </span>
        </div>

        {!isSoldOut && (
          <div className="mt-auto space-y-2.5">
            {/* Compact fulfillment radio */}
            <FulfillmentToggle
              value={fulfillment}
              onChange={setFulfillment}
              availableOptions={listing.deliveryOptions}
              currency={listing.currency}
              deliveryFee={BASE_DELIVERY_FEE}
              compact
            />

            {/* SELF_PICKUP lock hint */}
            {fulfillment === "SELF_PICKUP" && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                🔒 {tf("pickupLockMessage")}
              </p>
            )}

            {/* Quantity selector */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => setQty((q) => Math.max(minQty, q - step))}
                disabled={qty <= minQty}
                aria-label={tc("minLabel")}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Minus size={14} />
              </button>
              <div className="text-center">
                <span className="font-semibold text-gray-800 text-sm">
                  {qty.toLocaleString()} {tc("kgUnit")}
                </span>
                <p className="text-xs text-gray-400">
                  {listing.currency}{" "}
                  {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {fulfillment === "DELIVERED" && (
                    <span className="text-purple-500"> {t("inclDelivery")}</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + step))}
                disabled={qty >= maxQty}
                aria-label="+"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
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
              {added ? (
                <>{t("addedConfirmation")}</>
              ) : fulfillment === "SELF_PICKUP" ? (
                <><ShoppingCart size={14} />{t("addToOrderPickup")}</>
              ) : (
                <><ArrowRight size={14} />{t("addToOrderDelivery")}</>
              )}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
