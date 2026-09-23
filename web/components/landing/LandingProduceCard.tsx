"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin, CalendarCheck, Package, Truck,
  BadgeCheck, ShieldCheck, Leaf, ArrowRight,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { LandingProduce } from "@/lib/landing/produce-data";
import { formatQty }           from "@/lib/landing/produce-data";

interface LandingProduceCardProps {
  produce: LandingProduce;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function LandingProduceCard({ produce }: LandingProduceCardProps) {
  const t      = useTranslations("landing");
  const tc     = useTranslations("common");
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  const {
    produceName, variety, region, sellerDisplayName, sellerVerified,
    imageFile, gradientFrom, gradientTo, emoji,
    availableQtyKg, unitPriceKes, harvestDate, fulfillment,
    isOrganic, categoryName,
  } = produce;

  const imageSrc = `/images/assets/products/${imageFile}`;

  const handleViewDetails = () => {
    // Navigate to marketplace with pre-filled search
    router.push(`/marketplace?search=${encodeURIComponent(produceName)}`);
  };

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-lg hover:-translate-y-1 transition-all duration-200">

      {/* ── Image / Gradient placeholder ── */}
      <div className={`relative h-44 bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center overflow-hidden`}>
        {/* Real product image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={produceName}
          className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => { setImgError(true); setImgLoaded(false); }}
          loading="lazy"
        />
        {/* Emoji shown ONLY when image fails or hasn't loaded yet */}
        {(!imgLoaded || imgError) && (
          <span className="text-6xl select-none" aria-hidden="true">{emoji}</span>
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {categoryName}
        </span>

        {/* Organic badge */}
        {isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            <Leaf size={10} />
            {tc("organic")}
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">

        {/* Produce name + variety */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-tight">
            {produceName}
            {variety && (
              <span className="ml-1 font-normal text-gray-400 text-sm">({variety})</span>
            )}
          </h3>
          {/* Seller — cooperative name only, never personal farmer name */}
          <div className="flex items-center gap-1 mt-0.5">
            {sellerVerified
              ? <BadgeCheck size={12} className="text-blue-500 shrink-0" />
              : <ShieldCheck size={12} className="text-gray-300 shrink-0" />}
            <span className="text-xs text-gray-500 truncate">{sellerDisplayName}</span>
          </div>
        </div>

        {/* Meta */}
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} className="text-green-500 shrink-0" />
            {/* District-level only — privacy rule */}
            {region}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck size={11} className="text-green-500 shrink-0" />
            {t("harvestedOn", { date: formatDate(harvestDate) })}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={11} className="text-green-500 shrink-0" />
            {t("available", { qty: formatQty(availableQtyKg) })}
          </li>
        </ul>

        {/* Privacy chip */}
        <div className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
          <ShieldCheck size={11} className="text-blue-400 shrink-0" />
          <span className="text-xs text-blue-600">{t("privacyChip")}</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-bold text-green-700">
            KES {unitPriceKes.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">{t("unitPrice", { price: "" }).replace("", "").trim()}</span>
          <span className="text-xs text-gray-400">/ kg</span>
        </div>

        {/* Fulfillment chips */}
        <div className="flex gap-1.5 flex-wrap">
          {(fulfillment === "SELF_PICKUP" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
              <Package size={9} />
              {t("pickup")}
            </span>
          )}
          {(fulfillment === "DELIVERED" || fulfillment === "BOTH") && (
            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium">
              <Truck size={9} />
              {t("delivery")}
            </span>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleViewDetails}
          className="mt-auto w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
        >
          {t("viewDetails")}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}
