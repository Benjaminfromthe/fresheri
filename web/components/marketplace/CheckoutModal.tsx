"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Truck,
  Package,
  Trash2,
  ChevronRight,
  MapPin,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  CartItem,
  DeliveryOption,
  CheckoutTotals,
  BASE_DELIVERY_FEE,
} from "@/types/marketplace";

interface CheckoutModalProps {
  cart: CartItem[];
  onClose: () => void;
  onRemoveItem: (listingId: string) => void;
  onPlaceOrder: (
    deliveryOption: DeliveryOption,
    deliveryAddress: string
  ) => Promise<void>;
}

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
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
    currency,
  };
}

type Step = "review" | "delivery" | "confirm" | "success";

export default function CheckoutModal({
  cart,
  onClose,
  onRemoveItem,
  onPlaceOrder,
}: CheckoutModalProps) {
  const [step, setStep] = useState<Step>("review");
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>("SELF_PICKUP");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [totals, setTotals] = useState<CheckoutTotals>(() =>
    calcTotals(cart, "SELF_PICKUP")
  );
  const [loading, setLoading] = useState(false);

  // Recalculate totals whenever delivery option or cart changes
  useEffect(() => {
    setTotals(calcTotals(cart, deliveryOption));
  }, [cart, deliveryOption]);

  const handleDeliveryChange = (opt: DeliveryOption) => {
    setDeliveryOption(opt);
    if (opt === "SELF_PICKUP") setAddressError("");
  };

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
      await onPlaceOrder(deliveryOption, deliveryAddress);
      setStep("success");
    } catch {
      // Parent handles toast/error display
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    `${totals.currency} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Checkout"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {step === "review"  && "Order Review"}
              {step === "delivery" && "Delivery Details"}
              {step === "confirm" && "Confirm Order"}
              {step === "success" && "Order Placed!"}
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

        {/* ── Steps indicator ── */}
        {step !== "success" && (
          <div className="flex px-5 py-2 gap-1">
            {(["review", "delivery", "confirm"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    ["review", "delivery", "confirm"].indexOf(step) >= i
                      ? "bg-green-500"
                      : "bg-gray-200"
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* ── STEP: Review ─────────────────── */}
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
                            <span className="text-gray-400 font-normal"> ({item.listing.variety})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.quantityKg.toLocaleString()} kg ·{" "}
                          {item.listing.currency} {item.listing.unitPrice}/kg
                        </p>
                        <p className="text-xs font-semibold text-green-700 mt-0.5">
                          {fmt(item.quantityKg * item.listing.unitPrice)}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.listing.id)}
                        aria-label={`Remove ${item.listing.produceName}`}
                        className="text-gray-300 hover:text-red-500 transition-colors mt-0.5"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* ── STEP: Delivery ───────────────── */}
          {step === "delivery" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Choose how you'd like to receive your order.
              </p>

              {/* Fulfillment toggle */}
              <div className="grid grid-cols-2 gap-3">
                {(["SELF_PICKUP", "DELIVERED"] as DeliveryOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleDeliveryChange(opt)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      deliveryOption === opt
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt === "SELF_PICKUP" ? (
                      <Package size={24} className={deliveryOption === opt ? "text-green-600" : "text-gray-400"} />
                    ) : (
                      <Truck size={24} className={deliveryOption === opt ? "text-green-600" : "text-gray-400"} />
                    )}
                    <span className={`text-sm font-semibold ${deliveryOption === opt ? "text-green-700" : "text-gray-500"}`}>
                      {opt === "SELF_PICKUP" ? "Self Pickup" : "Delivery"}
                    </span>
                    <span className={`text-xs ${deliveryOption === opt ? "text-green-600" : "text-gray-400"}`}>
                      {opt === "SELF_PICKUP" ? "Free" : `+${totals.currency} ${BASE_DELIVERY_FEE}`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Address field — shown only for DELIVERED */}
              {deliveryOption === "DELIVERED" && (
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <MapPin size={14} className="text-green-600" />
                    Delivery Address
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Westlands, Nairobi — Gate 4, Blue Building"
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

              {/* Dynamic totals preview */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span className={totals.deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                    {totals.deliveryFee === 0 ? "Free" : fmt(totals.deliveryFee)}
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

          {/* ── STEP: Confirm ────────────────── */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span>{cart.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Fulfillment</span>
                  <span className="flex items-center gap-1">
                    {deliveryOption === "SELF_PICKUP" ? (
                      <><Package size={12} /> Self Pickup</>
                    ) : (
                      <><Truck size={12} /> Delivery</>
                    )}
                  </span>
                </div>
                {deliveryOption === "DELIVERED" && deliveryAddress && (
                  <div className="flex justify-between text-gray-600">
                    <span>Address</span>
                    <span className="text-right max-w-[60%] text-xs">{deliveryAddress}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{fmt(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>{totals.deliveryFee === 0 ? "Free" : fmt(totals.deliveryFee)}</span>
                </div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span className="text-green-700">{fmt(totals.total)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Payment is collected on delivery or via mobile money after confirmation.
              </p>
            </div>
          )}

          {/* ── STEP: Success ────────────────── */}
          {step === "success" && (
            <div className="py-8 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-xl">Order Placed!</h3>
              <p className="text-gray-500 text-sm max-w-xs">
                Your order has been sent to the farmers. You'll receive an SMS
                confirmation shortly.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        {step !== "success" && cart.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100">
            {step === "review" && (
              <button
                onClick={() => setStep("delivery")}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
              >
                Choose Delivery
                <ChevronRight size={16} />
              </button>
            )}
            {step === "delivery" && (
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
                  Review Order
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("delivery")}
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
