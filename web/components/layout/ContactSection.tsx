"use client";

import { useTranslations } from "next-intl";
import { Phone, Mail, MessageCircle, MapPin, Clock, Sprout } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Contact Section — used on /contact and /about pages
// ─────────────────────────────────────────────────────────────

const CONTACT_PHONE = "+250794915285";
const CONTACT_EMAIL = "benjaminnshhimiye633@gmail.com";
const WHATSAPP_URL  = `https://wa.me/250794915285`;

export default function ContactSection() {
  const t  = useTranslations("navigation");
  const tc = useTranslations("common");

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Sprout size={28} className="text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t("contactTitle")}
          </h1>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            {t("contactDesc")}
          </p>
        </div>

        {/* Contact cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">

          {/* Phone */}
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="group flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-green-50 group-hover:bg-green-100 flex items-center justify-center shrink-0 transition-colors">
              <Phone size={22} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t("contactPhone")}
              </p>
              <p className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                {CONTACT_PHONE}
              </p>
              <p className="text-xs text-gray-400 mt-1">Tap to call</p>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="group flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
              <Mail size={22} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                {t("contactEmail")}
              </p>
              <p className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors break-all">
                {CONTACT_EMAIL}
              </p>
              <p className="text-xs text-gray-400 mt-1">Tap to email</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
              <MessageCircle size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                WhatsApp
              </p>
              <p className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                {CONTACT_PHONE}
              </p>
              <p className="text-xs text-gray-400 mt-1">Chat on WhatsApp</p>
            </div>
          </a>

          {/* Hours */}
          <div className="flex items-start gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <Clock size={22} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Response time
              </p>
              <p className="text-base font-bold text-gray-900">Within 24 hours</p>
              <p className="text-xs text-gray-400 mt-1">Mon – Sat, 8am – 6pm EAT</p>
            </div>
          </div>
        </div>

        {/* Location note */}
        <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-2xl px-5 py-4">
          <MapPin size={18} className="text-green-600 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">Fresheri</span> — connecting farmers and buyers across East Africa.
            Based in Rwanda, serving the entire region.
          </p>
        </div>
      </div>
    </section>
  );
}
