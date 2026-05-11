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
        <main className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-10 shadow-2xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Resale dashboard</p>
                <h1 className="mt-4 text-4xl font-semibold text-stone-900">Your inventory pulse</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
                  Review current estimates, active listings, and latest inventory additions with premium clarity.
                </p>
              </div>
              {summary && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Total items</p>
                    <p className="mt-4 text-3xl font-semibold text-stone-900">{summary.total}</p>
                  </div>
                  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Active listings</p>
                    <p className="mt-4 text-3xl font-semibold text-stone-900">{summary.listed}</p>
                  </div>
                  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-5 text-center">
                    <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Estimated value</p>
                    <p className="mt-4 text-3xl font-semibold text-stone-900">{summary.estimated}</p>
                  </div>
                </div>
              )}
            </div>

            {summary && (
              <div className="mt-10 grid gap-6 lg:grid-cols-3">
                <div className="rounded-4xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Drafts</p>
                  <p className="mt-4 text-3xl font-semibold text-stone-900">{summary.drafts}</p>
                  <p className="mt-2 text-sm text-stone-600">Items waiting for final pricing or listing details.</p>
                </div>
                <div className="rounded-4xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Sold</p>
                  <p className="mt-4 text-3xl font-semibold text-stone-900">{summary.sold}</p>
                  <p className="mt-2 text-sm text-stone-600">Completed sales and settled inventory.</p>
                </div>
                <div className="rounded-4xl border border-stone-200 bg-white p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Recent value change</p>
                  <p className="mt-4 text-3xl font-semibold text-stone-900">+12%</p>
                  <p className="mt-2 text-sm text-stone-600">Based on current marketplace momentum.</p>
                </div>
              </div>
            )}

            <div className="mt-12">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Recent inventory</p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-900">Latest additions</h2>
                </div>
                <Link href="/inventory" className="text-sm font-semibold text-stone-900 hover:underline">
                  Manage inventory
                </Link>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="col-span-full rounded-4xl border border-stone-200 bg-stone-50 p-10 text-center text-stone-500">
                    Loading inventory…
                  </div>
                ) : error ? (
                  <div className="col-span-full rounded-4xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
                    Error loading inventory: {error}
                  </div>
                ) : inventory.length === 0 ? (
                  <div className="col-span-full rounded-4xl border border-stone-200 bg-stone-50 p-10 text-center text-stone-500">
                    No inventory added yet. Start with a new upload in Inventory.
                  </div>
                ) : (
                  inventory.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-4xl border border-stone-200 bg-stone-50 p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-stone-500">{item.brand}</p>
                          <h3 className="mt-2 text-xl font-semibold text-stone-900">{item.item_name}</h3>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${
                          item.status === 'Listed' ? 'bg-green-100 text-green-800' :
                          item.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                          'bg-stone-900 text-white'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <p className="text-sm text-stone-600">{item.category}</p>
                        <p className="text-sm font-semibold text-stone-900">
                          {item.estimated_price ? `$${item.estimated_price.toLocaleString()}` : 'TBD'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
