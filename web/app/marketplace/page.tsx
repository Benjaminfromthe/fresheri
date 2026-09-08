"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ShoppingCart,
  SlidersHorizontal,
  X,
  Sprout,
  Search,
} from "lucide-react";

import FilterSidebar from "@/components/marketplace/FilterSidebar";
import ProduceCard   from "@/components/marketplace/ProduceCard";
import CheckoutModal from "@/components/marketplace/CheckoutModal";

import { MOCK_LISTINGS } from "@/lib/mock-listings";
import {
  CartItem,
  DEFAULT_FILTERS,
  DeliveryOption,
  MarketplaceFilters,
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

    if (filters.minAvailableQty > 0 && l.availableQuantity < filters.minAvailableQty)
      return false;

    if (
      filters.location &&
      !l.farmLocation.toLowerCase().includes(filters.location.toLowerCase())
    )
      return false;

    if (filters.fulfillment !== "ALL" && !l.deliveryOptions.includes(filters.fulfillment as DeliveryOption))
      return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !l.produceName.toLowerCase().includes(q) &&
        !l.sellerName.toLowerCase().includes(q) &&
        !(l.variety ?? "").toLowerCase().includes(q) &&
        !l.farmLocation.toLowerCase().includes(q)
      )
        return false;
    }

    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Marketplace Page
// ─────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [filters, setFilters]           = useState<MarketplaceFilters>(DEFAULT_FILTERS);
  const [search, setSearch]             = useState("");
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Filtered listings
  const filteredListings = useMemo(
    () => applyFilters(MOCK_LISTINGS, filters, search),
    [filters, search]
  );

  // ── Cart operations
  const handleAddToCart = useCallback(
    (listing: ProduceListing, qty: number) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.listing.id === listing.id);
        if (existing) {
          return prev.map((i) =>
            i.listing.id === listing.id ? { ...i, quantityKg: qty } : i
          );
        }
        return [...prev, { listing, quantityKg: qty }];
      });
    },
    []
  );

  const handleRemoveFromCart = useCallback((listingId: string) => {
    setCart((prev) => prev.filter((i) => i.listing.id !== listingId));
  }, []);

  // ── Order placement (calls our Express backend)
  const handlePlaceOrder = useCallback(
    async (deliveryOption: DeliveryOption, deliveryAddress: string) => {
      // In production these come from the auth context
      const PLACEHOLDER_BUYER_ID = "00000000-0000-0000-0000-000000000001";

      await Promise.all(
        cart.map((item) =>
          fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerId:         PLACEHOLDER_BUYER_ID,
              listingId:       item.listing.id,
              quantityKg:      item.quantityKg,
              deliveryOption,
              deliveryAddress: deliveryAddress || undefined,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.json();
              throw new Error(body.message ?? "Order failed");
            }
          })
        )
      );

      // Clear cart on success
      setCart([]);
    },
    [cart]
  );

  const cartCount = cart.length;
  const cartTotal = cart.reduce(
    (sum, i) => sum + i.quantityKg * i.listing.unitPrice,
    0
  );
  const currency = cart[0]?.listing.currency ?? "KES";

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Nav ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
              <Sprout size={18} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Fresheri
            </span>
            <span className="text-xs text-gray-400 hidden sm:block">Marketplace</span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              placeholder="Search produce, cooperative, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-gray-50"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              aria-label="Open filters"
            >
              <SlidersHorizontal size={16} />
            </button>

            {/* Cart button */}
            <button
              onClick={() => setShowCheckout(true)}
              disabled={cartCount === 0}
              className="relative flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              aria-label={`Cart — ${cartCount} items`}
            >
              <ShoppingCart size={16} />
              <span className="hidden sm:inline">Order</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero banner ── */}
      <div className="bg-gradient-to-r from-green-700 to-emerald-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Bulk Produce Marketplace
          </h1>
          <p className="text-green-100 text-sm sm:text-base max-w-xl">
            Source directly from verified farmer cooperatives. Buy in bulk,
            get fresh, reduce costs.
          </p>

          {/* Quick stats */}
          <div className="mt-5 flex flex-wrap gap-4">
            {[
              { label: "Active Listings",  value: MOCK_LISTINGS.filter(l => l.status !== "SOLD_OUT").length },
              { label: "Cooperatives",     value: new Set(MOCK_LISTINGS.map(l => l.sellerName)).size },
              { label: "Crop Categories",  value: new Set(MOCK_LISTINGS.map(l => l.categoryName)).size },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-green-100 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">

          {/* ── Desktop Filter Sidebar ── */}
          <div className="hidden lg:block sticky top-20 self-start">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                totalResults={filteredListings.length}
              />
            </div>
          </div>

          {/* ── Listings grid ── */}
          <div className="flex-1 min-w-0">

            {/* Result bar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-800">{filteredListings.length}</span>{" "}
                listing{filteredListings.length !== 1 ? "s" : ""} available
              </p>
              {cartCount > 0 && (
                <button
                  onClick={() => setShowCheckout(true)}
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
                <p className="font-semibold text-lg">No listings match your filters</p>
                <button
                  onClick={() => { setFilters(DEFAULT_FILTERS); setSearch(""); }}
                  className="text-sm text-green-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
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

      {/* ── Mobile Filter Drawer ── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900">Filters</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition"
                aria-label="Close filters"
              >
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

      {/* ── Checkout Modal ── */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onClose={() => setShowCheckout(false)}
          onRemoveItem={handleRemoveFromCart}
          onPlaceOrder={handlePlaceOrder}
        />
      )}
    </div>
  );
}
