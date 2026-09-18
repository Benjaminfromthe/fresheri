"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Sprout } from "lucide-react";
import LandingProduceCard           from "./LandingProduceCard";
import { LANDING_PRODUCE }          from "@/lib/landing/produce-data";
import type { HeroFilters }         from "./HeroSection";

interface ProduceGridProps {
  filters: HeroFilters;
}

export default function ProduceGrid({ filters }: ProduceGridProps) {
  const t = useTranslations("landing");

  const filtered = useMemo(() => {
    const { query, category, region, fulfillment } = filters;
    return LANDING_PRODUCE.filter((p) => {
      if (category && p.categoryName !== category) return false;
      if (region   && !p.region.toLowerCase().includes(region.toLowerCase())) return false;
      if (fulfillment === "SELF_PICKUP" && p.fulfillment === "DELIVERED") return false;
      if (fulfillment === "DELIVERED"   && p.fulfillment === "SELF_PICKUP") return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          p.produceName.toLowerCase().includes(q)       ||
          p.region.toLowerCase().includes(q)            ||
          p.sellerDisplayName.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filters]);

  return (
    <section id="produce-grid" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">

      {/* Section header */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {t("sectionTitle")}
        </h2>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto text-sm sm:text-base">
          {t("sectionSubtitle")}
        </p>
      </div>

      {/* Results count */}
      {filtered.length > 0 && (
        <p className="text-sm text-gray-400 mb-5">
          <span className="font-semibold text-gray-700">{filtered.length}</span>{" "}
          {t("sectionTitle").toLowerCase()} found
        </p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <Sprout size={48} className="opacity-30" />
          <p className="font-semibold text-lg">{t("noResults")}</p>
          <p className="text-sm">{t("noResultsSub")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((produce) => (
            <LandingProduceCard key={produce.id} produce={produce} />
          ))}
        </div>
      )}
    </section>
  );
}
