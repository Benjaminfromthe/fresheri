"use client";

import { useState } from "react";
import {
  MapPin,
  CalendarCheck,
  Package,
  Truck,
  ShieldCheck,
  Leaf,
  Minus,
  Plus,
  ShoppingCart,
  BadgeCheck,
} from "lucide-react";
import { ProduceListing } from "@/types/marketplace";

interface ProduceCardProps {
  listing: ProduceListing;
  onAddToCart: (listing: ProduceListing, qty: number) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatQty(qty: number, unit: string) {
  if (unit === "KG" && qty >= 1000) return `${(qty / 1000).toFixed(1)}t`;
  return `${qty.toLocaleString()} ${unit.toLowerCase()}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Vegetables: "bg-emerald-50 text-emerald-700",
  Grains:     "bg-amber-50  text-amber-700",
  Tubers:     "bg-orange-50 text-orange-700",
  Fruits:     "bg-pink-50   text-pink-700",
};

// Placeholder gradient backgrounds per category when no image is available
const CATEGORY_GRADIENTS: Record<string, string> = {
  Vegetables: "from-emerald-400 to-green-600",
  Grains:     "from-amber-400  to-yellow-600",
  Tubers:     "from-orange-400 to-amber-600",
  Fruits:     "from-pink-400   to-rose-600",
};

export default function ProduceCard({ listing, onAddToCart }: ProduceCardProps) {
  const [qty, setQty] = useState(listing.minimumOrderQty);
  const [added, setAdded] = useState(false);

  const step     = listing.minimumOrderQty;
  const minQty   = listing.minimumOrderQty;
  const maxQty   = listing.availableQuantity;
  const lineTotal = qty * listing.unitPrice;

  const decrement = () => setQty((q) => Math.max(minQty, q - step));
  const increment = () => setQty((q) => Math.min(maxQty, q + step));

  const handleAdd = () => {
    onAddToCart(listing, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const isSoldOut = listing.status === "SOLD_OUT";
  const badgeColor = CATEGORY_COLORS[listing.categoryName] ?? "bg-gray-100 text-gray-600";
  const gradient   = CATEGORY_GRADIENTS[listing.categoryName] ?? "from-green-400 to-teal-600";

  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">

      {/* ── Image / Placeholder ── */}
      <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        {listing.imageUrls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.imageUrls[0]}
            alt={listing.produceName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-white/60 text-5xl font-bold select-none">
            {listing.produceName.charAt(0)}
          </span>
        )}

        {/* Category badge */}
        <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {listing.categoryName}
        </span>

        {/* Organic badge */}
        {listing.isOrganic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full">
            <Leaf size={10} />
            Organic
          </span>
        )}

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="p-4 flex flex-col flex-1 gap-3">

        {/* Produce name + variety */}
        <div>
          <h2 className="font-bold text-gray-900 text-base leading-tight">
            {listing.produceName}
            {listing.variety && (
              <span className="ml-1 text-gray-400 font-normal text-sm">({listing.variety})</span>
            )}
          </h2>

          {/* Seller / cooperative */}
          <div className="flex items-center gap-1 mt-0.5">
            {listing.sellerVerified ? (
              <BadgeCheck size={14} className="text-blue-500 shrink-0" />
            ) : (
              <ShieldCheck size={14} className="text-gray-300 shrink-0" />
            )}
            <span className="text-xs text-gray-500 truncate">{listing.sellerName}</span>
          </div>
        </div>

        {/* Meta row */}
        <ul className="space-y-1">
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={12} className="text-green-500 shrink-0" />
            {listing.farmLocation}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarCheck size={12} className="text-green-500 shrink-0" />
            Harvested {formatDate(listing.harvestDate)}
          </li>
          <li className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package size={12} className="text-green-500 shrink-0" />
            {formatQty(listing.availableQuantity, listing.unit)} remaining
            {listing.status === "PARTIALLY_SOLD" && (
              <span className="ml-1 text-amber-500 font-medium">· Partial</span>
            )}
          </li>
        </ul>

        {/* Delivery chips */}
        <div className="flex gap-1.5 flex-wrap">
          {listing.deliveryOptions.includes("SELF_PICKUP") && (
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              <Package size={10} />
              Pickup
            </span>
          )}
          {listing.deliveryOptions.includes("DELIVERED") && (
            <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
              <Truck size={10} />
              Delivery {listing.deliveryRadiusKm && `(${listing.deliveryRadiusKm}km)`}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-green-700">
            {listing.currency} {listing.unitPrice.toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">/ {listing.unit.toLowerCase()}</span>
        </div>

        {/* ── Quantity selector ── */}
        {!isSoldOut && (
          <div className="mt-auto space-y-2">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1">
              <button
                onClick={decrement}
                disabled={qty <= minQty}
                aria-label="Decrease quantity"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Minus size={14} />
              </button>

              <div className="text-center">
                <span className="font-semibold text-gray-800 text-sm">{qty.toLocaleString()} kg</span>
                <p className="text-xs text-gray-400">
                  {listing.currency} {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <button
                onClick={increment}
                disabled={qty >= maxQty}
                aria-label="Increase quantity"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <Plus size={14} />
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              Min {minQty.toLocaleString()} kg · step {step.toLocaleString()} kg
            </p>

            <button
              onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                added
                  ? "bg-green-600 text-white scale-95"
                  : "bg-green-600 hover:bg-green-700 active:scale-95 text-white"
              }`}
            >
              <ShoppingCart size={15} />
              {added ? "Added!" : "Add to Order"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
