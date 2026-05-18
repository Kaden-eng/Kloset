"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useSupabase } from "@/components/SupabaseProvider";
import { useInventoryItems } from "@/hooks/useDatabase";
import type { Database, Json } from "@/types/supabase";

const workflowActions = [
  { label: "Upload first item", href: "/inventory", detail: "Add photos and basic details for one piece." },
  { label: "Learn pricing basics", href: "/market", detail: "Use recent sale prices to choose a fair starting price." },
  { label: "Create first listing", href: "/listings", detail: "Review the draft before posting it to a selling app." },
  { label: "Track first sale", href: "/sales", detail: "Save sale price, fees, shipping, and money made." },
];

const onboardingSteps = [
  {
    title: "Add your first item",
    detail: "Start with one clear photo, the brand, size, condition, and what you paid.",
    href: "/inventory",
  },
  {
    title: "Get a price estimate",
    detail: "Kloset compares simple recent sale signals and suggests a realistic range.",
    href: "/market",
  },
  {
    title: "Create a listing draft",
    detail: "Turn the saved item into a draft you can edit before posting.",
    href: "/listings",
  },
  {
    title: "Track when it sells",
    detail: "Add sale price, fees, and shipping so Kloset shows money made.",
    href: "/sales",
  },
];

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];

function normalizeStatus(status?: string | null) {
  const normalized = (status ?? "draft").toLowerCase();
  if (normalized === "listed" || normalized === "sold") return normalized;
  return "draft";
}

function getListingPrice(item: InventoryItem) {
  const data = item.marketplace_data && typeof item.marketplace_data === "object" && !Array.isArray(item.marketplace_data)
    ? item.marketplace_data as Record<string, Json>
    : {};

  return typeof data.listingPrice === "number" ? data.listingPrice : item.estimated_price ?? 0;
}

function numberValue(data: Record<string, Json>, key: string) {
  const value = data[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getSaleProfit(item: InventoryItem) {
  const data = item.marketplace_data && typeof item.marketplace_data === "object" && !Array.isArray(item.marketplace_data)
    ? item.marketplace_data as Record<string, Json>
    : {};

  const salePrice = numberValue(data, "salePrice");
  if (normalizeStatus(item.status) !== "sold" && salePrice === 0) return 0;

  const originalCost = numberValue(data, "purchasePrice") || numberValue(data, "originalCost");
  const fees = numberValue(data, "saleFees");
  const shipping = numberValue(data, "shippingCost");
  return salePrice - originalCost - fees - shipping;
}

function statusLabel(status?: string | null) {
  const normalized = normalizeStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export default function DashboardPage() {
  const { items: inventory, loading: inventoryLoading, error: inventoryError } = useInventoryItems();
  const { user } = useSupabase();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user?.id || typeof window === "undefined") return;
    const key = `kloset:onboarding:${user.id}`;
    window.queueMicrotask(() => {
      setShowOnboarding(window.localStorage.getItem(key) !== "done");
    });
  }, [user?.id]);

  const closeOnboarding = () => {
    if (user?.id && typeof window !== "undefined") {
      window.localStorage.setItem(`kloset:onboarding:${user.id}`, "done");
    }
    setShowOnboarding(false);
  };

  const summary = useMemo(() => {
    const stats = inventory.reduce(
      (totals, item) => {
        const status = normalizeStatus(item.status);
        totals.total += 1;
        if (status === "listed") totals.listed += 1;
        if (status === "sold") totals.sold += 1;
        if (status === "draft") totals.draft += 1;
        totals.totalValue += getListingPrice(item);
        totals.moneyMade += getSaleProfit(item);
        return totals;
      },
      { total: 0, draft: 0, listed: 0, sold: 0, totalValue: 0, moneyMade: 0 }
    );

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
      moneyMade: `$${Math.round(stats.moneyMade).toLocaleString()}`,
      nextStep,
      nextStepDetail,
    };
  }, [inventory]);

  const loading = inventoryLoading;
  const error = inventoryError;

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

            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total items", summary.total, "Everything saved in inventory"],
                ["Active listings", summary.listed, "Items marked listed"],
                ["Sold items", summary.sold, "Items marked sold"],
                ["Inventory value", summary.estimated, "Based on listing prices"],
              ].map(([label, value, detail]) => (
                <div key={label} className="rounded-[1.35rem] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-md">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">{label}</p>
                  <p className="mt-4 text-3xl font-semibold text-stone-950">{value}</p>
                  <p className="mt-2 text-xs leading-5 text-stone-500">{detail}</p>
                </div>
              ))}
            </section>

            <section className="mb-6 rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Start here</p>
                  <h2 className="mt-2 text-xl font-semibold text-stone-950">Your first resale workflow</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    New to selling? Follow these four steps once. After that, each new item follows the same path.
                  </p>
                </div>
                <Link href="/inventory" className="inline-flex w-fit rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800">
                  Upload first item
                </Link>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {workflowActions.map((action, index) => (
                  <Link key={action.label} href={action.href} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100">
                    <span className="text-xs font-semibold text-stone-500">Step {index + 1}</span>
                    <p className="mt-2 font-semibold text-stone-950">{action.label}</p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">{action.detail}</p>
                  </Link>
                ))}
              </div>
            </section>

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
                          <p className="mt-1 text-sm text-stone-500">{item.category} - {statusLabel(item.status)}</p>
                        </div>
                        <p className="text-sm font-semibold text-stone-950 sm:text-right">
                          {getListingPrice(item) ? `$${getListingPrice(item).toLocaleString()}` : "Price needed"}
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
                      <span className="text-stone-600">Money made</span>
                      <span className="font-semibold text-stone-950">{summary?.moneyMade ?? "$0"}</span>
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

        {showOnboarding ? (
          <div className="fixed inset-0 z-50 flex items-end bg-stone-950/30 px-4 py-4 sm:items-center sm:justify-center">
            <div className="w-full max-w-2xl rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-4 border-b border-stone-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Quick setup</p>
                  <h2 className="mt-2 text-2xl font-semibold text-stone-950">Start with one item</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    Kloset works best when you move one item through the full flow: upload, price, list, then track the sale.
                  </p>
                </div>
                <button type="button" onClick={closeOnboarding} className="w-fit rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700">
                  Skip
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {onboardingSteps.map((step, index) => (
                  <Link
                    key={step.title}
                    href={step.href}
                    onClick={closeOnboarding}
                    className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:bg-stone-100 sm:grid-cols-[2.5rem_1fr]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-stone-950 shadow-sm">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold text-stone-950">{step.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-stone-500">{step.detail}</span>
                    </span>
                  </Link>
                ))}
              </div>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeOnboarding} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-800">
                  I’ll explore
                </button>
                <Link href="/inventory" onClick={closeOnboarding} className="rounded-full bg-stone-950 px-4 py-2 text-center text-sm font-semibold text-white">
                  Add first item
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ProtectedPage>
  );
}
