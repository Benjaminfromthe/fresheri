"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  X, Truck, Package, Trash2, ChevronRight, MapPin,
  CheckCircle2, Loader2, Phone, Navigation, Clock,
  ShieldCheck, Lock, Smartphone, AlertCircle,
} from "lucide-react";
import {
  CartItem, DeliveryOption, CheckoutTotals, OrderResult, PickupContact,
} from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import { getStoredUser }     from "@/lib/api-client";
import FulfillmentToggle     from "./FulfillmentToggle";
import PrivacyBadge          from "./PrivacyBadge";

// ── Paypack global type (no external script needed) ──────────
// Paypack is a pure REST API — no client-side JS to load

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────
interface CheckoutModalProps {
  cart:          CartItem[];
  onClose:       () => void;
  onRemoveItem:  (listingId: string) => void;
  onPlaceOrder:  (deliveryOption: DeliveryOption, deliveryAddress: string) => Promise<OrderResult[]>;
}

function calcTotals(cart: CartItem[], deliveryOption: DeliveryOption): CheckoutTotals {
  const currency    = cart[0]?.listing.currency ?? "RWF";
  const subtotal    = cart.reduce((s, i) => s + i.quantityKg * i.listing.unitPrice, 0);
  const deliveryFee = deliveryOption === "DELIVERED" ? BASE_DELIVERY_FEE : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee, currency };
}
function dominantFulfillment(cart: CartItem[]): DeliveryOption {
  return cart.some((i) => i.selectedFulfillment === "DELIVERED") ? "DELIVERED" : "SELF_PICKUP";
}

type Step = "review" | "fulfillment" | "confirm" | "payment" | "success";

// ─────────────────────────────────────────────────────────────
// PickupContactCard
// ─────────────────────────────────────────────────────────────
function PickupContactCard({ contact }: { contact: PickupContact }) {
  const t = useTranslations("orders");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t("pickupUnlocked")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t("pickupUnlockedSub")}</p>
        </div>
      </div>
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("cooperativeFarm")}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{contact.farmerName}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Navigation size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("pickupLocation")}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{contact.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Phone size={16} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t("directContact")}</p>
            <a href={`tel:${contact.farmerContact}`} className="text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:underline">
              {contact.farmerContact}
            </a>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5">
          <Lock size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{contact.note}</p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DeliveryTrackingCard
