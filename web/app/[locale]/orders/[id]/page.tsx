"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams }        from "next/navigation";
import { useRouter, Link }  from "@/i18n/navigation";
import {
  CheckCircle2, Package, Truck, Clock,
  ShieldCheck, Phone, MapPin, Lock,
  ChevronDown, ChevronUp, RefreshCw,
  Loader2, ArrowLeft, KeyRound,
} from "lucide-react";
import Header  from "@/components/layout/Header";
import Footer  from "@/components/layout/Footer";
import { getStoredUser, getOrderById, getPickupContact } from "@/lib/api-client";
import type { MyOrder } from "@/lib/api-client";

// ─────────────────────────────────────────────────────────────
// Order status → timeline step mapping
// ─────────────────────────────────────────────────────────────

type TimelineStep = {
  key:     string;
  label:   string;
  sublabel: string;
  icon:    React.ReactNode;
};

const PICKUP_STEPS: TimelineStep[] = [
  { key: "CONFIRMED",        label: "Order Placed",            sublabel: "Your order has been confirmed",           icon: <CheckCircle2 size={18} /> },
  { key: "PROCESSING",       label: "Accepted by Cooperative", sublabel: "The cooperative is preparing your order", icon: <Package      size={18} /> },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup",        sublabel: "Your order is packed — show pickup code", icon: <KeyRound     size={18} /> },
  { key: "DELIVERED",        label: "Completed",               sublabel: "Order fulfilled successfully",            icon: <CheckCircle2 size={18} /> },
];

const DELIVERY_STEPS: TimelineStep[] = [
  { key: "CONFIRMED",  label: "Order Placed",            sublabel: "Your order has been confirmed",          icon: <CheckCircle2 size={18} /> },
  { key: "PROCESSING", label: "Accepted by Cooperative", sublabel: "The cooperative is preparing your order",icon: <Package      size={18} /> },
  { key: "DISPATCHED", label: "Out for Delivery",        sublabel: "Your produce is on the way",             icon: <Truck        size={18} /> },
  { key: "DELIVERED",  label: "Delivered",               sublabel: "Order delivered to your address",        icon: <CheckCircle2 size={18} /> },
];

// Maps every possible status to its zero-based step index
const PICKUP_STATUS_INDEX: Record<string, number> = {
  CONFIRMED: 0, PROCESSING: 1, READY_FOR_PICKUP: 2, DELIVERED: 3,
};
const DELIVERY_STATUS_INDEX: Record<string, number> = {
  CONFIRMED: 0, PROCESSING: 1, DISPATCHED: 2, DELIVERED: 3,
};

// ─────────────────────────────────────────────────────────────
// PickupCodeCard — 6-digit code displayed when READY_FOR_PICKUP
// ─────────────────────────────────────────────────────────────

