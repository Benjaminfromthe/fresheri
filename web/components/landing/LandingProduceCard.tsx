"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  MapPin, CalendarCheck, Package, Truck,
  BadgeCheck, ShieldCheck, Leaf, ArrowRight,
} from "lucide-react";
import type { LandingProduce } from "@/lib/landing/produce-data";
import { formatQty } from "@/lib/landing/produce-data";

interface LandingProduceCardProps {
  produce: LandingProduce;
}

// Map produce data keys → i18n keys (products namespace)
const PRODUCT_KEY_MAP: Record<string, string> = {
  "Tomatoes":        "tomatoes",
  "Green Bananas":   "greenBananas",
  "Peppers":         "peppers",
  "Cabbage":         "cabbage",
  "Irish Potatoes":  "irishPotatoes",
  "African Eggplant":"eggplant",
  "Rice":            "rice",
  "Maize":           "maize",
  "Spinach":         "spinach",
  "Onions":          "onions",
};

const CATEGORY_KEY_MAP: Record<string, string> = {
  "Vegetables": "catVegetables",
  "Grains":     "catGrains",
  "Tubers":     "catTubers",
  "Fruits":     "catFruits",
  "Legumes":    "catLegumes",
};

const REGION_KEY_MAP: Record<string, string> = {
  "Nyabihu District":   "regionNyabihu",
  "Musanze District":   "regionMusanze",
  "Eastern Province":   "regionEastern",
  "Kirehe District":    "regionKirehe",
  "Bugesera District":  "regionBugesera",
  "Kirinyaga District": "regionKirinyaga",
  "Mwea District":      "regionMwea",
  "Nyandarua District": "regionNyandarua",
  "Kajiado District":   "regionKajiado",
  "Kiambu District":    "regionKiambu",
  "Nakuru District":    "regionNakuru",
};

function formatDate(iso: string, locale: string) {
  const loc = locale === "rw" ? "fr-RW" : locale === "fr" ? "fr-FR" : "en-KE";
  return new Date(iso).toLocaleDateString(loc, {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function LandingProduceCard({ produce }: LandingProduceCardProps) {
  const t      = useTranslations("landing");
  const tc     = useTranslations("common");
  const tp     = useTranslations("products");
  const locale = useLocale();
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  const {
    produceName, variety, region, sellerDisplayName, sellerVerified,
    imageFile, gradientFrom, gradientTo, emoji,
    availableQtyKg, unitPriceRwf, harvestDate, fulfillment,
    isOrganic, categoryName,
  } = produce;

  // Translate names via key map, fall back to original if no key
  const translatedName     = PRODUCT_KEY_MAP[produceName]  ? tp(PRODUCT_KEY_MAP[produceName]  as Parameters<typeof tp>[0]) : produceName;
  const translatedCategory = CATEGORY_KEY_MAP[categoryName]? tp(CATEGORY_KEY_MAP[categoryName]as Parameters<typeof tp>[0]) : categoryName;
  const translatedRegion   = REGION_KEY_MAP[region]        ? tp(REGION_KEY_MAP[region]        as Parameters<typeof tp>[0]) : region;

  const imageSrc = `/images/assets/products/${imageFile}`;

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">

      {/* Image / Gradient placeholder */}
      <div className={`relative h-44 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={translatedName}
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(false); }}
          loading="lazy"
        />
        {(!imgLoaded || imgError) && (
          <span className="text-6xl select-none" aria-hidden="true">{emoji}</span>
        )}

        {/* Category badge — translated */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          {translatedCategory}
        </span>

        {/* Organic badge */}
        {isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            <Leaf size={10} />
            {tc("organic")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">

        {/* Produce name (translated) + variety + seller */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {translatedName}
            {variety && (
              <span className="ml-1 font-normal text-gray-400 text-sm">({variety})</span>
            )}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            {/* PRIVACY: anonymous trust badge — real coop name hidden until post-order */}
            {isOrganic ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                {tc("organicCoop")}
              </span>
            ) : sellerVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                {tc("verifiedCoop")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full">
                <ShieldCheck size={10} />
                {tc("verifiedFarmer")}
              </span>
            )}
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
            {t("harvestedOn", { date: formatDate(harvestDate, locale) })}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={11} className="text-green-500 shrink-0" />
            {t("available", { qty: formatQty(availableQtyKg) })}
          </li>
        </ul>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold text-green-700">
            {tc("currency")} {unitPriceRwf.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">{tc("perKg")}</span>
        </div>

        {/* Fulfillment chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(fulfillment === "SELF_PICKUP" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              <Package size={9} />{t("pickup")}
            </span>
          )}
          {(fulfillment === "DELIVERED" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              <Truck size={9} />{t("delivery")}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(`/marketplace?search=${encodeURIComponent(produceName)}`)}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          {t("viewDetails")}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
