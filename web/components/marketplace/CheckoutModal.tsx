"use client";

import { useState, useEffect } from "react";
import {
  X,
  Truck,
  Package,
  Trash2,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Loader2,
  Phone,
  Navigation,
  Clock,
  ShieldCheck,
  Lock,
} from "lucide-react";
import {
  CartItem,
  DeliveryOption,
  CheckoutTotals,
  OrderResult,
  PickupContact,
} from "@/types/marketplace";
import { BASE_DELIVERY_FEE } from "@/lib/constants";
import FulfillmentToggle from "./FulfillmentToggle";
import PrivacyBadge from "./PrivacyBadge";

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemoveItem: (listingId: string) => void;
  onPlaceOrder: (
    deliveryOption: DeliveryOption,
    deliveryAddress: string
  ) => Promise<OrderResult[]>;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function calcTotals(
  cart: CartItem[],
  deliveryOption: DeliveryOption
): CheckoutTotals {
  const currency = cart[0]?.listing.currency ?? "KES";
  const subtotal = cart.reduce(
    (sum, item) => sum + item.quantityKg * item.listing.unitPrice,
    0
  );
  const deliveryFee = deliveryOption === "DELIVERED" ? BASE_DELIVERY_FEE : 0;
  return { subtotal, deliveryFee, total: subtotal + deliveryFee, currency };
}

/** Derive the best single fulfillment choice from cart items */
function dominantFulfillment(cart: CartItem[]): DeliveryOption {
  const hasDelivery = cart.some((i) => i.selectedFulfillment === "DELIVERED");
  return hasDelivery ? "DELIVERED" : "SELF_PICKUP";
}

type Step = "review" | "fulfillment" | "confirm" | "success";

const STEP_LABELS: Record<Step, string> = {
  review:      "Order Review",
  fulfillment: "Fulfillment Method",
  confirm:     "Confirm Order",
  success:     "Order Confirmed",
};

// ─────────────────────────────────────────────────────────────
// Post-order views
// ─────────────────────────────────────────────────────────────

function PickupContactCard({ contact }: { contact: PickupContact }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={18} className="text-green-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Pickup Details Unlocked</p>
          <p className="text-xs text-gray-400">
            Exclusive to your order — please keep this confidential
          </p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
        {/* Seller name */}
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Cooperative / Farm</p>
            <p className="text-sm font-bold text-gray-900">{contact.farmerName}</p>
          </div>
        </div>

        {/* Pickup location */}
        <div className="flex items-start gap-2.5">
          <Navigation size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Pickup Location</p>
            <p className="text-sm font-semibold text-gray-900">
              {contact.pickupLocation}
            </p>
          </div>
        </div>

        {/* Contact phone */}
        <div className="flex items-start gap-2.5">
          <Phone size={16} className="text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500 font-medium">Direct Contact</p>
            <a
              href={`tel:${contact.farmerContact}`}
              className="text-sm font-bold text-green-700 hover:underline"
            >
              {contact.farmerContact}
            </a>
          </div>
        </div>

        {/* Privacy note */}
        <div className="flex items-start gap-2 bg-white/60 rounded-xl p-2.5">
          <Lock size={12} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">{contact.note}</p>
        </div>
      </div>
    </div>
  );
}