function PickupCodeCard({ code }: { code: string }) {
  const digits = code.split("");
  return (
    <div className="
      rounded-2xl border-2 border-emerald-300 dark:border-emerald-700
      bg-emerald-50 dark:bg-emerald-950/30
      px-6 py-5 text-center space-y-3
    ">
      <div className="flex items-center justify-center gap-2 text-emerald-700 dark:text-emerald-400">
        <KeyRound size={18} />
        <p className="text-sm font-bold uppercase tracking-widest">Pickup Verification Code</p>
      </div>

      {/* Big digit tiles */}
      <div className="flex items-center justify-center gap-2 my-2">
        {digits.map((d, i) => (
          <div
            key={i}
            className="
              w-11 h-14 flex items-center justify-center
              rounded-xl text-2xl font-extrabold tracking-tight
              bg-white dark:bg-slate-800
              border border-emerald-200 dark:border-emerald-800
              text-slate-900 dark:text-slate-100
              shadow-sm
            "
          >
            {d}
          </div>
        ))}
      </div>

      <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
        Show this code to the cooperative at the farm gate to verify your identity and collect your order.
      </p>
      <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl px-3 py-2 text-left">
        <Lock size={11} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          Keep this code private — it is exclusive to your order.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PickupContactAccordion
// ─────────────────────────────────────────────────────────────

function PickupContactAccordion({ orderId, token }: { orderId: string; token: string }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<{
    pickupLocation: string; farmerContact: string; farmerName: string; note: string;
  } | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const reveal = async () => {
    if (contact) { setOpen((o) => !o); return; }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const data = await getPickupContact(orderId, token);
      setContact(data);
    } catch {
      setError("Could not load pickup details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        onClick={reveal}
        className="
          w-full flex items-center justify-between
          bg-emerald-50 dark:bg-emerald-900/20
          border border-emerald-200 dark:border-emerald-800/50
          rounded-xl px-4 py-2.5
          text-sm font-semibold text-emerald-700 dark:text-emerald-400
          hover:bg-emerald-100 dark:hover:bg-emerald-900/30
          transition-all duration-200
        "
      >
        <span className="flex items-center gap-2">
          <ShieldCheck size={14} />
          View Farm Location &amp; Contact
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/15 p-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {contact && (
            <>
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Cooperative / Farm</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{contact.farmerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pickup Location</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contact.pickupLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Direct Contact</p>
                  <a href={`tel:${contact.farmerContact}`} className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
                    {contact.farmerContact}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white/60 dark:bg-slate-800/60 rounded-lg p-2.5">
                <Lock size={11} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{contact.note}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OrderTimeline
// ─────────────────────────────────────────────────────────────

function OrderTimeline({ order }: { order: MyOrder }) {
  const isPickup  = order.deliveryOption === "SELF_PICKUP";
  const steps     = isPickup ? PICKUP_STEPS : DELIVERY_STEPS;
  const statusMap = isPickup ? PICKUP_STATUS_INDEX : DELIVERY_STATUS_INDEX;

  const isCancelled   = order.status === "CANCELLED";
  const currentIndex  = statusMap[order.status] ?? 0;

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => {
        const isDone    = !isCancelled && currentIndex > idx;
        const isActive  = !isCancelled && currentIndex === idx;
        const isPending = isCancelled || currentIndex < idx;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Left: icon + connector line */}
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10
                transition-all duration-300
                ${isDone
                  ? "bg-emerald-500 text-white"
                  : isActive
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                }
              `}>
                {isDone ? <CheckCircle2 size={18} /> : step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className={`w-0.5 flex-1 my-1 min-h-[2rem] ${isDone ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-800"}`} />
              )}
            </div>

            {/* Right: label */}
            <div className={`pb-6 flex-1 ${idx === steps.length - 1 ? "pb-0" : ""}`}>
              <p className={`text-sm font-semibold leading-tight ${
                isDone    ? "text-emerald-700 dark:text-emerald-400" :
                isActive  ? "text-slate-900 dark:text-slate-100" :
                            "text-slate-400 dark:text-slate-600"
              }`}>
                {step.label}
                {isActive && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    Now
                  </span>
                )}
              </p>
              <p className={`text-xs mt-0.5 ${
                isActive || isDone
                  ? "text-slate-500 dark:text-slate-400"
                  : "text-slate-300 dark:text-slate-600"
              }`}>
                {step.sublabel}
              </p>
            </div>
          </div>
        );
      })}

      {isCancelled && (
        <div className="mt-2 flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
          <Clock size={14} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium">This order was cancelled.</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function OrderTrackerPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? "";
  const router  = useRouter();

  const [order,   setOrder]   = useState<MyOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState("");
  const [token,   setToken]   = useState("");

  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/auth"); return; }
    setBuyerId(user.userId);
    setToken(user.token);
  }, [router]);

  const load = useCallback(async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrderById(orderId, uid);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { if (buyerId) load(buyerId); }, [buyerId, load]);

  const currency = order?.currency ?? "RWF";
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const isPickup    = order?.deliveryOption === "SELF_PICKUP";
  const isConfirmed = ["CONFIRMED","PROCESSING","READY_FOR_PICKUP","DISPATCHED","DELIVERED"]
    .includes(order?.status ?? "");
  const isReady     = order?.status === "READY_FOR_PICKUP";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Back + refresh */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/orders"
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft size={15} /> My Orders
          </Link>
          <button
            onClick={() => buyerId && load(buyerId)}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={() => buyerId && load(buyerId)} className="mt-3 text-sm text-emerald-600 hover:underline">
              Try again
            </button>
          </div>
        )}

        {/* Order content */}
        {!loading && order && (
          <div className="space-y-5">

            {/* ── Header card ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Order #{order.orderNumber}</p>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {order.orderItems.map((i) => i.produceName).join(", ")}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Placed {new Date(order.placedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">{fmt(order.totalAmount)}</p>
              </div>

              {/* Items */}
              <ul className="mt-3 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
                {order.orderItems.map((item) => (
                  <li key={item.id} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.produceName}{item.variety ? ` (${item.variety})` : ""}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      {item.quantityOrdered.toLocaleString()} kg
                    </span>
                  </li>
                ))}
                {order.deliveryFee > 0 && (
                  <li className="flex justify-between text-xs text-purple-600 dark:text-purple-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Delivery fee</span>
                    <span>{fmt(order.deliveryFee)}</span>
                  </li>
                )}
              </ul>
            </div>

            {/* ── Timeline ── */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-5">
                Order Progress
              </p>
              <OrderTimeline order={order} />
            </div>

            {/* ── Pickup code — shown when READY_FOR_PICKUP ── */}
            {isPickup && isReady && order.pickupCode && (
              <PickupCodeCard code={order.pickupCode} />
            )}

            {/* ── Pickup code teaser — show when not yet ready ── */}
            {isPickup && !isReady && isConfirmed && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <KeyRound size={18} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pickup code coming soon</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      Your 6-digit pickup code will appear here once the cooperative marks your order as ready.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Pickup contact accordion ── */}
            {isPickup && isConfirmed && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                  Cooperative Details
                </p>
                <PickupContactAccordion orderId={order.id} token={token} />
              </div>
            )}

            {/* ── Delivery address ── */}
            {!isPickup && order.deliveryAddress && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Delivery Address
                </p>
                <div className="flex items-start gap-2.5">
                  <Truck size={15} className="text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{order.deliveryAddress}</p>
                </div>
              </div>
            )}

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
