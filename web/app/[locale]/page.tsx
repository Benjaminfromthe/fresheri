"use client";

import { useState } from "react";
import Header        from "@/components/layout/Header";
import Footer        from "@/components/layout/Footer";
import HeroSection   from "@/components/landing/HeroSection";
import StatsStrip    from "@/components/landing/StatsStrip";
import ProduceGrid   from "@/components/landing/ProduceGrid";
import HowItWorks    from "@/components/landing/HowItWorks";
import CTASection    from "@/components/landing/CTASection";
import type { HeroFilters } from "@/components/landing/HeroSection";

const DEFAULT_FILTERS: HeroFilters = {
  query:       "",
  category:    "",
  region:      "",
  fulfillment: "ALL",
};

// ─────────────────────────────────────────────────────────────
// Landing Page
// Sections (top → bottom):
//   Header → Hero + Search → Stats strip → Produce grid
//   → How it works → CTA → Footer
// ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero with integrated search/filter bar */}
        <HeroSection onSearch={setFilters} />

        {/* Trust stats strip */}
        <StatsStrip />

        {/* Live-filtered produce grid */}
        <ProduceGrid filters={filters} />

        {/* How it works — three-step explainer */}
        <HowItWorks />

        {/* CTA — sign up / browse */}
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
