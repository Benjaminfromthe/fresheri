"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter }     from "@/i18n/navigation";
import {
  Package, Truck, Clock, CheckCircle2, Loader2,
  RefreshCw, ChevronDown, ChevronUp, Sprout,
  AlertCircle, KeyRound, User,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getStoredUser, getFarmerOrders, updateFarmerOrderStatus } from "@/lib/api-client";
import type { FarmerOrder } from "@/lib/api-client";

// ─────────────────────────────────────────────────────────────
// Status badge
// ─────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED:       "bg-blue-50   dark:bg-blue-950/40   text-blue-700   dark:text-blue-400   border-blue-200   dark:border-blue-800/40",
  PROCESSING:      "bg-amber-50  dark:bg-amber-950/40  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-800/40",
  READY_FOR_PICKUP:"bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
  DISPATCHED:      "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
  DELIVERED:       "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
  CANCELLED:       "bg-red-50    dark:bg-red-950/40    text-red-700    dark:text-red-400    border-red-200    dark:border-red-800/40",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.CONFIRMED;
  const label = status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${style}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Action button config per current status
// ─────────────────────────────────────────────────────────────

interface ActionConfig {
  action:  "accept" | "ready" | "complete";
  label:   string;
  icon:    React.ReactNode;
  style:   string;
}

