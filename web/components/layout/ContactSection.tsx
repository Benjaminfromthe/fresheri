"use client";

import { useTranslations } from "next-intl";
import { Phone, Mail, MessageCircle, MapPin, Clock, Sprout } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// ContactSection — used on /contact and /about pages
// ─────────────────────────────────────────────────────────────

const CONTACT_PHONE = "+250794915285";
const CONTACT_EMAIL = "benjaminnshhimiye633@gmail.com";
const WHATSAPP_URL  = "https://wa.me/250794915285";

// Shared contact card base class
const CARD = `
  group flex items-start gap-4
  bg-white dark:bg-slate-900
  rounded-2xl p-6
  border border-slate-100 dark:border-slate-800
  shadow-sm hover:shadow-md
  transition-all duration-200 ease-in-out
`;

export default function ContactSection() {
  const t = useTranslations("navigation");

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <Sprout size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            {t("contactTitle")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto">
            {t("contactDesc")}
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">

          {/* Phone */}
          <a href={`tel:${CONTACT_PHONE}`} className={`${CARD} hover:border-emerald-200 dark:hover:border-emerald-800`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center shrink-0 transition-colors duration-200">
              <Phone size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                {t("contactPhone")}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-200">
                {CONTACT_PHONE}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap to call</p>
            </div>
          </a>

          {/* Email */}
          <a href={`mailto:${CONTACT_EMAIL}`} className={`${CARD} hover:border-blue-200 dark:hover:border-blue-800`}>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 flex items-center justify-center shrink-0 transition-colors duration-200">
              <Mail size={22} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                {t("contactEmail")}
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors duration-200 break-all">
                {CONTACT_EMAIL}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Tap to email</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={`${CARD} hover:border-emerald-200 dark:hover:border-emerald-800`}>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 flex items-center justify-center shrink-0 transition-colors duration-200">
              <MessageCircle size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                WhatsApp
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors duration-200">
                {CONTACT_PHONE}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Chat on WhatsApp</p>
            </div>
          </a>

          {/* Hours — static, no link */}
          <div className={CARD}>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Clock size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">
                Response time
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">Within 24 hours</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Mon – Sat, 8am – 6pm EAT</p>
            </div>
          </div>
        </div>

        {/* Location note */}
        <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl px-5 py-4">
          <MapPin size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-800 dark:text-emerald-200">
            <span className="font-semibold">Fresheri</span> — connecting farmers and buyers across East Africa.
            Based in Rwanda, serving the entire region.
          </p>
        </div>
      </div>
    </section>
  );
}
