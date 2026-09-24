"use client";

import { useTranslations } from "next-intl";
import { Filter, RotateCcw, MapPin, Truck, Package } from "lucide-react";
import { MarketplaceFilters, DEFAULT_FILTERS } from "@/types/marketplace";
import { CROP_CATEGORIES, LOCATIONS } from "@/lib/mock-listings";

interface FilterSidebarProps {
  filters: MarketplaceFilters;
  onChange: (filters: MarketplaceFilters) => void;
  totalResults: number;
}

const MIN_QTY_PRESETS = [0, 100, 500, 1000, 2000, 5000];

export default function FilterSidebar({ filters, onChange, totalResults }: FilterSidebarProps) {
  const t = useTranslations("filters");
  const tc = useTranslations("common");

  const set = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const isDirty =
    filters.category        !== DEFAULT_FILTERS.category        ||
    filters.minAvailableQty !== DEFAULT_FILTERS.minAvailableQty ||
    filters.location        !== DEFAULT_FILTERS.location        ||
    filters.fulfillment     !== DEFAULT_FILTERS.fulfillment;

  const FULFILLMENT_OPTIONS = [
    { value: "ALL"         as const, label: t("fulfillmentAll"),      icon: <Package size={14} /> },
    { value: "SELF_PICKUP" as const, label: t("fulfillmentPickup"),   icon: <Package size={14} /> },
    { value: "DELIVERED"   as const, label: t("fulfillmentDelivery"), icon: <Truck   size={14} /> },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-semibold text-gray-800">
          <Filter size={16} className="text-green-600" />
          {t("title")}
        </span>
        {isDirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 transition-colors"
          >
            <RotateCcw size={12} />
            {t("reset")}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Crop Category */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t("cropCategory")}
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => set("category", "")}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filters.category === "" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t("allCategories")}
              </button>
            </li>
            {CROP_CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => set("category", cat)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.category === cat ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Min Available Quantity */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t("minAvailableQty")}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {MIN_QTY_PRESETS.map((qty) => (
              <button
                key={qty}
                onClick={() => set("minAvailableQty", qty)}
                className={`py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filters.minAvailableQty === qty
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
              >
                {qty === 0
                  ? tc("any")
                  : qty >= 1000
                  ? `${qty / 1000}${tc("tonUnit")}`
                  : `${qty}${tc("kgUnit")}`}
              </button>
            ))}
          </div>
          <div className="mt-2 relative">
            <input
              type="number"
              min={0}
              placeholder={t("customKgPlaceholder")}
              value={filters.minAvailableQty || ""}
              onChange={(e) => set("minAvailableQty", Number(e.target.value) || 0)}
              className="w-full border-2 border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-400 bg-white"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">{tc("kgUnit")}</span>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Location */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1">
            <MapPin size={12} />
            {t("location")}
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => set("location", "")}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filters.location === "" ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {t("allLocations")}
              </button>
            </li>
            {LOCATIONS.map((loc) => (
              <li key={loc}>
                <button
                  onClick={() => set("location", loc)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filters.location === loc ? "bg-green-50 text-green-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {loc}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-gray-100" />

        {/* Fulfillment */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            {t("fulfillment")}
          </h3>
          <div className="space-y-1">
            {FULFILLMENT_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => set("fulfillment", value)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  filters.fulfillment === value
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span className="text-green-500">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Results count */}
      <div className="mt-6 text-center">
        <span className="inline-block bg-green-50 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
          {totalResults} {t("title").toLowerCase()}
        </span>
      </div>
    </aside>
  );
}
