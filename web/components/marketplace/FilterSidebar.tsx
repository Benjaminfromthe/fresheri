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

const PROVINCE_KEY_MAP: Record<string, string> = {
  kigali: "kigali",
  north:  "north",
  south:  "south",
  east:   "east",
  west:   "west",
};

// ── Shared class fragments ────────────────────────────────────
const SECTION_HEADER = "text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2";
const DIVIDER        = "border-slate-200 dark:border-slate-800";
const INPUT_BASE     = `
  w-full border-2 rounded-xl px-3.5 py-2.5 text-sm
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  border-slate-300 dark:border-slate-700
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  hover:border-slate-400 dark:hover:border-slate-600
  focus:outline-none focus:border-emerald-500 focus:ring-2
  focus:ring-emerald-100 dark:focus:ring-emerald-900/30
  transition-all duration-200 ease-in-out
`;
const SELECT_BASE    = `
  w-full appearance-none rounded-xl px-3 py-2.5 pr-8 text-sm
  border-2 border-slate-300 dark:border-slate-700
  bg-white dark:bg-slate-800
  text-slate-800 dark:text-slate-200
  hover:border-slate-400 dark:hover:border-slate-600
  focus:outline-none focus:border-emerald-500 focus:ring-2
  focus:ring-emerald-100 dark:focus:ring-emerald-900/30
  cursor-pointer transition-all duration-200 ease-in-out
`;

export default function FilterSidebar({ filters, onChange, totalResults }: FilterSidebarProps) {
  const t  = useTranslations("filters");
  const tc = useTranslations("common");

  const set = <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const setProvince = (provinceId: string) => {
    onChange({ ...filters, province: provinceId, district: "", location: provinceId });
  };

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

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
          <Filter size={16} className="text-emerald-600 dark:text-emerald-500" />
          {t("title")}
        </span>
        {isDirty && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition-all duration-200"
          >
            <RotateCcw size={12} />
            {t("reset")}
          </button>
        )}
      </div>

      <div className="space-y-6">

        {/* ── Crop Category ── */}
        <section>
          <h3 className={SECTION_HEADER}>{t("cropCategory")}</h3>
          <ul className="space-y-0.5">
            <li>
              <button
                onClick={() => set("category", "")}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-sm
                  transition-all duration-200 ease-in-out
                  ${filters.category === ""
                    ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                {t("allCategories")}
              </button>
            </li>
            {CROP_CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => set("category", cat)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm
                    transition-all duration-200 ease-in-out
                    ${filters.category === cat
                      ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }
                  `}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <hr className={DIVIDER} />

        {/* ── Min Available Quantity ── */}
        <section>
          <h3 className={SECTION_HEADER}>{t("minAvailableQty")}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {MIN_QTY_PRESETS.map((qty) => (
              <button
                key={qty}
                onClick={() => set("minAvailableQty", qty)}
                className={`
                  py-1.5 rounded-lg text-xs font-medium border
                  transition-all duration-200 ease-in-out
                  ${filters.minAvailableQty === qty
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:text-emerald-700 dark:hover:text-emerald-400"
                  }
                `}
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
              className={INPUT_BASE}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 font-medium pointer-events-none">
              {tc("kgUnit")}
            </span>
          </div>
        </section>

        <hr className={DIVIDER} />

        {/* ── Rwanda Location: Province + District ── */}
        <section>
          <h3 className={`${SECTION_HEADER} flex items-center gap-1.5 mb-3`}>
            <MapPin size={12} />
            {t("location")}
          </h3>

          {/* Province */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("province")}
            </label>
            <div className="relative">
              <select
                value={filters.province}
                onChange={(e) => setProvince(e.target.value)}
                className={SELECT_BASE}
              >
                <option value="">{t("allProvinces")}</option>
                {RWANDA_PROVINCES.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {PROVINCE_KEY_MAP[prov.id]
                      ? t(PROVINCE_KEY_MAP[prov.id] as Parameters<typeof t>[0])
                      : prov.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* District — only when province is selected */}
          {filters.province && (
            <div className="space-y-2 mt-3">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                {t("district")}
              </label>
              <div className="relative">
                <select
                  value={filters.district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className={SELECT_BASE}
                >
                  <option value="">{t("allDistricts")}</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist.id} value={dist.name}>
                      {dist.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Active filter pills */}
          {(filters.province || filters.district) && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {filters.province && !filters.district && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <MapPin size={9} />
                  {RWANDA_PROVINCES.find((p) => p.id === filters.province)?.name}
                </span>
              )}
              {filters.district && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <MapPin size={9} />
                  {filters.district}
                </span>
              )}
            </div>
          )}
        </section>

        <hr className={DIVIDER} />

        {/* ── Fulfillment ── */}
        <section>
          <h3 className={SECTION_HEADER}>{t("fulfillment")}</h3>
          <div className="space-y-0.5">
            {FULFILLMENT_OPTIONS.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => set("fulfillment", value)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  transition-all duration-200 ease-in-out
                  ${filters.fulfillment === value
                    ? "bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                <span className="text-emerald-500 dark:text-emerald-400">{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Results count ── */}
      <div className="mt-6 text-center">
        <span className="inline-block bg-emerald-50 dark:bg-emerald-900/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50 transition-all duration-200">
          {totalResults} {t("title").toLowerCase()}
        </span>
      </div>
    </aside>
  );
}
