"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, MapPin, Tag, Truck, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────
// Hero filter state type (passed up to page or used to navigate)
// ─────────────────────────────────────────────────────────────

export interface HeroFilters {
  query:       string;
  category:    string;
  region:      string;
  fulfillment: "ALL" | "SELF_PICKUP" | "DELIVERED";
}

const DEFAULT_FILTERS: HeroFilters = {
  query:       "",
  category:    "",
  region:      "",
  fulfillment: "ALL",
};

const CATEGORIES = [
  "Vegetables", "Fruits", "Grains", "Tubers", "Legumes",
];

const REGIONS = [
  "Kigali", "Musanze", "Nyabihu", "Eastern Province",
  "Northern Province", "Southern Province", "Western Province",
];

// ─────────────────────────────────────────────────────────────
// HeroSection
// Background: public/images/assets/products/hero-bg.jpg
// Falls back to a rich green gradient when image is absent.
// ─────────────────────────────────────────────────────────────

interface HeroSectionProps {
  onSearch: (filters: HeroFilters) => void;
}

export default function HeroSection({ onSearch }: HeroSectionProps) {
  const t      = useTranslations("landing");
  const router = useRouter();

  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_FILTERS);

  const set = <K extends keyof HeroFilters>(k: K, v: HeroFilters[K]) =>
    setFilters((prev) => ({ ...prev, [k]: v }));

  const isDirty =
    filters.query       !== "" ||
    filters.category    !== "" ||
    filters.region      !== "" ||
    filters.fulfillment !== "ALL";

  const handleSearch = useCallback(() => {
    onSearch(filters);
    // Also scroll down to the grid section
    document
      .getElementById("produce-grid")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [filters, onSearch]);

  const handleClear = () => {
    setFilters(DEFAULT_FILTERS);
    onSearch(DEFAULT_FILTERS);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <section
      className="relative min-h-[580px] md:min-h-[640px] flex items-center justify-center overflow-hidden"
      aria-label="Hero section"
    >
      {/* ── Background image with fallback gradient ── */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/assets/products/hero-bg.jpg')",
          backgroundColor: "#14532d", // fallback when image absent
        }}
        aria-hidden="true"
      />

      {/* ── Overlay ── */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"
        aria-hidden="true"
      />

      {/* ── Decorative circles ── */}
      <div className="absolute top-16 left-10 w-64 h-64 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">

        {/* Privacy trust chip */}
        <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 text-green-200 text-xs font-medium px-3 py-1 rounded-full mb-5 backdrop-blur-sm">
          🔒 {t("privacyChip")}
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight whitespace-pre-line mb-4 drop-shadow-lg">
          {t("heroTitle")}
        </h1>

        {/* Subtitle */}
        <p className="text-green-100 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("heroSubtitle")}
        </p>

        {/* ── Search & filter card ── */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl">

          {/* Main search input */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                type="search"
                value={filters.query}
                onChange={(e) => set("query", e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("heroSearchPlaceholder")}
                className="w-full pl-11 pr-4 py-3.5 bg-white rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-3 focus:ring-green-400/30 border-2 border-gray-200 focus:border-green-500 hover:border-gray-300 transition-all shadow-sm font-medium"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold px-5 py-3 rounded-xl transition-all shrink-0 text-sm"
            >
              <Search size={15} />
              <span className="hidden sm:inline">{t("searchBtn")}</span>
            </button>
          </div>

          {/* Filter row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

            {/* Category */}
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                value={filters.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white rounded-xl text-sm text-gray-800 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-300 appearance-none cursor-pointer transition-all font-medium"
                aria-label={t("filterCategory")}
              >
                <option value="">{t("filterAllCategories")}</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Region */}
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                value={filters.region}
                onChange={(e) => set("region", e.target.value)}
                className="w-full pl-8 pr-3 py-2.5 bg-white rounded-xl text-sm text-gray-800 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-300 appearance-none cursor-pointer transition-all font-medium"
                aria-label={t("filterRegion")}
              >
                <option value="">{t("filterAllRegions")}</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Fulfillment */}
            <div className="relative">
              <Truck size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <select
                value={filters.fulfillment}
                onChange={(e) => set("fulfillment", e.target.value as HeroFilters["fulfillment"])}
                className="w-full pl-8 pr-3 py-2.5 bg-white rounded-xl text-sm text-gray-800 border-2 border-gray-200 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 hover:border-gray-300 appearance-none cursor-pointer transition-all font-medium"
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
                className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
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
