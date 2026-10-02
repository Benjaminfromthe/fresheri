"use client";

import { useState } from "react";
import Header         from "@/components/layout/Header";
import Footer         from "@/components/layout/Footer";
import HeroSection    from "@/components/landing/HeroSection";
import StatsStrip     from "@/components/landing/StatsStrip";
import ProduceGrid    from "@/components/landing/ProduceGrid";
import HowItWorks     from "@/components/landing/HowItWorks";
import CTASection     from "@/components/landing/CTASection";
import ContactSection from "@/components/layout/ContactSection";
import type { HeroFilters } from "@/components/landing/HeroSection";

const DEFAULT_FILTERS: HeroFilters = {
  query: "", category: "", region: "", fulfillment: "ALL",
};

export default function AboutPage() {
  const [filters, setFilters] = useState<HeroFilters>(DEFAULT_FILTERS);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
      <Header />
      <main className="flex-1">
        <HeroSection onSearch={setFilters} />
        <StatsStrip />
        <ProduceGrid filters={filters} />
        <HowItWorks />
        <CTASection />
        {/* Contact section at bottom of about page */}
        <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-150">
          <ContactSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}
