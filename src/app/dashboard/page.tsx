"use client";

import { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useInventoryItems, useInventoryStats } from "@/hooks/useDatabase";

export default function DashboardPage() {
  const { items: inventory, loading: inventoryLoading, error: inventoryError } = useInventoryItems();
  const { stats, loading: statsLoading, error: statsError } = useInventoryStats();

  const summary = useMemo(() => {
    if (!stats) return null;

    return {
      total: stats.total,
      listed: stats.listed,
      sold: stats.sold,
      drafts: stats.draft,
      estimated: `$${Math.round(stats.totalValue).toLocaleString()}`,
    };
  }, [stats]);

  const loading = inventoryLoading || statsLoading;
  const error = inventoryError || statsError;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <Header />
        <main className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[1.8fr_1fr]">
              {/* Main content column */}
              <div>
                {/* Hero section */}
                <section className="mb-16">
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Resale dashboard</p>
                  <h1 className="mt-6 text-4xl font-semibold text-stone-900">Your inventory pulse</h1>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                    Review current estimates, active listings, and latest inventory additions with premium clarity.
                  </p>
                </section>

                {/* Overview stats - 3 column grid */}
                {summary && (
                  <section className="mb-16 grid gap-6 sm:grid-cols-3">
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Total items</p>
                      <p className="mt-6 text-4xl font-semibold text-stone-900">{summary.total}</p>
                      <p className="mt-3 text-sm text-stone-600">In your inventory</p>
                    </div>
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Active listings</p>
                      <p className="mt-6 text-4xl font-semibold text-stone-900">{summary.listed}</p>
                      <p className="mt-3 text-sm text-stone-600">Ready to sell</p>
                    </div>
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Total value</p>
                      <p className="mt-6 text-3xl font-semibold text-stone-900">{summary.estimated}</p>
                      <p className="mt-3 text-sm text-stone-600">Current estimate</p>
                    </div>
                  </section>
                )}

                {/* Detailed metrics section */}
                {summary && (
                  <section className="mb-16 grid gap-6 sm:grid-cols-3">
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Drafts</p>
                      <p className="mt-6 text-3xl font-semibold text-stone-900">{summary.drafts}</p>
                      <p className="mt-3 text-sm text-stone-600">Awaiting final details</p>
                    </div>
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Sold</p>
                      <p className="mt-6 text-3xl font-semibold text-stone-900">{summary.sold}</p>
                      <p className="mt-3 text-sm text-stone-600">Completed transactions</p>
                    </div>
                    <div className="rounded-4xl border border-stone-200 bg-white p-8">
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Portfolio change</p>
                      <p className="mt-6 text-3xl font-semibold text-stone-900">+12%</p>
                      <p className="mt-3 text-sm text-stone-600">Month-over-month growth</p>
                    </div>
                  </section>
                )}

                {/* Recent inventory section */}
                <section>
                  <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Recent inventory</p>
                      <h2 className="mt-3 text-2xl font-semibold text-stone-900">Latest additions</h2>
                    </div>
                    <Link href="/inventory" className="text-sm font-semibold text-stone-900 transition hover:text-stone-600">
                      View all →
                    </Link>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {loading ? (
                      <div className="col-span-full rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-12 text-center text-stone-500">
                        Loading inventory…
                      </div>
                    ) : error ? (
                      <div className="col-span-full rounded-4xl border border-red-200 bg-red-50 p-12 text-center text-red-700">
                        Error loading inventory: {error}
                      </div>
                    ) : inventory.length === 0 ? (
                      <div className="col-span-full rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-12 text-center text-stone-500">
                        No inventory added yet. Start with a new upload in Inventory.
                      </div>
                    ) : (
                      inventory.slice(0, 4).map((item) => (
                        <div key={item.id} className="flex flex-col rounded-4xl border border-stone-200 bg-white p-6">
                          {item.image_url && (
                            <div className="mb-4 aspect-[4/3] overflow-hidden rounded-3xl bg-stone-100">
                              <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{item.brand}</p>
                                <h3 className="mt-2 text-lg font-semibold text-stone-900">{item.item_name}</h3>
                              </div>
                              <span className={`rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] whitespace-nowrap ${
                                item.status === 'Listed' ? 'bg-green-100 text-green-800' :
                                item.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                                'bg-stone-900 text-white'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-stone-600">{item.category}</p>
                          </div>
                          <p className="mt-4 text-lg font-semibold text-stone-900">
                            {item.estimated_price ? `$${item.estimated_price.toLocaleString()}` : 'TBD'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              {/* Sidebar */}
              <div>
                <div className="rounded-4xl border border-stone-200 bg-white p-8 sticky top-20">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Quick insights</p>
                  <div className="mt-8 space-y-6">
                    <div className="pb-6 border-b border-stone-200">
                      <p className="text-sm font-medium text-stone-600">Your dashboard shows healthy inventory growth.</p>
                      <p className="mt-3 text-xs text-stone-500">Track trends in real-time across your portfolio.</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Recommended action</p>
                      <Link href="/inventory" className="mt-3 inline-flex items-center gap-2 rounded-3xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
                        Manage inventory
                      </Link>
                    </div>
                    <div className="pt-6 border-t border-stone-200">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Portfolio tip</p>
                      <p className="mt-3 text-sm text-stone-600">Items marked as Listed are more likely to sell within 30 days.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
