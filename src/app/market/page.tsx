"use client";

import Link from "next/link";
import { Search, Tag } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useInventoryItems } from "@/hooks/useDatabase";
import { getPricingIntelligence, marketTrendBrands, popularMarketCategories } from "@/lib/pricing";
import type { Database, Json } from "@/types/supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

const sourceItems = [
  { title: "Arc'teryx Beta LT shell", brand: "Arc'teryx", category: "Outerwear", condition: "Good", listingPrice: 248 },
  { title: "Nike ACG fleece pullover", brand: "Nike", category: "Outerwear", condition: "Good", listingPrice: 84 },
  { title: "Vintage skate graphic tee", brand: "Stussy", category: "Tops", condition: "Good", listingPrice: 42 },
  { title: "Salomon XT-6 sneakers", brand: "Salomon", category: "Footwear", condition: "Fair", listingPrice: 96 },
  { title: "Zara cropped jacket", brand: "Zara", category: "Outerwear", condition: "Like New", listingPrice: 36 },
];

function money(value: number) {
  return `$${value.toLocaleString()}`;
}

function itemPrice(item: InventoryItem) {
  const data = item.marketplace_data && typeof item.marketplace_data === "object" && !Array.isArray(item.marketplace_data)
    ? item.marketplace_data as Record<string, Json>
    : {};
  return typeof data.listingPrice === "number" ? data.listingPrice : item.estimated_price ?? null;
}

function itemRange(item: InventoryItem) {
  const data = item.marketplace_data && typeof item.marketplace_data === "object" && !Array.isArray(item.marketplace_data)
    ? item.marketplace_data as Record<string, Json>
    : {};
  return {
    low: typeof data.priceLow === "number" ? data.priceLow : item.price_low ?? null,
    high: typeof data.priceHigh === "number" ? data.priceHigh : item.price_high ?? null,
  };
}

function pricingForInventoryItem(item: InventoryItem) {
  const range = itemRange(item);
  return getPricingIntelligence({
    title: item.item_name,
    brand: item.brand,
    category: item.category,
    condition: item.condition,
    listingPrice: itemPrice(item),
    priceLow: range.low,
    priceHigh: range.high,
    tags: item.tags,
  });
}

const marketExamples = sourceItems.map((item) => ({
  item,
  pricing: getPricingIntelligence(item),
}));

const recentSoldComps = marketExamples.flatMap(({ pricing }) => pricing.comps.slice(0, 2)).slice(0, 8);

export default function MarketPage() {
  const { items: inventory, loading, error } = useInventoryItems();
  const inventoryPricing = inventory.slice(0, 4).map((item) => ({
    item,
    pricing: pricingForInventoryItem(item),
  }));

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Recent sale prices
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Price with recent sales in mind
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  See practical recent sale prices, conservative price ranges, and plain notes before choosing a listing price.
                </p>
              </div>
              <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <Search size={17} className="text-stone-400" />
                <span className="text-sm text-stone-500">Search inventory, brands, or platforms</span>
              </div>
            </section>

            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Supported sources", "5", "Grailed, eBay, Depop, StockX, GOAT"],
                ["Average comp range", "$25-$140", "Most everyday resale items land here"],
                ["Pricing style", "Conservative", "Avoids overpricing basic mall brands"],
                ["Best next step", "Check condition", "Better condition usually sells faster"],
              ].map(([label, value, note]) => (
                <div key={label} className="rounded-[1.35rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">{label}</p>
                  <p className="mt-4 text-2xl font-semibold text-stone-950">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-500">{note}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Your inventory pricing</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">Recommended ranges</h2>
                  </div>
                  <Link href="/inventory" className="text-sm font-semibold text-stone-700 transition hover:text-stone-950">
                    Open inventory
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">Loading inventory pricing...</div>
                  ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Inventory pricing could not load.</div>
                  ) : inventoryPricing.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                      <p className="font-semibold text-stone-950">No inventory yet</p>
                      <p className="mt-2 text-sm text-stone-500">Upload items to get better price suggestions based on your own inventory.</p>
                      <Link href="/inventory" className="mt-4 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
                        Add inventory
                      </Link>
                    </div>
                  ) : (
                    inventoryPricing.map(({ item, pricing }) => (
                      <div key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-semibold text-stone-950">{item.item_name}</p>
                            <p className="mt-1 text-xs text-stone-500">{item.brand} - {item.category} - {item.condition}</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-700 shadow-sm">
                            {pricing.confidenceLabel} confidence
                          </span>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Quick-sale price</p>
                            <p className="mt-1 font-semibold text-stone-950">{money(pricing.quickSalePrice)}</p>
                            <p className="mt-1 text-[11px] leading-4 text-stone-500">Lower price that may sell faster.</p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Suggested price</p>
                            <p className="mt-1 font-semibold text-stone-950">{money(pricing.marketPrice)}</p>
                            <p className="mt-1 text-[11px] leading-4 text-stone-500">A balanced starting price.</p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2">
                            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Higher-price option</p>
                            <p className="mt-1 font-semibold text-stone-950">{money(pricing.maxProfitPrice)}</p>
                            <p className="mt-1 text-[11px] leading-4 text-stone-500">May take longer to sell.</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-stone-600">{pricing.explanation[0]} {pricing.explanation[2]}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="border-b border-stone-200 pb-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Recent sale prices</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-950">Sold prices from mock marketplace sources</h2>
                  <p className="mt-2 text-sm text-stone-500">Recent sale prices show what similar items actually sold for, not just what sellers asked.</p>
                </div>
                <div className="mt-2 divide-y divide-stone-200">
                  {recentSoldComps.map((sale) => (
                    <div key={sale.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="font-semibold text-stone-950">{sale.title}</p>
                        <p className="mt-1 text-sm text-stone-500">{sale.platform} - {sale.conditionNote} - {sale.soldDate}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm font-semibold text-stone-950">{money(sale.soldPrice)}</p>
                        <p className="mt-1 text-xs text-stone-500">Recent sale</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-white">
                    <Tag size={18} />
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Trending brands</p>
                    <h2 className="mt-1 text-xl font-semibold text-stone-950">Price movement to watch</h2>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {marketTrendBrands.map((brand) => (
                    <div key={brand.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-stone-950">{brand.name}</h3>
                        <span className="text-sm font-semibold text-stone-950">{brand.range}</span>
                      </div>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{brand.movement}</p>
                      <p className="mt-2 text-xs leading-5 text-stone-500">{brand.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Popular categories</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">Simple pricing notes</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {popularMarketCategories.map((category) => (
                    <div key={category.name} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-stone-950">{category.name}</h3>
                        <span className="text-sm font-semibold text-stone-950">{category.range}</span>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-stone-500">{category.note}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-xs leading-5 text-stone-500">
                  These mock integrations are designed for product testing. They model realistic sold-price behavior without overstating what basic items can sell for.
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
