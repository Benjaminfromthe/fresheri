"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, BadgeCheck, Lock, Leaf, Sprout } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Marketing left panel — shown on md+ screens
// ─────────────────────────────────────────────────────────────

const STATS = [
  { value: "2,400+", key: "statListings"  },
  { value: "180+",   key: "statCoops"     },
  { value: "42",     key: "statRegions"   },
] as const;

const TRUST_BADGES = [
  { icon: ShieldCheck, key: "trustBadge1" },
  { icon: BadgeCheck,  key: "trustBadge2" },
  { icon: Lock,        key: "trustBadge3" },
] as const;

export default function MarketingPanel() {
  const t = useTranslations("auth");

  return (
    <div className="relative hidden md:flex flex-col justify-between h-full min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 p-10 overflow-hidden">

      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-48 h-48 rounded-full bg-emerald-500/20 pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Sprout size={22} className="text-white" />
        </div>
        <span className="text-white font-bold text-2xl tracking-tight">Fresheri</span>
      </div>

      {/* Main copy */}
      <div className="relative z-10 space-y-6">
        {/* Produce cards — real product images */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { img: "/images/assets/products/tomatoes.jpg",       label: "Tomatoes",       qty: "1,500 kg" },
            { img: "/images/assets/products/irish-potatoes.jpg", label: "Irish Potatoes", qty: "10,000 kg" },
            { img: "/images/assets/products/cabbage.jpg",        label: "Cabbage",        qty: "5,000 kg" },
            { img: "/images/assets/products/peppers.jpg",        label: "Peppers",        qty: "800 kg" },
            { img: "/images/assets/products/green-bananas.jpg",  label: "Green Bananas",  qty: "2,000 kg" },
            { img: "/images/assets/products/eggplant.jpg",       label: "Eggplant",       qty: "300 kg" },
          ].map(({ img, label, qty }) => (
            <div
              key={label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:bg-white/15 transition-colors"
            >
              {/* Product image — exact size, object-cover crop */}
              <div className="w-full h-16 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="px-2 py-2 text-center">
                <p className="text-white text-xs font-semibold leading-tight truncate">{label}</p>
                <p className="text-green-200 text-xs">{qty}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h1 className="text-white text-3xl xl:text-4xl font-bold leading-tight whitespace-pre-line">
            {t("marketingTitle")}
          </h1>
          <p className="text-green-100 mt-4 text-sm xl:text-base leading-relaxed max-w-xs">
            {t("marketingSub")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6">
          {STATS.map(({ value, key }) => (
            <div key={key}>
              <p className="text-white text-2xl font-bold">{value}</p>
              <p className="text-green-200 text-xs mt-0.5">{t(key)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative z-10 space-y-3">
        {TRUST_BADGES.map(({ icon: Icon, key }) => (
          <div key={key} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
              <Icon size={14} className="text-white" />
            </div>
            <span className="text-green-100 text-sm">{t(key)}</span>
          </div>
        ))}

        {/* Privacy micro-copy */}
        <div className="mt-4 bg-white/10 border border-white/15 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <Leaf size={14} className="text-green-300 mt-0.5 shrink-0" />
          <p className="text-green-100 text-xs leading-relaxed">{t("privacyNotice")}</p>
        </div>
      </div>
    </div>
  );
}