function DeliveryTrackingCard({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <Truck size={18} className="text-purple-600" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Order Dispatched</p>
          <p className="text-xs text-gray-400">Order #{orderNumber}</p>
        </div>
      </div>

      {/* Tracking timeline */}
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
        <ol className="space-y-3">
          {[
            {
              icon: CheckCircle2,
              label: "Order placed",
              sub: "Your order is confirmed",
              done: true,
              color: "text-green-500",
            },
            {
              icon: Package,
              label: "Logistics agent assigned",
              sub: "Agent dispatched to farmer pickup point",
              done: true,
              color: "text-purple-500",
            },
            {
              icon: Truck,
              label: "In transit",
              sub: "Produce being transported to you",
              done: false,
              color: "text-gray-300",
            },
            {
              icon: CheckCircle2,
              label: "Delivered",
              sub: "Produce delivered to your address",
              done: false,
              color: "text-gray-300",
            },
          ].map(({ icon: Icon, label, sub, done, color }, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <Icon size={16} className={color} />
                {i < 3 && (
                  <div className={`w-px h-4 mt-1 ${done ? "bg-purple-300" : "bg-gray-200"}`} />
                )}
              </div>
              <div className="pb-1">
                <p className={`text-xs font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>
                  {label}
                </p>
                <p className={`text-xs ${done ? "text-gray-500" : "text-gray-300"}`}>{sub}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Privacy note for delivery */}
        <div className="mt-3 flex items-start gap-2 bg-white/60 rounded-xl p-2.5">
          <ShieldCheck size={12} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700">
            Farmer contact details are kept private and shared only with your
            assigned logistics agent for pickup coordination.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Clock size={11} />
        You will receive an SMS update at each stage.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────

export default function CheckoutModal({
  cart,
  onClose,
  onRemoveItem,
  onPlaceOrder,
}: CheckoutModalProps) {
  const [step, setStep]                   = useState<Step>("review");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>(
    () => dominantFulfillment(cart)
  );
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressError, setAddressError]       = useState("");
  const [totals, setTotals]                   = useState<CheckoutTotals>(() =>
    calcTotals(cart, dominantFulfillment(cart))
  );
  const [loading, setLoading]     = useState(false);
  const [orderResults, setOrderResults] = useState<OrderResult[]>([]);

  // Recalculate totals when delivery option or cart changes
  useEffect(() => {
    setTotals(calcTotals(cart, deliveryOption));
  }, [cart, deliveryOption]);

  const validateAndNext = () => {
    if (deliveryOption === "DELIVERED" && !deliveryAddress.trim()) {
      setAddressError("Delivery address is required.");
      return;
    }
    setAddressError("");
    setStep("confirm");
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const results = await onPlaceOrder(deliveryOption, deliveryAddress);
      setOrderResults(results);
      setStep("success");
    } catch {
      // Parent handles toast / error UI
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    `${totals.currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Collect all available delivery options across cart items
  const availableOptions: DeliveryOption[] = Array.from(
    new Set(cart.flatMap((i) => i.listing.deliveryOptions))
  );

  // Post-order: pick up contacts from results
  const pickupContacts = orderResults
    .map((r) => r.pickupContact)
    .filter((c): c is NonNullable<typeof c> => c !== null);
  const hasDeliveryOrders = orderResults.some(
    (r) => r.fulfillment === "DELIVERED"
  );
  const firstOrderNumber = orderResults[0]?.orderNumber ?? "";

  const STEPS: Step[] = ["review", "fulfillment", "confirm"];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {STEP_LABELS[step]}
            </h2>
            {step !== "success" && (
              <p className="text-xs text-gray-400 mt-0.5">
                {cart.length} item{cart.length !== 1 ? "s" : ""} · {fmt(totals.total)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step progress bar ── */}
        {step !== "success" && (
          <div className="flex px-5 py-2 gap-1 shrink-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    STEPS.indexOf(step) >= i ? "bg-green-500" : "bg-transparent"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ────────────────── STEP: Review ────────────────── */}
          {step === "review" && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Your order is empty.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.listing.id}
                      className="flex items-start gap-3 bg-gray-50 rounded-xl p-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                        {item.listing.produceName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {item.listing.produceName}
                          {item.listing.variety && (
                            <span className="text-gray-400 font-normal">
                              {" "}({item.listing.variety})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantityKg.toLocaleString()} kg ·{" "}
                          {item.listing.currency} {item.listing.unitPrice}/kg
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs font-semibold text-green-700">
                            {fmt(item.quantityKg * item.listing.unitPrice)}
                          </p>
                          {/* Per-item fulfillment chip */}
                          <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${
                            item.selectedFulfillment === "SELF_PICKUP"
                              ? "bg-blue-50 text-blue-600"
                              : "bg-purple-50 text-purple-600"
                          }`}>
                            {item.selectedFulfillment === "SELF_PICKUP"
                              ? <><Package size={9} /> Pickup</>
                              : <><Truck size={9} /> Delivery</>}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.listing.id)}
                        aria-label={`Remove ${item.listing.produceName}`}
                        className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ──────────── STEP: Fulfillment method ────────────── */}
          {step === "fulfillment" && (
            <div className="space-y-4">
              {/* Full fulfillment toggle with descriptions */}
              <FulfillmentToggle
                value={deliveryOption}
                onChange={setDeliveryOption}
                availableOptions={availableOptions}
                currency={totals.currency}
                deliveryFee={BASE_DELIVERY_FEE}
                compact={false}
              />

              {/* Address — delivery only */}
              {deliveryOption === "DELIVERED" && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MapPin size={14} className="text-green-600" />
                    Delivery Address
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Kigali — KG 7 Ave, Hotel des Mille Collines"
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      if (e.target.value.trim()) setAddressError("");
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400 ${
                      addressError ? "border-red-400" : "border-gray-200"
                    }`}
                  />
                  {addressError && (
                    <p className="text-xs text-red-500">{addressError}</p>
                  )}
                </div>
              )}

              {/* Privacy notice inside fulfillment step */}
              <PrivacyBadge
                message={
                  deliveryOption === "SELF_PICKUP"
                    ? "Exact pickup location and farmer contact will be unlocked immediately after your order is confirmed."
                    : "Farmer identity and pickup address are kept private. Your assigned logistics agent handles all coordination."
                }
              />

              {/* Dynamic totals */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Produce subtotal</span>
                  <span>{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span className={totals.deliveryFee === 0 ? "text-green-600 font-medium" : "text-purple-600"}>
                    {totals.deliveryFee === 0 ? "Free — Self pickup" : fmt(totals.deliveryFee)}
                  </span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-green-700">{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP: Confirm ─────────────────── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span><span>{cart.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Fulfillment</span>
                  <span className="flex items-center gap-1">
                    {deliveryOption === "SELF_PICKUP"
                      ? <><Package size={12} /> Self-Pickup</>
                      : <><Truck size={12} /> Delivery</>}
                  </span>
                </div>
                {deliveryOption === "DELIVERED" && deliveryAddress && (
                  <div className="flex justify-between text-gray-600">
                    <span>To</span>
                    <span className="text-right max-w-[55%] text-xs">{deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{totals.deliveryFee === 0 ? "Free" : fmt(totals.deliveryFee)}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-green-700">{fmt(totals.total)}</span>
                </div>
              </div>

              {/* Pre-confirm privacy reminder */}
              {deliveryOption === "SELF_PICKUP" && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <Lock size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Confirming this order will unlock the exact pickup location
                    and farmer contact number exclusively for you.
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center">
                Payment collected on delivery or via mobile money after confirmation.
              </p>
            </div>
          )}

          {/* ──────────────── STEP: Success ─────────────────── */}
          {step === "success" && (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center pt-2">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="font-bold text-gray-900 text-xl">Order Confirmed!</h3>
                <p className="text-gray-400 text-xs mt-1">
                  SMS confirmation sent to your phone.
                </p>
              </div>

              {/* SELF_PICKUP: reveal contact */}
              {pickupContacts.length > 0 && (
                <div className="space-y-3">
                  {pickupContacts.map((contact, i) => (
                    <PickupContactCard key={i} contact={contact} />
                  ))}
                </div>
              )}

              {/* DELIVERED: tracking status */}
              {hasDeliveryOrders && (
                <DeliveryTrackingCard orderNumber={firstOrderNumber} />
              )}

              <button
                onClick={onClose}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        {step !== "success" && cart.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            {step === "review" && (
              <button
                onClick={() => setStep("fulfillment")}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Choose Fulfillment
                <ChevronRight size={16} />
              </button>
            )}
            {step === "fulfillment" && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("review")}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={validateAndNext}
                  className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Review Order <ChevronRight size={16} />
                </button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("fulfillment")}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Placing…</>
                  ) : (
                    <>Place Order · {fmt(totals.total)}</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
