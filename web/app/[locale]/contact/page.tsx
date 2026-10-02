import type { Metadata } from "next";
import ContactSection from "@/components/layout/ContactSection";
import Header         from "@/components/layout/Header";
import Footer         from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Contact — Fresheri",
  description: "Get in touch with the Fresheri team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
      <Header />
      <main className="flex-1">
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
