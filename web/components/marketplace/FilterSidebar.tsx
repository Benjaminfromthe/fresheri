"use client";

import { useTranslations } from "next-intl";
import { Filter, RotateCcw, MapPin, Truck, Package, ChevronDown } from "lucide-react";
import { MarketplaceFilters, DEFAULT_FILTERS } from "@/types/marketplace";
import { CROP_CATEGORIES } from "@/lib/mock-listings";
import {
  RWANDA_PROVINCES,
  getDistrictsByProvince,
} from "@/lib/constants/rwandaLocations";

interface FilterSidebarProps {
  filters:      MarketplaceFilters;
  onChange:     (filters: MarketplaceFilters) => void;
  totalResults: number;
}

const MIN_QTY_PRESETS = [0, 100, 500, 1000, 2000, 5000];

// Province display label map for i18n keys
const PROVINCE_KEY_MAP: Record<string, string> = {
  kigali: "kigali",
  north:  "north",
  south:  "south",
  east:   "east",
  west:   "west",
};

export default function FilterSidebar({ filters, onChange, totalResults }: FilterSidebarProps) {
  const t  = useTranslations("filters");
  const tc = useTranslations("common");

  const set = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) =>
    onChange({ ...filters, [key]: value });

  // When province changes, reset district
  const setProvince = (provinceId: string) => {
    onChange({ ...filters, province: provinceId, district: "", location: provinceId });
  };

  // When district changes, update location filter for grid
  const setDistrict = (districtName: string) => {
    onChange({
      ...filters,
      district: districtName,
      location: districtName ? districtName : filters.province,
    });
  };

  const isDirty =
    filters.category        !== DEFAULT_FILTERS.category        ||
    filters.minAvailableQty !== DEFAULT_FILTERS.minAvailableQty ||
    filters.province        !== DEFAULT_FILTERS.province        ||
    filters.district        !== DEFAULT_FILTERS.district        ||
    filters.fulfillment     !== DEFAULT_FILTERS.fulfillment;

  const availableDistricts = filters.province
    ? getDistrictsByProvince(filters.province)
    : [];

  const FULFILLMENT_OPTIONS = [
    { value: "ALL"         as const, label: t("fulfillmentAll"),      icon: <Package size={14} /> },
    { value: "SELF_PICKUP" as const, label: t("fulfillmentPickup"),   icon: <Package size={14} /> },
    { value: "DELIVERED"   as const, label: t("fulfillmentDelivery"), icon: <Truck   size={14} /> },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
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

        {/* ── Crop Category ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {t("cropCategory")}
          </h3>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => set("category", "")}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filters.category === ""
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
                    filters.category === cat
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                  }`}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* ── Min Available Quantity ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-green-400"
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
              className="w-full border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-400"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">{tc("kgUnit")}</span>
          </div>
        </section>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* ── Rwanda Location: Province + District ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1.5">
            <MapPin size={12} />
            {t("location")}
          </h3>

          {/* Province dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("province")}
            </label>
            <div className="relative">
              <select
                value={filters.province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full appearance-none border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-400 cursor-pointer"
              >
                <option value="">{t("allProvinces")}</option>
                {RWANDA_PROVINCES.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {/* Use i18n key if available, fall back to name */}
                    {PROVINCE_KEY_MAP[prov.id] ? t(PROVINCE_KEY_MAP[prov.id] as Parameters<typeof t>[0]) : prov.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* District dropdown — only shown when province is selected */}
          {filters.province && (
            <div className="space-y-2 mt-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                {t("district")}
              </label>
              <div className="relative">
                <select
                  value={filters.district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full appearance-none border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 rounded-xl px-3 py-2.5 pr-8 text-sm text-gray-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all hover:border-gray-400 cursor-pointer"
                >
                  <option value="">{t("allDistricts")}</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist.id} value={dist.name}>
                      {dist.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Active filter pill */}
          {(filters.province || filters.district) && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {filters.province && !filters.district && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full border border-green-200">
                  <MapPin size={9} />
                  {RWANDA_PROVINCES.find(p => p.id === filters.province)?.name}
                </span>
              )}
              {filters.district && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full border border-green-200">
                  <MapPin size={9} />
                  {filters.district}
                </span>
              )}
            </div>
          )}
        </section>

        <hr className="border-gray-100 dark:border-gray-800" />

        {/* ── Fulfillment ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
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
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
