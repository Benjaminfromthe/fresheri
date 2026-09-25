"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations }  from "next-intl";
import { useSearchParams }  from "next/navigation";
import { ShoppingCart, SlidersHorizontal, X, Search, Sprout } from "lucide-react";

import Header           from "@/components/layout/Header";
import Footer           from "@/components/layout/Footer";
import FilterSidebar    from "@/components/marketplace/FilterSidebar";
import ProduceCard      from "@/components/marketplace/ProduceCard";
import CheckoutModal    from "@/components/marketplace/CheckoutModal";
import AuthGateModal    from "@/components/auth/AuthGateModal";
import { toast }        from "@/components/ui/Toaster";

import { MOCK_LISTINGS }         from "@/lib/mock-listings";
import { placeOrderBatch }       from "@/lib/api-client";
import { getStoredUser }         from "@/lib/api-client";
import { PLACEHOLDER_BUYER_ID }  from "@/lib/constants";
import { useAuthGate }           from "@/lib/auth/use-auth-gate";
import {
  CartItem,
  DEFAULT_FILTERS,
  DeliveryOption,
  MarketplaceFilters,
  OrderResult,
  ProduceListing,
} from "@/types/marketplace";

// ─────────────────────────────────────────────────────────────
// Filter logic
// ─────────────────────────────────────────────────────────────

