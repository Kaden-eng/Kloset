"use client";

import { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useInventoryItems, useInventoryStats } from "@/hooks/useDatabase";

const workflowActions = [
  { label: "Upload item", href: "/inventory", detail: "Add photos, details, and a price estimate." },
  { label: "Review drafts", href: "/listings", detail: "Finish listings that need photos, measurements, or price checks." },
  { label: "Check sales", href: "/sales", detail: "See orders, shipping tasks, and money coming in." },
  { label: "Compare prices", href: "/market", detail: "Look at recent sale prices before you list." },
];

export default function DashboardPage() {
  const { items: inventory, loading: inventoryLoading, error: inventoryError } = useInventoryItems();
  const { stats, loading: statsLoading, error: statsError } = useInventoryStats();

  const summary = useMemo(() => {
    if (!stats) return null;

    const nextStep =
      stats.total === 0 ? "Upload your first item" : stats.draft > 0 ? "Review draft listings" : "Check prices before posting";
    const nextStepDetail =
      stats.total === 0
        ? "Start with one item photo. Kloset will help you fill in the listing details."
        : stats.draft > 0
          ? "Drafts are items you have saved but have not posted yet."
          : "Use recent sale prices to make sure your next listing feels realistic.";

    return {
      total: stats.total,
      listed: stats.listed,
      sold: stats.sold,
      drafts: stats.draft,
      estimated: `$${Math.round(stats.totalValue).toLocaleString()}`,
      nextStep,
      nextStepDetail,
    };
  }, [stats]);

  const loading = inventoryLoading || statsLoading;
  const error = inventoryError || statsError;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Overview
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Your resale workspace
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  A simple snapshot of what you own, what is ready to sell, and what needs attention next.
                </p>
              </div>
              <Link
                href="/inventory"
                className="inline-flex w-fit rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
              >
                Upload item
              </Link>
            </section>

            {summary ? (
              <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Total items", summary.total, "Everything saved in inventory"],
                  ["Ready to sell", summary.listed, "Items already listed"],
                  ["Drafts to finish", summary.drafts, "Need review before posting"],
                  ["Estimated value", summary.estimated, "Based on saved item prices"],
                ].map(([label, value, detail]) => (
                  <div key={label} className="rounded-[1.35rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">{label}</p>
                    <p className="mt-4 text-3xl font-semibold text-stone-950">{value}</p>
                    <p className="mt-2 text-xs leading-5 text-stone-500">{detail}</p>
                  </div>
                ))}
              </section>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Recent inventory</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">Latest items</h2>
                  </div>
                  <Link href="/inventory" className="text-sm font-semibold text-stone-700 transition hover:text-stone-950">
                    Manage inventory
                  </Link>
                </div>

                <div className="mt-2 divide-y divide-stone-200">
                  {loading ? (
                    <div className="py-12 text-center text-sm text-stone-500">Loading inventory...</div>
                  ) : error ? (
                    <div className="my-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Inventory could not load. You can retry from the Inventory page.
                    </div>
                  ) : inventory.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="font-semibold text-stone-950">No items yet</p>
                      <p className="mt-2 text-sm text-stone-500">Upload one item to start building your workspace.</p>
                    </div>
                  ) : (
                    inventory.slice(0, 5).map((item) => (
                      <div key={item.id} className="grid gap-4 py-4 sm:grid-cols-[3.5rem_1fr_auto] sm:items-center">
                        <div className="aspect-square overflow-hidden rounded-2xl bg-stone-100">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{item.brand || "Unknown brand"}</p>
                          <h3 className="mt-1 font-semibold text-stone-950">{item.item_name}</h3>
                          <p className="mt-1 text-sm text-stone-500">{item.category} - {item.status}</p>
                        </div>
                        <p className="text-sm font-semibold text-stone-950 sm:text-right">
                          {item.estimated_price ? `$${item.estimated_price.toLocaleString()}` : "Price needed"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Next best step</p>
                  <h2 className="mt-3 text-2xl font-semibold text-stone-950">{summary?.nextStep ?? "Loading workspace"}</h2>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{summary?.nextStepDetail ?? "Checking your inventory now."}</p>
                  <Link
                    href={summary?.drafts ? "/listings" : "/inventory"}
                    className="mt-5 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                  >
                    {summary?.drafts ? "Review drafts" : "Go to inventory"}
                  </Link>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Quick actions</p>
                  <div className="mt-4 space-y-3">
                    {workflowActions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        className="block rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100"
                      >
                        <p className="font-semibold text-stone-950">{action.label}</p>
                        <p className="mt-1 text-xs leading-5 text-stone-500">{action.detail}</p>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Business snapshot</p>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                      <span className="text-stone-600">Sold items</span>
                      <span className="font-semibold text-stone-950">{summary?.sold ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                      <span className="text-stone-600">Drafts waiting</span>
                      <span className="font-semibold text-stone-950">{summary?.drafts ?? 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
