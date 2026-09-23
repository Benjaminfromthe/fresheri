"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  X, Truck, Package, Trash2, ChevronRight, MapPin,
  CheckCircle2, Loader2, Phone, Navigation, Clock, ShieldCheck, Lock,
} from "lucide-react";
import {
  CartItem, DeliveryOption, CheckoutTotals, OrderResult, PickupContact,
} from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import FulfillmentToggle from "./FulfillmentToggle";
import PrivacyBadge      from "./PrivacyBadge";

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemoveItem: (listingId: string) => void;
  onPlaceOrder: (deliveryOption: DeliveryOption, deliveryAddress: string) => Promise<OrderResult[]>;
}

function calcTotals(cart: CartItem[], deliveryOption: DeliveryOption): CheckoutTotals {
  const currency   = cart[0]?.listing.currency ?? "KES";
  const subtotal   = cart.reduce((sum, item) => sum + item.quantityKg * item.listing.unitPrice, 0);
  const deliveryFee = deliveryOption === "DELIVERED" ? BASE_DELIVERY_FEE : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee, currency };
}

function dominantFulfillment(cart: CartItem[]): DeliveryOption {
  return cart.some((i) => i.selectedFulfillment === "DELIVERED") ? "DELIVERED" : "SELF_PICKUP";
}

type Step = "review" | "fulfillment" | "confirm" | "success";

// ─────────────────────────────────────────────────────────────
// Post-order sub-components
// ─────────────────────────────────────────────────────────────

function PickupContactCard({ contact }: { contact: PickupContact }) {
  const t = useTranslations("orders");
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-green-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{t("pickupUnlocked")}</p>
          <p className="text-xs text-gray-400">{t("pickupUnlockedSub")}</p>
        </div>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">{t("cooperativeFarm")}</p>
            <p className="text-sm font-bold text-gray-900">{contact.farmerName}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Navigation size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">{t("pickupLocation")}</p>
            <p className="text-sm font-semibold text-gray-900">{contact.pickupLocation}</p>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Phone size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">{t("directContact")}</p>
            <a href={`tel:${contact.farmerContact}`} className="text-sm font-bold text-green-700 hover:underline">
              {contact.farmerContact}
            </a>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-white/60 rounded-xl p-2.5">
          <Lock size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">{contact.note}</p>
        </div>
      </div>
    </div>
  );
}

