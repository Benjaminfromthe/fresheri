"use client";

import { useState } from "react";
import Header      from "@/components/layout/Header";
import Footer      from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import StatsStrip  from "@/components/landing/StatsStrip";
import ProduceGrid from "@/components/landing/ProduceGrid";
import HowItWorks  from "@/components/landing/HowItWorks";
import CTASection  from "@/components/landing/CTASection";
import type { HeroFilters } from "@/components/landing/HeroSection";

const DEFAULT_FILTERS: HeroFilters = {
  query: "", category: "", region: "", fulfillment: "ALL",
};

export default function AboutPage() {
  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <HeroSection onSearch={setFilters} />
        <StatsStrip />
        <ProduceGrid filters={filters} />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
