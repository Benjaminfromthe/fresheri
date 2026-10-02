"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, MapPin, Tag, Truck, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────
// HeroSection
// Background: public/images/assets/products/hero-bg.jpg
// Falls back to a deep-green gradient when image is absent.
//
// Search inputs stay white/light in BOTH themes — they sit
// inside a frosted card overlaid on a photo, so a fixed
// light surface is intentional and gives WCAG contrast
// against the dark photo behind them.
// ─────────────────────────────────────────────────────────────

export interface HeroFilters {
  query:       string;
  category:    string;
  region:      string;
  fulfillment: "ALL" | "SELF_PICKUP" | "DELIVERED";
}

const DEFAULT_FILTERS: HeroFilters = {
  query: "", category: "", region: "", fulfillment: "ALL",
};

const CATEGORIES = ["Vegetables", "Fruits", "Grains", "Tubers", "Legumes"];

const REGIONS = [
  "Kigali", "Musanze", "Nyabihu", "Eastern Province",
  "Northern Province", "Southern Province", "Western Province",
];

interface HeroSectionProps {
  onSearch: (filters: HeroFilters) => void;
}

// Shared style for the three filter selects — white bg over the
// photo overlay in both modes for legibility. Intentional exception
// to the dark-mode slate palette.
const SELECT_CLS = `
  w-full pl-8 pr-3 py-2.5 rounded-xl text-sm font-medium
  appearance-none cursor-pointer
  bg-white text-slate-800
  border-2 border-slate-200
  focus:outline-none focus:border-emerald-500
  focus:ring-2 focus:ring-emerald-100
  hover:border-slate-300
  transition-all duration-150
`;

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const t      = useTranslations("landing");
  const router = useRouter();

  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_FILTERS);

  const set = <K extends keyof HeroFilters>(k: K, v: HeroFilters[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v }));

  const isDirty =
    filters.query !== "" || filters.category !== "" ||
    filters.region !== "" || filters.fulfillment !== "ALL";

  const handleSearch = useCallback(() => {
    onSearch(filters);
    document.getElementById("produce-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filters, onSearch]);

  const handleClear = () => { setFilters(DEFAULT_FILTERS); onSearch(DEFAULT_FILTERS); };

  return (
    <section
      className="relative min-h-[580px] md:min-h-[640px] flex items-center justify-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* Background image with deep-green fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/assets/products/hero-bg.jpg')",
          backgroundColor: "#14532d",  /* green-900 — intentional hardcoded fallback */
        }}
        aria-hidden="true"
      />

      {/* Overlay — fixed dark gradient so text is always readable over photo */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"
        aria-hidden="true"
      />

      {/* Decorative blur accents */}
      <div className="absolute top-16 left-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">

        {/* Privacy trust chip */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium px-3 py-1 rounded-full mb-5 backdrop-blur-sm">
          🔒 {t("privacyChip")}
        </div>

        {/* Headline — always white over dark overlay, WCAG AAA */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight whitespace-pre-line mb-4 drop-shadow-lg">
          {t("heroTitle")}
        </h1>

        {/* Subtitle */}
        <p className="text-emerald-100 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("heroSubtitle")}
        </p>

        {/* ── Search card ── */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl">

          {/* Main search input — white bg intentional (over dark photo) */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder={t("heroSearchPlaceholder")}
                className="
                  w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium
                  bg-white text-slate-900 placeholder:text-slate-500
                  border-2 border-slate-200 hover:border-slate-300
                  focus:outline-none focus:border-emerald-500
                  focus:ring-2 focus:ring-emerald-100
                  shadow-sm transition-all duration-150
                "
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-150 shrink-0 text-sm"
            >
              <Search size={15} />
              <span className="hidden sm:inline">{t("searchBtn")}</span>
            </button>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filters.category}
                onChange={(e) => set("category", e.target.value)}
                className={SELECT_CLS}
                aria-label={t("filterCategory")}
              >
                <option value="">{t("filterAllCategories")}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filters.region}
                onChange={(e) => set("region", e.target.value)}
                className={SELECT_CLS}
                aria-label={t("filterRegion")}
              >
                <option value="">{t("filterAllRegions")}</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="relative">
              <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={filters.fulfillment}
                onChange={(e) => set("fulfillment", e.target.value as HeroFilters["fulfillment"])}
                className={SELECT_CLS}
                aria-label={t("filterFulfillment")}
              >
                <option value="ALL">{t("filterAllFulfillment")}</option>
                <option value="SELF_PICKUP">{t("filterPickup")}</option>
                <option value="DELIVERED">{t("filterDelivery")}</option>
              </select>
            </div>
          </div>

          {/* Clear filters */}
          {isDirty && (
            <div className="mt-3 flex justify-center">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors duration-150"
              >
                <X size={12} />
                {t("clearFilters")}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
