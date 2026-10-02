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

const PRODUCT_KEY_MAP: Record<string, string> = {
  "Tomatoes":         "tomatoes",
  "Green Bananas":    "greenBananas",
  "Peppers":          "peppers",
  "Cabbage":          "cabbage",
  "Irish Potatoes":   "irishPotatoes",
  "African Eggplant": "eggplant",
  "Rice":             "rice",
  "Maize":            "maize",
  "Spinach":          "spinach",
  "Onions":           "onions",
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
    produceName, variety, region,
    sellerVerified, imageFile, gradientFrom, gradientTo, emoji,
    availableQtyKg, unitPriceRwf, harvestDate, fulfillment,
    isOrganic, categoryName,
  } = produce;

  const translatedName     = PRODUCT_KEY_MAP[produceName]
    ? tp(PRODUCT_KEY_MAP[produceName]   as Parameters<typeof tp>[0])
    : produceName;
  const translatedCategory = CATEGORY_KEY_MAP[categoryName]
    ? tp(CATEGORY_KEY_MAP[categoryName] as Parameters<typeof tp>[0])
    : categoryName;
  const translatedRegion   = REGION_KEY_MAP[region]
    ? tp(REGION_KEY_MAP[region]         as Parameters<typeof tp>[0])
    : region;

  const imageSrc = `/images/assets/products/${imageFile}`;

  return (
    <article className="
      bg-white dark:bg-slate-800
      rounded-2xl shadow-sm
      border border-slate-100 dark:border-slate-700
      overflow-hidden flex flex-col group
      hover:shadow-lg hover:-translate-y-1
      transition-all duration-200 ease-in-out
    ">

      {/* ── Image / gradient fallback ── */}
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

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-full z-10">
          {translatedCategory}
        </span>

        {/* Organic badge */}
        {isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
            <Leaf size={10} />
            {tc("organic")}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">

        {/* Name + variety + trust badge */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">
            {translatedName}
            {variety && (
              <span className="ml-1 font-normal text-slate-500 dark:text-slate-400 text-sm">
                ({variety})
              </span>
            )}
          </h3>

          {/* PRIVACY: anonymous trust badge — real coop name hidden until post-order */}
          <div className="flex items-center gap-1 mt-1.5">
            {isOrganic ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                {tc("organicCoop")}
              </span>
            ) : sellerVerified ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30 px-2 py-0.5 rounded-full">
                <BadgeCheck size={10} />
                {tc("verifiedCoop")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-full">
                <ShieldCheck size={10} />
                {tc("verifiedFarmer")}
              </span>
            )}
          </div>
        </div>

        {/* Meta — location, harvest, stock */}
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <MapPin size={11} className="text-emerald-500 shrink-0" />
            {translatedRegion}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <CalendarCheck size={11} className="text-emerald-500 shrink-0" />
            {t("harvestedOn", { date: formatDate(harvestDate, locale) })}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Package size={11} className="text-emerald-500 shrink-0" />
            {t("available", { qty: formatQty(availableQtyKg) })}
          </li>
        </ul>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {tc("currency")} {unitPriceRwf.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">{tc("perKg")}</span>
        </div>

        {/* Fulfillment chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(fulfillment === "SELF_PICKUP" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
              <Package size={9} />{t("pickup")}
            </span>
          )}
          {(fulfillment === "DELIVERED" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30">
              <Truck size={9} />{t("delivery")}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(`/marketplace?search=${encodeURIComponent(produceName)}`)}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 ease-in-out"
        >
          {t("viewDetails")}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
