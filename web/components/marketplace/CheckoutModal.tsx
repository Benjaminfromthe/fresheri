"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  X, Truck, Package, Trash2, ChevronRight, MapPin,
  CheckCircle2, Loader2, Phone, Navigation, Clock,
  ShieldCheck, Lock, CreditCard, Smartphone, AlertCircle,
} from "lucide-react";
import {
  CartItem, DeliveryOption, CheckoutTotals, OrderResult, PickupContact,
} from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import { getStoredUser }     from "@/lib/api-client";
import FulfillmentToggle     from "./FulfillmentToggle";
import PrivacyBadge          from "./PrivacyBadge";

// ── Flutterwave global type ───────────────────────────────────
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FlutterwaveCheckout?: (config: Record<string, any>) => void;
  }
}

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
// PaymentStep — loads FLW v3.js and opens popup on button click
// ─────────────────────────────────────────────────────────────
interface PaymentStepProps {
  txRef:       string;
  amount:      number;
  currency:    string;
  orderId:     string;
  orderNumber: string;
  buyerId:     string;
  publicKey:   string;
  onSuccess:   (txId: number) => void;
  onCancel:    () => void;
}

function PaymentStep({ txRef, amount, currency, orderId, orderNumber, buyerId, publicKey, onSuccess, onCancel }: PaymentStepProps) {
  const [scriptState, setScriptState] = useState<"loading" | "ready" | "error">("loading");
  const [popupOpen,   setPopupOpen]   = useState(false);
  const [flwError,    setFlwError]    = useState<string | null>(null);

  // Load FLW checkout script once
  useEffect(() => {
    if (window.FlutterwaveCheckout) { setScriptState("ready"); return; }

    const existing = document.querySelector('script[src="https://checkout.flutterwave.com/v3.js"]') as HTMLScriptElement | null;
    if (existing) {
      const wait = setInterval(() => {
        if (window.FlutterwaveCheckout) { clearInterval(wait); setScriptState("ready"); }
      }, 150);
      return () => clearInterval(wait);
    }

    const s = document.createElement("script");
    s.src   = "https://checkout.flutterwave.com/v3.js";
    s.async = true;
    s.onload  = () => setScriptState("ready");
    s.onerror = () => setScriptState("error");
    document.head.appendChild(s);
  }, []);

  // Called DIRECTLY from onClick — must stay synchronous so browser trusts the gesture
  const handlePay = () => {
    setFlwError(null);

    if (!window.FlutterwaveCheckout || scriptState !== "ready") {
      setFlwError("Payment gateway still loading. Please wait a moment and try again.");
      return;
    }
    if (!publicKey || publicKey.length < 10) {
      setFlwError("Payment not configured. Please refresh the page.");
      return;
    }

    const user  = getStoredUser();
    const email = user?.userId
      ? `user-${user.userId.replace(/-/g, "").slice(0, 12)}@fresheri.rw`
      : "buyer@fresheri.rw";
    const name  = user ? `${user.firstName} ${user.lastName}` : "Fresheri Buyer";

    setPopupOpen(true);

    window.FlutterwaveCheckout({
      public_key:      publicKey,
      tx_ref:          txRef,
      amount,
      currency,
      payment_options: "mobilemoney,ussd,card",
      redirect_url:    `${window.location.origin}/orders`,
      customer:        { email, phone_number: "+250780000001", name },
      meta:            { orderId, orderNumber, buyerId },
      customizations:  {
        title:       "Fresheri — Produce Marketplace",
        description: `Order #${orderNumber}`,
        logo:        "https://fresheri.vercel.app/favicon.ico",
      },
      callback: (response: { status: string; transaction_id?: number }) => {
        setPopupOpen(false);
        if (response.status === "successful" && response.transaction_id) {
          onSuccess(response.transaction_id);
        } else if (response.status !== "cancelled") {
          setFlwError(`Payment ${response.status}. Please try again.`);
        }
      },
      onclose: () => setPopupOpen(false),
    });
  };

  const fmt = `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  return (
    <div className="space-y-5 py-2">
      {/* Amount */}
      <div className="text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest mb-1">Total to Pay</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{fmt}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Order #{orderNumber}</p>
      </div>

      {/* Payment method chips */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
          <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile Money</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
          <CreditCard size={14} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Card</span>
        </div>
      </div>

      {/* Test mode notice */}
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-xl px-4 py-3">
        <AlertCircle size={13} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Test Mode Active</p>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5 leading-relaxed">
            Card: <strong>4187427415564246</strong> · exp 09/32 · CVV 828<br />
            MoMo: any MTN Rwanda number · pin <strong>1234</strong>
          </p>
        </div>
      </div>

      {/* Script loading indicator */}
      {scriptState === "loading" && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Loader2 size={12} className="animate-spin" /> Loading secure payment gateway…
        </p>
      )}
      {scriptState === "error" && (
        <p className="text-xs text-red-500 text-center">Could not load payment gateway. Check your connection.</p>
      )}

      {/* Error banner */}
      {flwError && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3">
          <AlertCircle size={13} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-400">{flwError}</p>
        </div>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={scriptState !== "ready" || popupOpen}
        className="
          w-full flex items-center justify-center gap-2.5
          py-4 rounded-2xl font-bold text-base text-white
          bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500
        "
      >
        {scriptState === "loading" ? (
          <><Loader2 size={18} className="animate-spin" /> Loading…</>
        ) : popupOpen ? (
          <><Loader2 size={18} className="animate-spin" /> Payment window open…</>
        ) : (
          <><CreditCard size={18} /> Pay {fmt} Now</>
        )}
      </button>

      <button
        onClick={onCancel}
        className="w-full text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
      >
        ← Back to order review
      </button>
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
    txRef: string; orderId: string; orderNumber: string;
    amount: number; currency: string; publicKey: string;
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

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId: user.userId, buyerToken: user.token,
          deliveryOption, deliveryAddress: deliveryAddress || undefined,
          currency: totals.currency,
          cart: cart.map((item) => ({
            listingId: item.listing.id, quantityKg: item.quantityKg,
            unitPrice: item.listing.unitPrice, fulfillment: item.selectedFulfillment,
          })),
        }),
      });

      const data = await res.json() as {
        txRef?: string; orderId?: string; orderNumber?: string; amount?: number;
        currency?: string; publicKey?: string; orderResults?: OrderResult[]; error?: string;
      };

      if (!res.ok || !data.txRef) {
        setPlaceError(data.error ?? "Failed to create order. Please try again.");
        setLoading(false); return;
      }

      if (data.orderResults) setResults(data.orderResults);

      setPaymentData({
        txRef:       data.txRef,
        orderId:     data.orderId!,
        orderNumber: data.orderNumber!,
        amount:      data.amount!,
        currency:    data.currency ?? totals.currency,
        publicKey:   data.publicKey ?? "",
      });
      setStep("payment");
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Payment success ───────────────────────────────────────
  const handlePaymentSuccess = (_txId: number) => {
    setVerifying(true);
    setStep("success");
    // Clear the cart after payment — call silently, we already have results
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
                Payment via Flutterwave · Mobile Money, USSD &amp; Card
              </p>
            </div>
          )}

          {/* Payment step */}
          {step === "payment" && paymentData && (
            <PaymentStep
              txRef={paymentData.txRef}
              amount={paymentData.amount}
              currency={paymentData.currency}
              orderId={paymentData.orderId}
              orderNumber={paymentData.orderNumber}
              buyerId={getStoredUser()?.userId ?? ""}
              publicKey={paymentData.publicKey}
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
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Creating order…</> : <><CreditCard size={15} /> Pay {fmt(totals.total)}</>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