function applyFilters(
  listings: ProduceListing[],
  filters: MarketplaceFilters,
  search: string
): ProduceListing[] {
  return listings.filter((l) => {
    if (l.status === "SOLD_OUT") return false;
    if (filters.category && l.categoryName !== filters.category) return false;
    if (filters.minAvailableQty > 0 && l.availableQuantity < filters.minAvailableQty) return false;

    // Province/district filter (new) takes priority over legacy location
    if (filters.district) {
      if (!l.region.toLowerCase().includes(filters.district.toLowerCase())) return false;
    } else if (filters.location && filters.location !== filters.province) {
      if (!l.region.toLowerCase().includes(filters.location.toLowerCase())) return false;
    }

    if (filters.fulfillment !== "ALL" && !l.deliveryOptions.includes(filters.fulfillment as DeliveryOption)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !l.produceName.toLowerCase().includes(q) &&
        !l.sellerDisplayName.toLowerCase().includes(q) &&
        !(l.variety ?? "").toLowerCase().includes(q) &&
        !l.region.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Marketplace Page
// ─────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const t  = useTranslations("marketplace");
  const tc = useTranslations("common");
  const tt = useTranslations("toast");

  // Auth gate — intercepts unauthenticated actions
  const { gateState, gate, onAuthSuccess, closeGate } = useAuthGate();

  // URL search param from "View Details" on landing cards
  const searchParams  = useSearchParams();
  const initialSearch = searchParams.get("search") ?? "";

  const [filters, setFilters]             = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [search, setSearch]               = useState(initialSearch);
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout]   = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const filteredListings = useMemo(
    () => applyFilters(MOCK_LISTINGS, filters, search),
    [filters, search]
  );

  // ── Gated: Add to cart ────────────────────────────────────
  const handleAddToCart = useCallback(
    (listing: ProduceListing, qty: number, fulfillment: DeliveryOption) => {
      gate("placeOrder", listing.id, () => {
        setCart((prev) => {
          const existing = prev.find((i) => i.listing.id === listing.id);
          if (existing) {
            return prev.map((i) =>
              i.listing.id === listing.id
                ? { ...i, quantityKg: qty, selectedFulfillment: fulfillment }
                : i
            );
          }
          return [...prev, { listing, quantityKg: qty, selectedFulfillment: fulfillment }];
        });
        toast.success(tt("cartAdded", { name: listing.produceName }));
      });
    },
    [gate, tt]
  );

  const handleRemoveFromCart = useCallback(
    (listingId: string) => setCart((prev) => prev.filter((i) => i.listing.id !== listingId)),
    []
  );

  // ── Gated: Open checkout ──────────────────────────────────
  const handleOpenCheckout = useCallback(() => {
    gate("placeOrder", undefined, () => setShowCheckout(true));
  }, [gate]);

  // ── Gated: Place order ────────────────────────────────────
  const handlePlaceOrder = useCallback(
    async (deliveryOption: DeliveryOption, deliveryAddress: string): Promise<OrderResult[]> => {
      // At this point the user is authenticated (checkout was gated)
      try {
        const user    = getStoredUser();
        const buyerId = user?.userId ?? PLACEHOLDER_BUYER_ID;
        const results = await placeOrderBatch(
          cart.map((item) => ({
            buyerId,
            listingId:       item.listing.id,
            quantityKg:      item.quantityKg,
            deliveryOption,
            deliveryAddress: deliveryAddress || undefined,
          }))
        );
        setCart([]);
        toast.success(tt("orderSuccess"));
        return results;
      } catch {
        toast.error(tt("orderError"));
        throw new Error("Order failed");
      }
    },
    [cart, tt]
  );

  // ── Auth gate success → replay pending action ─────────────
  const handleAuthSuccess = useCallback(() => {
    onAuthSuccess();
  }, [onAuthSuccess]);

  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, i) => sum + i.quantityKg * i.listing.unitPrice, 0);
  const currency  = cart[0]?.listing.currency ?? "RWF";
  const isAuthed  = typeof window !== "undefined" && !!getStoredUser();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      <Header />

      {/* ── Green marketplace header bar ── */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{t("heroTitle")}</h1>
              <p className="text-green-100 text-sm mt-1 max-w-md">{t("heroSubtitle")}</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto sm:min-w-80">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder={t("searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border-0 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 bg-white transition-all"
                />
              </div>

              {/* Cart — gated */}
              <button
                onClick={handleOpenCheckout}
                disabled={cartCount === 0}
                className="relative flex items-center gap-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors border border-white/30"
                aria-label={`Cart — ${cartCount} items`}
              >
                <ShoppingCart size={16} />
                <span className="hidden sm:inline">{cartCount > 0 ? `${cartCount}` : ""}</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Mobile filter */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-xl border border-white/30 transition"
                aria-label={tc("search")}
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-4">
            {[
              { label: t("activeListings"),  value: MOCK_LISTINGS.filter((l) => l.status !== "SOLD_OUT").length },
              { label: t("cooperatives"),    value: new Set(MOCK_LISTINGS.map((l) => l.sellerDisplayName)).size },
              { label: t("cropCategories"),  value: new Set(MOCK_LISTINGS.map((l) => l.categoryName)).size },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-lg font-bold">{value}</p>
                <p className="text-green-100 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">

        {/* Guest CTA banner — dismissable, hidden once logged in */}
        {!isAuthed && (
          <GuestBanner onGate={() => gate("placeOrder", undefined, () => {})} />
        )}

        <div className="flex gap-6">

          {/* Desktop sidebar */}
          <div className="hidden lg:block sticky top-20 self-start shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-64">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                totalResults={filteredListings.length}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{filteredListings.length}</span>{" "}
                {t("listingsAvailable", { count: filteredListings.length })}
              </p>
              {cartCount > 0 && (
                <button
                  onClick={handleOpenCheckout}
                  className="flex items-center gap-2 text-sm text-green-700 font-semibold hover:underline"
                >
                  <ShoppingCart size={14} />
                  {cartCount} item{cartCount !== 1 ? "s" : ""} ·{" "}
                  {currency} {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </button>
              )}
            </div>

            {filteredListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                <Sprout size={48} className="opacity-30" />
                <p className="font-semibold text-lg">{t("noListingsTitle")}</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                  className="text-sm text-green-600 hover:underline"
                >
                  {t("noListingsClear")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredListings.map((listing) => (
                  <ProduceCard
                    key={listing.id}
                    listing={listing}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Mobile filter drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">{tc("search")}</span>
              <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterSidebar
                filters={filters}
                onChange={(f) => { setFilters(f); setMobileSidebarOpen(false); }}
                totalResults={filteredListings.length}
              />
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal — only reachable after auth */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onRemoveItem={handleRemoveFromCart}
          onPlaceOrder={handlePlaceOrder}
        />
      )}

      {/* Auth gate modal — intercepts unauthenticated actions */}
      <AuthGateModal
        open={gateState.open}
        action={gateState.pendingAction?.type ?? null}
        onClose={closeGate}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// GuestBanner — soft CTA, dismissable
// ─────────────────────────────────────────────────────────────

function GuestBanner({ onGate }: { onGate: () => void }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return typeof window !== "undefined" && !!localStorage.getItem("guest_banner_dismissed"); }
    catch { return false; }
  });

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("guest_banner_dismissed", "1"); } catch { /* */ }
  };

  return (
    <div className="relative mb-6 rounded-2xl overflow-hidden shadow-sm border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <Sprout size={20} className="text-green-700" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">
              Browse freely — sign up when you're ready to order
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              View all products, prices and regions without an account. Create one free to place orders.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGate}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
          >
            Create Free Account
          </button>
          <button
            onClick={dismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