function DeliveryTrackingCard({ orderNumber }: { orderNumber: string }) {
  const t = useTranslations("orders");
  const stages = [
    { icon: CheckCircle2, label: t("trackingPlaced"),   sub: t("trackingPlacedSub"),   done: true,  color: "text-green-500" },
    { icon: Package,      label: t("trackingAssigned"), sub: t("trackingAssignedSub"), done: true,  color: "text-purple-500" },
    { icon: Truck,        label: t("trackingInTransit"),sub: t("trackingInTransitSub"),done: false, color: "text-gray-300" },
    { icon: CheckCircle2, label: t("trackingDelivered"),sub: t("trackingDeliveredSub"),done: false, color: "text-gray-300" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Truck size={18} className="text-purple-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{t("orderDispatched")}</p>
          <p className="text-xs text-gray-400">{t("orderNumber", { number: orderNumber })}</p>
        </div>
      </div>
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
        <ol className="space-y-3">
          {stages.map(({ icon: Icon, label, sub, done, color }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <Icon size={16} className={color} />
                {i < stages.length - 1 && <div className={`w-px h-4 mt-1 ${done ? "bg-purple-300" : "bg-gray-200"}`} />}
              </div>
              <div className="pb-1">
                <p className={`text-xs font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>{label}</p>
                <p className={`text-xs ${done ? "text-gray-500" : "text-gray-300"}`}>{sub}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-xl p-2.5">
          <ShieldCheck size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">{t("trackingPrivacyNote")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />{t("smsStagedNote")}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────

export default function CheckoutModal({ cart, onClose, onRemoveItem, onPlaceOrder }: CheckoutModalProps) {
  const t  = useTranslations("orders");
  const tc = useTranslations("common");
  const tp = useTranslations("privacy");

  const [step, setStep]               = useState<Step>("review");
  const [deliveryOption, setDelivery] = useState<DeliveryOption>(() => dominantFulfillment(cart));
  const [deliveryAddress, setAddress] = useState("");
  const [addressError, setAddrError]  = useState("");
  const [totals, setTotals]           = useState<CheckoutTotals>(() => calcTotals(cart, dominantFulfillment(cart)));
  const [loading, setLoading]         = useState(false);
  const [orderResults, setResults]    = useState<OrderResult[]>([]);

  useEffect(() => { setTotals(calcTotals(cart, deliveryOption)); }, [cart, deliveryOption]);

  const availableOptions: DeliveryOption[] = Array.from(new Set(cart.flatMap((i) => i.listing.deliveryOptions)));

  const validateAndNext = () => {
    if (deliveryOption === "DELIVERED" && !deliveryAddress.trim()) { setAddrError(t("deliveryAddressRequired")); return; }
    setAddrError("");
    setStep("confirm");
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try { const r = await onPlaceOrder(deliveryOption, deliveryAddress); setResults(r); setStep("success"); }
    catch { /* parent shows error */ }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    `${totals.currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const pickupContacts      = orderResults.map((r) => r.pickupContact).filter((c): c is NonNullable<typeof c> => c !== null);
  const hasDelivery         = orderResults.some((r) => r.fulfillment === "DELIVERED");
  const firstOrderNumber    = orderResults[0]?.orderNumber ?? "";
  const STEPS: Step[]       = ["review", "fulfillment", "confirm"];

  const STEP_TITLE: Record<Step, string> = {
    review:      t("reviewTitle"),
    fulfillment: t("fulfillmentTitle"),
    confirm:     t("confirmTitle"),
    success:     t("successTitle"),
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog" aria-modal="true" aria-label={t("reviewTitle")}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{STEP_TITLE[step]}</h2>
            {step !== "success" && (
              <p className="text-xs text-gray-400 mt-0.5">
                {t("itemCount", { count: cart.length })} · {fmt(totals.total)}
              </p>
            )}
          </div>
          <button onClick={onClose} aria-label={tc("close")} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        {step !== "success" && (
          <div className="flex px-5 py-2 gap-1 shrink-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200">
                <div className={`h-full rounded-full transition-all duration-300 ${STEPS.indexOf(step) >= i ? "bg-green-500" : "bg-transparent"}`} />
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Review */}
          {step === "review" && (
            cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-40" />
                <p>{t("emptyCart")}</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li key={item.listing.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                      {item.listing.produceName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {item.listing.produceName}
                        {item.listing.variety && <span className="text-gray-400 font-normal"> ({item.listing.variety})</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.quantityKg.toLocaleString()} kg · {item.listing.currency} {item.listing.unitPrice}/kg
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-semibold text-green-700">{fmt(item.quantityKg * item.listing.unitPrice)}</p>
                        <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          item.selectedFulfillment === "SELF_PICKUP" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        }`}>
                          {item.selectedFulfillment === "SELF_PICKUP" ? <><Package size={9} /> Pickup</> : <><Truck size={9} /> Delivery</>}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => onRemoveItem(item.listing.id)} aria-label={t("remove", { name: item.listing.produceName })}
                      className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 shrink-0">
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
              <FulfillmentToggle value={deliveryOption} onChange={setDelivery} availableOptions={availableOptions}
                currency={totals.currency} deliveryFee={BASE_DELIVERY_FEE} compact={false} />

              {deliveryOption === "DELIVERED" && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MapPin size={14} className="text-green-600" />
                    {t("deliveryAddressLabel")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("deliveryAddressPlaceholder")}
                    value={deliveryAddress}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (e.target.value.trim()) setAddrError("");
                    }}
                    className={`w-full border-2 rounded-xl px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 transition-all duration-150 ${
                      addressError
                        ? "border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-green-100"
                    }`}
                  />
                  {addressError && <p className="text-xs text-red-500">{addressError}</p>}
                </div>
              )}

              <PrivacyBadge message={deliveryOption === "SELF_PICKUP" ? tp("pickupMessage") : tp("deliveryMessage")} />

              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600"><span>{t("subtotal")}</span><span>{fmt(totals.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("deliveryFee")}</span>
                  <span className={totals.deliveryFee === 0 ? "text-green-600 font-medium" : "text-purple-600"}>
                    {totals.deliveryFee === 0 ? t("freePickup") : fmt(totals.deliveryFee)}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900">
                  <span>{t("total")}</span><span className="text-green-700">{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>{t("items")}</span><span>{cart.length}</span></div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("fulfillmentLabel")}</span>
                  <span className="flex items-center gap-1">
                    {deliveryOption === "SELF_PICKUP" ? <><Package size={12} />{t("selfPickupLabel")}</> : <><Truck size={12} />{t("deliveryLabel")}</>}
                  </span>
                </div>
                {deliveryOption === "DELIVERED" && deliveryAddress && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t("addressLabel")}</span>
                    <span className="text-right max-w-[55%] text-xs">{deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600"><span>{t("subtotal")}</span><span>{fmt(totals.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600">
                  <span>{t("deliveryFee")}</span><span>{totals.deliveryFee === 0 ? tc("free") : fmt(totals.deliveryFee)}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>{t("total")}</span><span className="text-green-700">{fmt(totals.total)}</span>
                </div>
              </div>
              {deliveryOption === "SELF_PICKUP" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <Lock size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">{t("preConfirmPickupNote")}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 text-center">{t("paymentNote")}</p>
            </div>
          )}

          {/* Success */}
          {step === "success" && (
            <div className="space-y-5">
              <div className="text-center pt-2">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl">{t("successTitle")}!</h3>
                <p className="text-gray-400 text-xs mt-1">{t("smsConfirmationNote")}</p>
              </div>
              {pickupContacts.map((c, i) => <PickupContactCard key={i} contact={c} />)}
              {hasDelivery && <DeliveryTrackingCard orderNumber={firstOrderNumber} />}
              <button onClick={onClose} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition">
                {tc("continueShoppingBtn")}
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        {step !== "success" && cart.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            {step === "review" && (
              <button onClick={() => setStep("fulfillment")} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all">
                {t("chooseDelivery")} <ChevronRight size={16} />
              </button>
            )}
            {step === "fulfillment" && (
              <div className="flex gap-3">
                <button onClick={() => setStep("review")} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                  {tc("back")}
                </button>
                <button onClick={validateAndNext} className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all">
                  {t("reviewOrder")} <ChevronRight size={16} />
                </button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-3">
                <button onClick={() => setStep("fulfillment")} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                  {tc("back")}
                </button>
                <button onClick={handlePlaceOrder} disabled={loading} className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-all">
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> {t("placing")}</>
                    : t("placeOrder", { total: fmt(totals.total) })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