// ─────────────────────────────────────────────────────────────
function DeliveryTrackingCard({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("orders");
  const stages = [
    { icon: CheckCircle2, label: t("trackingPlaced"),    sub: t("trackingPlacedSub"),    done: true,  color: "text-emerald-500" },
    { icon: Package,      label: t("trackingAssigned"),  sub: t("trackingAssignedSub"),  done: true,  color: "text-purple-500"  },
    { icon: Truck,        label: t("trackingInTransit"), sub: t("trackingInTransitSub"), done: false, color: "text-slate-300 dark:text-slate-600" },
    { icon: CheckCircle2, label: t("trackingDelivered"), sub: t("trackingDeliveredSub"), done: false, color: "text-slate-300 dark:text-slate-600" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
          <Truck size={18} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t("orderDispatched")}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{t("orderNumber", { number: orderNumber })}</p>
        </div>
      </div>
      <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 rounded-2xl p-4">
        <ol className="space-y-3">
          {stages.map(({ icon: Icon, label, sub, done, color }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <Icon size={16} className={color} />
                {i < stages.length - 1 && (
                  <div className={`w-px h-4 mt-1 ${done ? "bg-purple-300 dark:bg-purple-700" : "bg-slate-200 dark:bg-slate-700"}`} />
                )}
              </div>
              <div className="pb-1">
                <p className={`text-xs font-semibold ${done ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-600"}`}>{label}</p>
                <p className={`text-xs ${done ? "text-slate-500 dark:text-slate-400" : "text-slate-300 dark:text-slate-600"}`}>{sub}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-start gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl p-2.5">
          <ShieldCheck size={12} className="text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">{t("trackingPrivacyNote")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
        <Clock size={11} />{t("smsStagedNote")}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PaymentStep — Paypack MoMo push + polling
//
// Flow:
//   1. User confirms their phone number
//   2. We POST to /api/payments/initiate (already called — data is ready)
//   3. User sees "Check your phone" screen
//   4. We poll GET /api/payments/status?ref=… every 3 seconds
//   5. On "successful" → call onSuccess()
//   6. On "failed" → show error, allow retry
// ─────────────────────────────────────────────────────────────

interface PaymentStepProps {
  paypackRef:  string;          // Paypack transaction ref from initiate
  amount:      number;
  currency:    string;
  phone:       string;          // normalised phone that received the push
  orderNumber: string;
  onSuccess:   () => void;
  onCancel:    () => void;
}

function PaymentStep({ paypackRef, amount, currency, phone, orderNumber, onSuccess, onCancel }: PaymentStepProps) {
  const [pollStatus, setPollStatus] = useState<"pending" | "successful" | "failed">("pending");
  const [pollError,  setPollError]  = useState<string | null>(null);
  const [attempts,   setAttempts]   = useState(0);
  const MAX_ATTEMPTS = 40; // 40 × 3s = 2 minutes timeout

  const fmt = `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  // Poll every 3 seconds
  useEffect(() => {
    if (pollStatus !== "pending") return;

    const interval = setInterval(async () => {
      setAttempts((a) => {
        if (a >= MAX_ATTEMPTS) {
          clearInterval(interval);
          setPollStatus("failed");
          setPollError("Payment timed out. Please try again.");
          return a;
        }
        return a + 1;
      });

      try {
        const res  = await fetch(`/api/payments/status?ref=${paypackRef}`);
        const data = await res.json() as { status?: string; error?: string };

        if (data.status === "successful") {
          clearInterval(interval);
          setPollStatus("successful");
          setTimeout(onSuccess, 800); // brief pause so user sees the tick
        } else if (data.status === "failed") {
          clearInterval(interval);
          setPollStatus("failed");
          setPollError("Payment was declined. Please try again.");
        }
        // "pending" — keep polling
      } catch {
        // Network hiccup — keep polling, don't abort
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paypackRef, pollStatus, onSuccess]);

  return (
    <div className="space-y-5 py-2">

      {/* Amount */}
      <div className="text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mb-1">Total to Pay</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{fmt}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Order #{orderNumber}</p>
      </div>

      {/* Status display */}
      {pollStatus === "pending" && (
        <div className="flex flex-col items-center gap-4 py-4">
          {/* Animated phone icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Smartphone size={36} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
              <Loader2 size={14} className="text-white animate-spin" />
            </div>
          </div>

          <div className="text-center">
            <p className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Check your phone!
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
              A Mobile Money payment request of <strong>{fmt}</strong> has been sent to
            </p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {phone}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              Open your MTN MoMo or Airtel app and approve the request.
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {[0,1,2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-emerald-500"
                style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500">
            Waiting for approval… ({Math.max(0, MAX_ATTEMPTS - attempts) * 3}s remaining)
          </p>
        </div>
      )}

      {pollStatus === "successful" && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-lg">Payment approved!</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Confirming your order…</p>
        </div>
      )}

      {pollStatus === "failed" && (
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Payment failed</p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{pollError}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200"
          >
            Try again
          </button>
        </div>
      )}

      {/* Instructions */}
      {pollStatus === "pending" && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">How to approve:</p>
          <p className="text-xs text-blue-600 dark:text-blue-500">
            <strong>MTN MoMo:</strong> You'll get a notification → tap it → enter your MoMo PIN
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-500">
            <strong>Airtel Money:</strong> You'll get an SMS/notification → dial *182# or open Airtel app → approve
          </p>
        </div>
      )}

      {pollStatus === "pending" && (
        <button
          onClick={onCancel}
          className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
        >
          Cancel payment
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Verifying overlay
// ─────────────────────────────────────────────────────────────
function VerifyingPayment() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
        <Loader2 size={28} className="text-emerald-500 animate-spin" />
      </div>
      <div className="text-center">
        <p className="font-bold text-slate-900 dark:text-slate-100">Confirming payment…</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Please wait</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main CheckoutModal
// ─────────────────────────────────────────────────────────────
export default function CheckoutModal({ cart, onClose, onRemoveItem, onPlaceOrder }: CheckoutModalProps) {
  const t  = useTranslations("orders");
  const tc = useTranslations("common");
  const tp = useTranslations("privacy");

  const [step, setStep]             = useState<Step>("review");
  const [deliveryOption, setDelivery] = useState<DeliveryOption>(() => dominantFulfillment(cart));
  const [deliveryAddress, setAddress] = useState("");
  const [addressError, setAddrError]  = useState("");
  const [placeError, setPlaceError]   = useState<string | null>(null);
  const [totals, setTotals]           = useState<CheckoutTotals>(() => calcTotals(cart, dominantFulfillment(cart)));
  const [loading, setLoading]         = useState(false);
  const [verifying, setVerifying]     = useState(false);
  const [orderResults, setResults]    = useState<OrderResult[]>([]);
  const [paymentData, setPaymentData] = useState<{
    ref:         string;   // Paypack transaction ref
    orderId:     string;
    orderNumber: string;
    amount:      number;
    currency:    string;
    phone:       string;
  } | null>(null);

  useEffect(() => { setTotals(calcTotals(cart, deliveryOption)); }, [cart, deliveryOption]);

  const availableOptions: DeliveryOption[] = Array.from(new Set(cart.flatMap((i) => i.listing.deliveryOptions)));

  const validateAndNext = () => {
    if (deliveryOption === "DELIVERED" && !deliveryAddress.trim()) {
      setAddrError(t("deliveryAddressRequired")); return;
    }
    setAddrError(""); setStep("confirm");
  };

  // ── Initiate payment — place order, get txRef ─────────────
  const handleInitiatePayment = async () => {
    setLoading(true); setPlaceError(null);
    const user = getStoredUser();
    if (!user?.userId) { setPlaceError("Not authenticated. Please sign in."); setLoading(false); return; }

    // Get phone from session
    const buyerPhone = user.phone && !user.phone.startsWith("google:") ? user.phone : "";
    if (!buyerPhone) {
      setPlaceError("Phone number not found. Please sign out and sign in again.");
      setLoading(false); return;
    }

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId:     user.userId,
          buyerToken:  user.token,
          buyerPhone,
          deliveryOption,
          deliveryAddress: deliveryAddress || undefined,
          currency: totals.currency,
          cart: cart.map((item) => ({
            listingId:   item.listing.id,
            quantityKg:  item.quantityKg,
            unitPrice:   item.listing.unitPrice,
            fulfillment: item.selectedFulfillment,
          })),
        }),
      });

      const data = await res.json() as {
        ref?: string; orderId?: string; orderNumber?: string; amount?: number;
        currency?: string; phone?: string; orderResults?: OrderResult[]; error?: string;
      };

      if (!res.ok || !data.ref) {
        setPlaceError(data.error ?? "Failed to create order. Please try again.");
        setLoading(false); return;
      }

      if (data.orderResults) setResults(data.orderResults);

      setPaymentData({
        ref:         data.ref,
        orderId:     data.orderId!,
        orderNumber: data.orderNumber!,
        amount:      data.amount!,
        currency:    data.currency ?? totals.currency,
        phone:       data.phone ?? buyerPhone,
      });
      setStep("payment");
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Payment success ───────────────────────────────────────
  const handlePaymentSuccess = () => {
    setVerifying(true);
    setStep("success");
    onPlaceOrder(deliveryOption, deliveryAddress).catch(() => undefined);
    setVerifying(false);
  };

  const fmt = (n: number) =>
    `${totals.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pickupContacts   = orderResults.map((r) => r.pickupContact).filter((c): c is NonNullable<typeof c> => c !== null);
  const hasDelivery      = orderResults.some((r) => r.fulfillment === "DELIVERED");
  const firstOrderNumber = orderResults[0]?.orderNumber ?? paymentData?.orderNumber ?? "";
  const PROGRESS: Step[] = ["review", "fulfillment", "confirm"];
  const TITLES: Record<Step, string> = {
    review: t("reviewTitle"), fulfillment: t("fulfillmentTitle"),
    confirm: t("confirmTitle"), payment: "Secure Payment", success: t("successTitle"),
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && step !== "payment" && onClose()}
      role="dialog" aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 text-lg">{TITLES[step]}</h2>
            {!["success","payment"].includes(step) && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {t("itemCount", { count: cart.length })} · {fmt(totals.total)}
              </p>
            )}
          </div>
          {step !== "payment" && (
            <button onClick={onClose} aria-label={tc("close")}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Progress */}
        {PROGRESS.includes(step) && (
          <div className="flex px-5 py-2 gap-1 shrink-0">
            {PROGRESS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                <div className={`h-full rounded-full transition-all duration-300 ${PROGRESS.indexOf(step) >= i ? "bg-emerald-500" : "bg-transparent"}`} />
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Review */}
          {step === "review" && (
            cart.length === 0
              ? <div className="text-center py-12 text-slate-400 dark:text-slate-500"><Package size={40} className="mx-auto mb-3 opacity-40" /><p>{t("emptyCart")}</p></div>
              : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li key={item.listing.id} className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
                        {item.listing.produceName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                          {item.listing.produceName}
                          {item.listing.variety && <span className="text-slate-400 dark:text-slate-500 font-normal"> ({item.listing.variety})</span>}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.quantityKg.toLocaleString()} kg · {item.listing.currency} {item.listing.unitPrice}/kg
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{fmt(item.quantityKg * item.listing.unitPrice)}</p>
                          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${item.selectedFulfillment === "SELF_PICKUP" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"}`}>
                            {item.selectedFulfillment === "SELF_PICKUP" ? <><Package size={9} /> Pickup</> : <><Truck size={9} /> Delivery</>}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => onRemoveItem(item.listing.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-0.5 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )
          )}

          {/* Fulfillment */}
          {step === "fulfillment" && (
            <div className="space-y-4">
              <FulfillmentToggle value={deliveryOption} onChange={setDelivery} availableOptions={availableOptions} currency={totals.currency} deliveryFee={BASE_DELIVERY_FEE} compact={false} />
              {deliveryOption === "DELIVERED" && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <MapPin size={14} className="text-emerald-600 dark:text-emerald-400" />
                    {t("deliveryAddressLabel")} <span className="text-red-500">*</span>
                  </label>
                  <textarea rows={3} placeholder={t("deliveryAddressPlaceholder")} value={deliveryAddress}
                    onChange={(e) => { setAddress(e.target.value); if (e.target.value.trim()) setAddrError(""); }}
                    className={`w-full border-2 rounded-xl px-3.5 py-3 text-sm resize-none focus:outline-none focus:ring-2 transition-all duration-200 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${addressError ? "border-red-400 bg-red-50 dark:bg-red-950/30" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-400 focus:border-emerald-500 focus:ring-emerald-100 dark:focus:ring-emerald-900/30"}`}
                  />
                  {addressError && <p className="text-xs text-red-500 dark:text-red-400">{addressError}</p>}
                </div>
              )}
              <PrivacyBadge message={deliveryOption === "SELF_PICKUP" ? tp("pickupMessage") : tp("deliveryMessage")} />
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t("subtotal")}</span><span>{fmt(totals.subtotal)}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t("deliveryFee")}</span>
                  <span className={totals.deliveryFee === 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-purple-600 dark:text-purple-400"}>
                    {totals.deliveryFee === 0 ? t("freePickup") : fmt(totals.deliveryFee)}
                  </span>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100"><span>{t("total")}</span><span className="text-emerald-700 dark:text-emerald-400">{fmt(totals.total)}</span></div>
              </div>
            </div>
          )}

          {/* Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              {placeError && (
                <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Could not place order</p>
                    <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">{placeError}</p>
                  </div>
                </div>
              )}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t("items")}</span><span>{cart.length}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t("fulfillmentLabel")}</span>
                  <span className="flex items-center gap-1">{deliveryOption === "SELF_PICKUP" ? <><Package size={12} />{t("selfPickupLabel")}</> : <><Truck size={12} />{t("deliveryLabel")}</>}</span>
                </div>
                {deliveryOption === "DELIVERED" && deliveryAddress && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t("addressLabel")}</span><span className="text-right max-w-[55%] text-xs">{deliveryAddress}</span></div>
                )}
                <div className="flex justify-between text-slate-600 dark:text-slate-400"><span>{t("subtotal")}</span><span>{fmt(totals.subtotal)}</span></div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>{t("deliveryFee")}</span><span>{totals.deliveryFee === 0 ? tc("free") : fmt(totals.deliveryFee)}</span>
                </div>
                <hr className="border-slate-200 dark:border-slate-700" />
                <div className="flex justify-between font-bold text-slate-900 dark:text-slate-100 text-base">
                  <span>{t("total")}</span><span className="text-emerald-700 dark:text-emerald-400">{fmt(totals.total)}</span>
                </div>
              </div>
              {deliveryOption === "SELF_PICKUP" && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800/40 rounded-xl px-3 py-2.5">
                  <Lock size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">{t("preConfirmPickupNote")}</p>
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
                Payment via Paypack · MTN MoMo &amp; Airtel Money Rwanda
              </p>
            </div>
          )}

          {/* Payment step — Paypack MoMo push + polling */}
          {step === "payment" && paymentData && (
            <PaymentStep
              paypackRef={paymentData.ref}
              amount={paymentData.amount}
              currency={paymentData.currency}
              phone={paymentData.phone}
              orderNumber={paymentData.orderNumber}
              onSuccess={handlePaymentSuccess}
              onCancel={() => { setPaymentData(null); setStep("confirm"); }}
            />
          )}
          {step === "payment" && !paymentData && <VerifyingPayment />}

          {/* Success */}
          {step === "success" && (
            <div className="space-y-5">
              {verifying ? <VerifyingPayment /> : (
                <>
                  <div className="text-center pt-2">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl">{t("successTitle")}!</h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Payment confirmed · Order #{firstOrderNumber}</p>
                  </div>
                  {pickupContacts.map((c, i) => <PickupContactCard key={i} contact={c} />)}
                  {hasDelivery && <DeliveryTrackingCard orderNumber={firstOrderNumber} />}
                  <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all duration-200">
                    {tc("continueShoppingBtn")}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer CTAs */}
        {PROGRESS.includes(step) && cart.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
            {step === "review" && (
              <button onClick={() => setStep("fulfillment")} className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all duration-200">
                {t("chooseDelivery")} <ChevronRight size={16} />
              </button>
            )}
            {step === "fulfillment" && (
              <div className="flex gap-3">
                <button onClick={() => setStep("review")} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200">{tc("back")}</button>
                <button onClick={validateAndNext} className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-all duration-200">{t("reviewOrder")} <ChevronRight size={16} /></button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-3">
                <button onClick={() => setStep("fulfillment")} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200">{tc("back")}</button>
                <button onClick={handleInitiatePayment} disabled={loading} className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition-all duration-200">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Sending request…</> : <><Smartphone size={15} /> Pay {fmt(totals.total)} via MoMo</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