const ACTION_MAP: Partial<Record<string, ActionConfig>> = {
  CONFIRMED: {
    action: "accept",
    label:  "Accept Order",
    icon:   <CheckCircle2 size={14} />,
    style:  "bg-blue-600 hover:bg-blue-700 text-white",
  },
  PROCESSING: {
    action: "ready",
    label:  "Mark Packed & Ready",
    icon:   <Package size={14} />,
    style:  "bg-amber-500 hover:bg-amber-600 text-white",
  },
  READY_FOR_PICKUP: {
    action: "complete",
    label:  "Complete (Picked Up)",
    icon:   <CheckCircle2 size={14} />,
    style:  "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
  DISPATCHED: {
    action: "complete",
    label:  "Mark Delivered",
    icon:   <Truck size={14} />,
    style:  "bg-emerald-600 hover:bg-emerald-700 text-white",
  },
};

// ─────────────────────────────────────────────────────────────
// FarmerOrderCard
// ─────────────────────────────────────────────────────────────

interface FarmerOrderCardProps {
  order:    FarmerOrder;
  sellerId: string;
  onUpdate: (updated: FarmerOrder) => void;
}

function FarmerOrderCard({ order, sellerId, onUpdate }: FarmerOrderCardProps) {
  const [expanded,   setExpanded]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [actionErr,  setActionErr]  = useState<string | null>(null);

  const currency = order.currency ?? "RWF";
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const actionCfg  = ACTION_MAP[order.status];
  const isTerminal = ["DELIVERED", "CANCELLED"].includes(order.status);
  const isPickup   = order.deliveryOption === "SELF_PICKUP";

  const placedDate = new Date(order.placedAt).toLocaleDateString("en-KE", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  const handleAction = async () => {
    if (!actionCfg) return;
    setLoading(true);
    setActionErr(null);
    try {
      const updated = await updateFarmerOrderStatus(order.id, sellerId, actionCfg.action);
      onUpdate(updated);
    } catch (err) {
      setActionErr(err instanceof Error ? err.message : "Action failed. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="
      bg-white dark:bg-slate-900
      rounded-2xl border border-slate-200 dark:border-slate-800
      shadow-sm overflow-hidden
      transition-all duration-200 ease-in-out
    ">
      {/* ── Header ── */}
      <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono font-medium">
              #{order.orderNumber}
            </p>
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

          {/* Items summary */}
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1.5">
            {order.orderItems.map((i) =>
              `${i.produceName}${i.variety ? ` (${i.variety})` : ""} — ${i.quantityOrdered.toLocaleString()} kg`
            ).join(", ")}
          </p>

          {/* Buyer + date */}
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <User size={11} />
              {order.buyer.firstName} {order.buyer.lastName}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <Clock size={11} />
              {placedDate}
            </span>
          </div>
        </div>

        {/* Total */}
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{fmt(order.totalAmount)}</p>
          {order.deliveryFee > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              incl. {fmt(order.deliveryFee)} delivery
            </p>
          )}
        </div>
      </div>

      {/* ── Pickup code (shown when READY_FOR_PICKUP) ── */}
      {isPickup && order.status === "READY_FOR_PICKUP" && order.pickupCode && (
        <div className="mx-5 mb-4 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl px-4 py-3">
          <KeyRound size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">
              Buyer Pickup Code
            </p>
            <p className="text-2xl font-extrabold tracking-[0.35em] text-slate-900 dark:text-slate-100 mt-0.5">
              {order.pickupCode}
            </p>
          </div>
        </div>
      )}

      {/* ── Expanded details ── */}
      {expanded && (
        <div className="px-5 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          <ul className="space-y-1.5">
            {order.orderItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">
                  {item.produceName}{item.variety ? ` (${item.variety})` : ""}
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  {item.quantityOrdered.toLocaleString()} {item.unit.toLowerCase()} ×{" "}
                  {fmt(item.unitPriceAtOrder)}/{item.unit.toLowerCase()} ={" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {fmt(item.lineTotal)}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {order.deliveryAddress && (
            <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/30 rounded-xl px-3 py-2.5">
              <Truck size={13} className="text-purple-500 mt-0.5 shrink-0" />
              <p className="text-xs text-purple-700 dark:text-purple-300">{order.deliveryAddress}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Footer: expand + action ── */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? "Hide details" : "Show details"}
        </button>

        <div className="flex flex-col items-end gap-1.5">
          {actionErr && (
            <p className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertCircle size={11} /> {actionErr}
            </p>
          )}

          {!isTerminal && actionCfg && (
            <button
              onClick={handleAction}
              disabled={loading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                transition-all duration-200 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
                ${actionCfg.style}
              `}
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Processing…</>
                : <>{actionCfg.icon} {actionCfg.label}</>
              }
            </button>
          )}

          {isTerminal && (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              {order.status === "DELIVERED" ? "✓ Completed" : "✗ Cancelled"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Status filter tabs
// ─────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { label: "Active",    values: ["CONFIRMED","PROCESSING","READY_FOR_PICKUP","DISPATCHED"] },
  { label: "Completed", values: ["DELIVERED"] },
  { label: "All",       values: [] },
] as const;

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function FarmerDashboardPage() {
  const router = useRouter();

  const [orders,   setOrders]   = useState<FarmerOrder[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [sellerId, setSellerId] = useState("");
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(1);
  const [tab,      setTab]      = useState<0 | 1 | 2>(0);

  // Auth guard — only farmers/cooperatives
  useEffect(() => {
    const user = getStoredUser();
    if (!user) { router.replace("/auth"); return; }
    const allowed = ["FARMER","COOPERATIVE"];
    if (!allowed.includes(user.role)) { router.replace("/"); return; }
    setSellerId(user.userId);
  }, [router]);

  const load = useCallback(async (uid: string, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFarmerOrders(uid, p);
      setOrders(res.orders);
      setTotal(res.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (sellerId) load(sellerId, page); }, [sellerId, page, load]);

  // Optimistic update from card action
  const handleUpdate = useCallback((updated: FarmerOrder) => {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
  }, []);

  // Apply tab filter
  const tabCfg = FILTER_TABS[tab];
  const visible = tabCfg.values.length === 0
    ? orders
    : orders.filter((o) => (tabCfg.values as readonly string[]).includes(o.status));

  const activeCount = orders.filter((o) =>
    ["CONFIRMED","PROCESSING","READY_FOR_PICKUP","DISPATCHED"].includes(o.status)
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-150">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Sprout size={17} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Farmer Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Manage incoming orders for your listings
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                {activeCount} order{activeCount !== 1 ? "s" : ""} need action
              </span>
            )}
            <button
              onClick={() => sellerId && load(sellerId, page)}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-1 mb-6 w-fit">
          {FILTER_TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setTab(i as 0 | 1 | 2)}
              className={`
                px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                ${tab === i
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }
              `}
            >
              {t.label}
              {t.label === "Active" && activeCount > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {activeCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            {[1,2,3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>
            <button
              onClick={() => sellerId && load(sellerId, page)}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Package size={28} className="text-slate-400 dark:text-slate-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900 dark:text-slate-100">
                {tab === 0 ? "No active orders" : tab === 1 ? "No completed orders yet" : "No orders yet"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {tab === 0
                  ? "Orders from buyers will appear here when placed."
                  : "Completed orders will show here."}
              </p>
            </div>
          </div>
        )}

        {/* ── Order cards ── */}
        {!loading && !error && visible.length > 0 && (
          <>
            <div className="space-y-4">
              {visible.map((order) => (
                <FarmerOrderCard
                  key={order.id}
                  order={order}
                  sellerId={sellerId}
                  onUpdate={handleUpdate}
                />
              ))}
            </div>

            {/* Pagination */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {page} of {total}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(total, p + 1))}
                  disabled={page === total}
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
