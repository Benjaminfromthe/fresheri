"use client";

import { useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingCart, Trash2, Package, Truck,
  ChevronRight, ShoppingBag,
} from "lucide-react";
import { CartItem, DeliveryOption } from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";

interface CartDrawerProps {
  cart:          CartItem[];
  onRemove:      (listingId: string) => void;
  onCheckout:    () => void;
  currency:      string;
}

// ─────────────────────────────────────────────────────────────
// CartDrawer
//
// Sticky right-side panel — always visible while shopping.
// • Empty state: collapsed tab with ShoppingCart icon + count
// • Items state: expanded panel with live line items, totals,
//   remove buttons, and a Proceed to Checkout CTA
// Fully dark-mode aware.
// ─────────────────────────────────────────────────────────────

export default function CartDrawer({
  cart, onRemove, onCheckout, currency,
}: CartDrawerProps) {
  const t  = useTranslations("orders");
  const tc = useTranslations("common");

  const hasItems    = cart.length > 0;
  const subtotal    = cart.reduce((s, i) => s + i.quantityKg * i.listing.unitPrice, 0);
  const deliveryFee = cart.some((i) => i.selectedFulfillment === "DELIVERED")
    ? BASE_DELIVERY_FEE * cart.filter((i) => i.selectedFulfillment === "DELIVERED").length
    : 0;
  const total = subtotal + deliveryFee;

  // Scroll the last-added item into view
  const lastItemRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (hasItems) lastItemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [cart.length, hasItems]);

  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // ── Empty / collapsed state ──────────────────────────────
  if (!hasItems) {
    return (
      <div className="
        hidden xl:flex flex-col items-center justify-center
        w-72 shrink-0 sticky top-20 self-start
        rounded-2xl border border-dashed border-slate-200 dark:border-slate-700
        bg-white dark:bg-slate-900
        py-10 gap-3
        transition-all duration-300
      ">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <ShoppingCart size={22} className="text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Your order is empty</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center px-6 leading-relaxed">
          Add items from the grid — they&apos;ll appear here instantly
        </p>
      </div>
    );
  }

  // ── Populated state ──────────────────────────────────────
  return (
    <div className="
      hidden xl:flex flex-col
      w-72 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)]
      rounded-2xl border border-slate-200 dark:border-slate-800
      bg-white dark:bg-slate-900
      shadow-lg dark:shadow-slate-950/50
      overflow-hidden
      transition-all duration-300
    ">

      {/* ── Header ── */}
      <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <ShoppingBag size={14} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            Your Order
          </span>
        </div>
        <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
          {cart.length} item{cart.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Item list ── */}
      <ul className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        {cart.map((item, idx) => {
          const isLast     = idx === cart.length - 1;
          const lineTotal  = item.quantityKg * item.listing.unitPrice;
          const isDelivery = item.selectedFulfillment === "DELIVERED";

          return (
            <li
              key={item.listing.id}
              ref={isLast ? lastItemRef : undefined}
              className="px-4 py-3 flex items-start gap-3 group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150"
            >
              {/* Emoji / category indicator */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0 mt-0.5">
                {item.listing.produceName.charAt(0)}
              </div>

              <div className="flex-1 min-w-0">
                {/* Name */}
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight">
                  {item.listing.produceName}
                  {item.listing.variety && (
                    <span className="font-normal text-slate-400 dark:text-slate-500 ml-1 text-xs">
                      ({item.listing.variety})
                    </span>
                  )}
                </p>

                {/* Qty + fulfillment */}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {item.quantityKg.toLocaleString()} kg
                  </span>
                  <span className={`
                    inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium
                    ${isDelivery
                      ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
                      : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    }
                  `}>
                    {isDelivery ? <Truck size={9} /> : <Package size={9} />}
                    {isDelivery ? "Delivery" : "Pickup"}
                  </span>
                </div>

                {/* Line total */}
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  {fmt(lineTotal)}
                  {isDelivery && (
                    <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">
                      +{fmt(BASE_DELIVERY_FEE)} delivery
                    </span>
                  )}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => onRemove(item.listing.id)}
                aria-label={`Remove ${item.listing.produceName}`}
                className="opacity-0 group-hover:opacity-100 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all duration-150 mt-0.5 shrink-0 p-0.5"
              >
                <Trash2 size={13} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* ── Totals + CTA ── */}
      <div className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">

        {/* Subtotal rows */}
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(subtotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Delivery fees</span>
              <span className="font-medium text-purple-600 dark:text-purple-400">{fmt(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Total</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{fmt(total)}</span>
          </div>
        </div>

        {/* Checkout CTA */}
        <button
          onClick={onCheckout}
          className="
            w-full flex items-center justify-center gap-2
            bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]
            text-white font-semibold text-sm
            py-3 rounded-xl
            transition-all duration-200
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-emerald-500 focus-visible:ring-offset-2
            focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900
          "
        >
          Proceed to Checkout
          <ChevronRight size={15} />
        </button>

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          {tc("privacyProtected")}
        </p>
      </div>
    </div>
  );
}
