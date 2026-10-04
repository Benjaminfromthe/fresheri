"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ShoppingBag, Package, Truck, ChevronDown, ChevronUp,
  Phone, MapPin, ShieldCheck, Clock, CheckCircle2,
  Loader2, RefreshCw, Lock, ArrowRight,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "@/i18n/navigation";
import { getStoredUser, getMyOrders, getPickupContact } from "@/lib/api-client";
import type { MyOrder } from "@/lib/api-client";
import { useRouter } from "@/i18n/navigation";

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  PENDING:    "bg-amber-50  dark:bg-amber-950/40  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-800/50",
  CONFIRMED:  "bg-blue-50   dark:bg-blue-950/40   text-blue-700   dark:text-blue-400   border-blue-200   dark:border-blue-800/50",
  PROCESSING: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/50",
  DISPATCHED: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50",
  DELIVERED:  "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
  CANCELLED:  "bg-red-50    dark:bg-red-950/40    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800/50",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING:    <Clock     size={11} />,
  CONFIRMED:  <CheckCircle2 size={11} />,
  PROCESSING: <Loader2   size={11} className="animate-spin" />,
  DISPATCHED: <Truck     size={11} />,
  DELIVERED:  <CheckCircle2 size={11} />,
  CANCELLED:  <ShoppingBag size={11} />,
};

function StatusBadge({ status }: { status: string }) {
  const styles = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${styles}`}>
      {STATUS_ICONS[status]}
      {status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Pickup contact accordion — disclosed only for SELF_PICKUP + CONFIRMED/DELIVERED
// ─────────────────────────────────────────────────────────────

function PickupContactAccordion({ orderId, token }: { orderId: string; token: string }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState<{
    pickupLocation: string; farmerContact: string; farmerName: string; note: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          View Pickup Location &amp; Contact
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-900/15 p-4 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Loading secure contact details…
            </div>
          )}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
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
                  <a
                    href={`tel:${contact.farmerContact}`}
                    className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
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
// Order card
// ─────────────────────────────────────────────────────────────

function OrderCard({ order, token }: { order: MyOrder; token: string }) {
  const currency  = order.currency ?? "RWF";
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const isPickup      = order.deliveryOption === "SELF_PICKUP";
  const isConfirmed   = ["CONFIRMED", "PROCESSING", "DISPATCHED", "DELIVERED"].includes(order.status);
  const showPickup    = isPickup && isConfirmed;
  const totalKg       = order.orderItems.reduce((s, i) => s + i.quantityOrdered, 0);
  const placedDate    = new Date(order.placedAt).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <article className="
      bg-white dark:bg-slate-900
      rounded-2xl border border-slate-200 dark:border-slate-800
      shadow-sm hover:shadow-md
      transition-all duration-200 ease-in-out
      overflow-hidden
    ">
      {/* Header row */}
      <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-0.5">Order #{order.orderNumber}</p>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {order.orderItems.map((i) => i.produceName).join(", ")}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{placedDate}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={order.status} />
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPickup
              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
              : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"
          }`}>
            {isPickup ? <Package size={9} /> : <Truck size={9} />}
            {isPickup ? "Self-Pickup" : "Delivery"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        {/* Items list */}
        <ul className="space-y-1.5">
          {order.orderItems.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300">
                {item.produceName}
                {item.variety ? ` (${item.variety})` : ""}
              </span>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                {item.quantityOrdered.toLocaleString()} {item.unit.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>

        {/* Totals row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            <p>Total weight: <span className="font-semibold text-slate-700 dark:text-slate-300">{totalKg.toLocaleString()} kg</span></p>
            {order.deliveryFee > 0 && (
              <p>Delivery: <span className="text-purple-600 dark:text-purple-400">{fmt(order.deliveryFee)}</span></p>
            )}
          </div>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(order.totalAmount)}</p>
        </div>

        {/* Delivery address for DELIVERED orders */}
        {!isPickup && order.deliveryAddress && (
          <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl px-3 py-2.5">
            <Truck size={13} className="text-purple-500 mt-0.5 shrink-0" />
            <p className="text-xs text-purple-700 dark:text-purple-300">{order.deliveryAddress}</p>
          </div>
        )}

        {/* ── PRIVACY DISCLOSURE: pickup contact unlocked post-confirmation ── */}
        {showPickup ? (
          <PickupContactAccordion orderId={order.id} token={token} />
        ) : isPickup && !isConfirmed ? (
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 rounded-xl px-3 py-2.5">
            <Lock size={12} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Pickup location and farmer contact will be unlocked once your order is confirmed.
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// My Orders Page
// ─────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const t      = useTranslations("common");
  const router = useRouter();

  const [orders, setOrders]       = useState<MyOrder[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotal]    = useState(1);
  const [token, setToken]         = useState("");
  const [buyerId, setBuyerId]     = useState("");

  // Resolve auth on mount
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/auth"); return; }
    setToken(user.token);
    setBuyerId(user.userId);
  }, [router]);

  const loadOrders = useCallback(async (uid: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrders(uid, p);
      setOrders(res.orders);
      setTotal(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (buyerId) loadOrders(buyerId, page);
  }, [buyerId, page, loadOrders]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Orders</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your orders and view pickup details
            </p>
          </div>
          <button
            onClick={() => buyerId && loadOrders(buyerId, page)}
            disabled={loading}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="text-red-500 dark:text-red-400 text-sm font-medium">{error}</p>
            <button
              onClick={() => buyerId && loadOrders(buyerId, page)}
              className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <RefreshCw size={13} /> Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ShoppingBag size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-slate-100">No orders yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your orders will appear here after you place them.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Browse Marketplace
              <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Order list */}
        {!loading && !error && orders.length > 0 && (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} token={token} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
