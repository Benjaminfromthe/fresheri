"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, BadgeCheck, Lock, Leaf, Sprout, TrendingUp } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Animated mesh gradient background
// ─────────────────────────────────────────────────────────────

function MeshGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-700 to-emerald-600" />

      {/* Animated organic blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, #16a34a 0%, transparent 70%)",
          animation: "float1 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 -right-24 w-72 h-72 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, #059669 0%, transparent 70%)",
          animation: "float2 15s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-20 left-1/4 w-80 h-80 rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
          animation: "float3 10s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, #34d399 0%, transparent 70%)",
          animation: "float1 18s ease-in-out infinite reverse",
        }}
      />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
      }} />

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 30px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 20px) scale(1.08); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(20px, -35px) scale(1.03); }
          80% { transform: translate(-15px, 15px) scale(0.97); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Live inventory marquee
// ─────────────────────────────────────────────────────────────

interface InventoryItem {
  emoji: string;
  name:  string;
  qty:   number;
  unit:  string;
  trend: "up" | "down" | "stable";
}

const BASE_INVENTORY: InventoryItem[] = [
  { emoji: "🍅", name: "Tomatoes",       qty: 1500, unit: "kg", trend: "down"   },
  { emoji: "🥬", name: "Cabbage",        qty: 4800, unit: "kg", trend: "stable" },
  { emoji: "🥔", name: "Irish Potatoes", qty: 9200, unit: "kg", trend: "up"     },
  { emoji: "🌶️", name: "Peppers",        qty: 720,  unit: "kg", trend: "down"   },
  { emoji: "🍌", name: "Green Bananas",  qty: 1800, unit: "kg", trend: "up"     },
  { emoji: "🍆", name: "Eggplant",       qty: 280,  unit: "kg", trend: "stable" },
];

function InventoryTicker() {
  const [items, setItems] = useState<InventoryItem[]>(BASE_INVENTORY);
  const tickerRef = useRef<HTMLDivElement>(null);

  // Simulate live quantity changes every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          const delta   = Math.floor(Math.random() * 40) - 20;
          const newQty  = Math.max(50, item.qty + delta);
          const trend   = delta > 5 ? "up" : delta < -5 ? "down" : "stable";
          return { ...item, qty: newQty, trend };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const trendColor = (t: string) =>
    t === "up" ? "text-emerald-300" : t === "down" ? "text-rose-300" : "text-white/50";
  const trendArrow = (t: string) => t === "up" ? "↑" : t === "down" ? "↓" : "→";

  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden py-1">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-green-900/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-green-900/80 to-transparent z-10 pointer-events-none" />

      <div
        ref={tickerRef}
        className="flex gap-3"
        style={{ animation: "ticker 30s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-white/10 bg-white/8"
            style={{
              backdropFilter: "blur(12px)",
              background: "rgba(255,255,255,0.08)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-xl leading-none">{item.emoji}</span>
            <div>
              <p className="text-white text-xs font-semibold leading-tight whitespace-nowrap">
                {item.name}
              </p>
              <p className="text-white/60 text-xs whitespace-nowrap">
                {item.qty.toLocaleString()} {item.unit}{" "}
                <span className={`font-bold ${trendColor(item.trend)}`}>
                  {trendArrow(item.trend)}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Glassmorphism stat card
// ─────────────────────────────────────────────────────────────

function GlassCard({ icon: Icon, value, label, color }: {
  icon: React.ElementType; value: string; label: string; color: string;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{
        backdropFilter: "blur(12px)",
        background:     "rgba(255,255,255,0.08)",
        borderColor:    "rgba(255,255,255,0.15)",
        boxShadow:      "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-white font-bold text-base leading-tight">{value}</p>
        <p className="text-white/55 text-xs">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Trust badge item
// ─────────────────────────────────────────────────────────────

function TrustBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backdropFilter: "blur(8px)",
          background:     "rgba(255,255,255,0.12)",
          border:         "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <Icon size={13} className="text-white" />
      </div>
      <span className="text-green-100 text-sm">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MarketingPanel
// ─────────────────────────────────────────────────────────────

export default function MarketingPanel() {
  const t = useTranslations("auth");

  const STATS = [
    { icon: TrendingUp,  value: "2,400+", label: t("statListings"),  color: "bg-emerald-500/70"  },
    { icon: BadgeCheck,  value: "180+",   label: t("statCoops"),     color: "bg-blue-500/70"     },
    { icon: Leaf,        value: "42",     label: t("statRegions"),   color: "bg-teal-500/70"     },
  ];

  const BADGES = [
    { icon: ShieldCheck, label: t("trustBadge1") },
    { icon: BadgeCheck,  label: t("trustBadge2") },
    { icon: Lock,        label: t("trustBadge3") },
  ];

  return (
    <div className="relative hidden md:flex flex-col justify-between h-full min-h-screen overflow-hidden p-10">
      {/* Animated mesh gradient */}
      <MeshGradient />

      {/* Content — above gradient */}
      <div className="relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              backdropFilter: "blur(12px)",
              background:     "rgba(255,255,255,0.15)",
              border:         "1px solid rgba(255,255,255,0.2)",
              boxShadow:      "0 4px 16px rgba(0,0,0,0.2)",
            }}
          >
            <Sprout size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Fresheri</span>
        </div>
      </div>

      {/* Middle content */}
      <div className="relative z-10 space-y-6">
        {/* Headline */}
        <div>
          <h1 className="text-white text-3xl xl:text-4xl font-extrabold leading-tight whitespace-pre-line drop-shadow-lg">
            {t("marketingTitle")}
          </h1>
          <p className="text-green-100/80 mt-3 text-sm leading-relaxed max-w-xs">
            {t("marketingSub")}
          </p>
        </div>

        {/* Live inventory ticker */}
        <div className="space-y-2">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Live Inventory
          </p>
          <InventoryTicker />
        </div>

        {/* Glassmorphism stat cards */}
        <div className="grid grid-cols-3 gap-2">
          {STATS.map(({ icon, value, label, color }) => (
            <GlassCard key={label} icon={icon} value={value} label={label} color={color} />
          ))}
        </div>
      </div>

      {/* Bottom: trust badges + privacy note */}
      <div className="relative z-10 space-y-3">
        {BADGES.map(({ icon, label }) => (
          <TrustBadge key={label} icon={icon} label={label} />
        ))}

        {/* Privacy micro-copy */}
        <div
          className="mt-3 flex items-start gap-2.5 rounded-xl px-4 py-3"
          style={{
            backdropFilter: "blur(12px)",
            background:     "rgba(255,255,255,0.06)",
            border:         "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <Leaf size={13} className="text-green-300 mt-0.5 shrink-0" />
          <p className="text-green-100/70 text-xs leading-relaxed">{t("privacyNotice")}</p>
        </div>
      </div>
    </div>
  );
}
