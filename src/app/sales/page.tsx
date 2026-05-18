"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Banknote, CheckCircle2, Edit3, Loader2, PackageOpen, Truck } from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useToast } from "@/components/ToastProvider";
import { useInventoryItems } from "@/hooks/useDatabase";
import type { Database, Json } from "@/types/supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemUpdate = Database["public"]["Tables"]["inventory_items"]["Update"];
type SaleStatus = "shipping_needed" | "pending_payout" | "completed";
type Platform = "Depop" | "Grailed" | "eBay" | "Poshmark" | "StockX";

type SaleForm = {
  itemId: string;
  salePrice: string;
  fees: string;
  shipping: string;
  originalCost: string;
  platform: Platform;
  soldDate: string;
  status: SaleStatus;
};

type SaleDetails = {
  salePrice: number;
  fees: number;
  shipping: number;
  originalCost: number;
  platform: Platform;
  soldDate: string;
  status: SaleStatus;
};

const platforms: Platform[] = ["Depop", "Grailed", "eBay", "Poshmark", "StockX"];

const statusLabels: Record<SaleStatus, string> = {
  shipping_needed: "Shipping needed",
  pending_payout: "Pending payout",
  completed: "Completed",
};

const statusStyles: Record<SaleStatus, string> = {
  shipping_needed: "border-amber-200 bg-amber-50 text-amber-700",
  pending_payout: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function detailsFor(item: InventoryItem): Record<string, Json> {
  return isRecord(item.marketplace_data) ? item.marketplace_data : {};
}

function stringValue(details: Record<string, Json>, key: string): string {
  const value = details[key];
  return typeof value === "string" ? value : "";
}

function numberValue(details: Record<string, Json>, key: string): number | null {
  const value = details[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseMoney(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function normalizedDbStatus(status: string) {
  return status.toLowerCase();
}

function readSale(item: InventoryItem): SaleDetails | null {
  const details = detailsFor(item);
  const salePrice = numberValue(details, "salePrice");
  if (normalizedDbStatus(item.status) !== "sold" && salePrice === null) return null;

  const platform = stringValue(details, "salePlatform") || stringValue(details, "platform") || "Depop";
  const status = stringValue(details, "saleStatus");

  return {
    salePrice: salePrice ?? numberValue(details, "listingPrice") ?? item.estimated_price ?? 0,
    fees: numberValue(details, "saleFees") ?? 0,
    shipping: numberValue(details, "shippingCost") ?? 0,
    originalCost: numberValue(details, "purchasePrice") ?? numberValue(details, "originalCost") ?? 0,
    platform: platforms.includes(platform as Platform) ? (platform as Platform) : "Depop",
    soldDate: stringValue(details, "soldDate") || stringValue(details, "soldAt") || item.created_at,
    status: status === "pending_payout" || status === "completed" || status === "shipping_needed" ? status : "shipping_needed",
  };
}

function netProfit(sale: SaleDetails) {
  return sale.salePrice - sale.originalCost - sale.fees - sale.shipping;
}

function buildDetails(item: InventoryItem, sale: SaleDetails): Json {
  return {
    ...detailsFor(item),
    listingStatus: "sold",
    salePrice: sale.salePrice,
    saleFees: sale.fees,
    shippingCost: sale.shipping,
    originalCost: sale.originalCost,
    purchasePrice: sale.originalCost,
    salePlatform: sale.platform,
    platform: sale.platform,
    saleStatus: sale.status,
    soldDate: sale.soldDate,
    soldAt: sale.soldDate,
    updatedAt: new Date().toISOString(),
  };
}

function emptyForm(items: InventoryItem[]): SaleForm {
  const item = items.find((entry) => normalizedDbStatus(entry.status) !== "sold") ?? items[0];
  const details = item ? detailsFor(item) : {};
  const platform = stringValue(details, "platform") || "Depop";

  return {
    itemId: item ? String(item.id) : "",
    salePrice: item ? String(numberValue(details, "listingPrice") ?? item.estimated_price ?? "") : "",
    fees: "",
    shipping: "",
    originalCost: item ? String(numberValue(details, "purchasePrice") ?? numberValue(details, "originalCost") ?? "") : "",
    platform: platforms.includes(platform as Platform) ? (platform as Platform) : "Depop",
    soldDate: today(),
    status: "shipping_needed",
  };
}

function formFromSale(item: InventoryItem, sale: SaleDetails): SaleForm {
  return {
    itemId: String(item.id),
    salePrice: String(sale.salePrice || ""),
    fees: String(sale.fees || ""),
    shipping: String(sale.shipping || ""),
    originalCost: String(sale.originalCost || ""),
    platform: sale.platform,
    soldDate: sale.soldDate.slice(0, 10),
    status: sale.status,
  };
}

export default function SalesPage() {
  const { items, loading, error, updateItem, retry } = useInventoryItems();
  const { addToast } = useToast();
  const [form, setForm] = useState<SaleForm | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const sales = useMemo(
    () =>
      items
        .map((item) => ({ item, sale: readSale(item) }))
        .filter((entry): entry is { item: InventoryItem; sale: SaleDetails } => entry.sale !== null),
    [items]
  );

  const summary = useMemo(() => {
    const gross = sales.reduce((total, entry) => total + entry.sale.salePrice, 0);
    const fees = sales.reduce((total, entry) => total + entry.sale.fees, 0);
    const shipping = sales.reduce((total, entry) => total + entry.sale.shipping, 0);
    const profit = sales.reduce((total, entry) => total + netProfit(entry.sale), 0);
    const platformCounts = sales.reduce<Record<string, number>>((counts, entry) => {
      counts[entry.sale.platform] = (counts[entry.sale.platform] ?? 0) + 1;
      return counts;
    }, {});
    const bestPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None yet";

    return {
      gross,
      fees,
      shipping,
      profit,
      average: sales.length ? profit / sales.length : 0,
      bestPlatform,
      pendingPayout: sales.filter((entry) => entry.sale.status === "pending_payout").length,
      shippingNeeded: sales.filter((entry) => entry.sale.status === "shipping_needed").length,
    };
  }, [sales]);

  const availableItems = items.filter((item) => normalizedDbStatus(item.status) !== "sold");

  function openNewSale() {
    setEditingItem(null);
    setForm(emptyForm(availableItems));
  }

  function openEditSale(item: InventoryItem, sale: SaleDetails) {
    setEditingItem(item);
    setForm(formFromSale(item, sale));
  }

  async function saveSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const item = items.find((entry) => entry.id === Number(form.itemId));
    if (!item) {
      addToast("Choose an item before saving the sale.", "error");
      return;
    }

    const sale: SaleDetails = {
      salePrice: parseMoney(form.salePrice),
      fees: parseMoney(form.fees),
      shipping: parseMoney(form.shipping),
      originalCost: parseMoney(form.originalCost),
      platform: form.platform,
      soldDate: form.soldDate || today(),
      status: form.status,
    };

    const updates: InventoryItemUpdate = {
      status: "Sold",
      estimated_price: sale.salePrice,
      marketplace_data: buildDetails(item, sale),
    };

    try {
      setSavingId(item.id);
      await updateItem(item.id, updates);
      addToast("Sale saved.", "success");
      setForm(null);
      setEditingItem(null);
    } catch (saveError) {
      addToast(saveError instanceof Error ? saveError.message : "Could not save sale.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function updateSaleStatus(item: InventoryItem, sale: SaleDetails, status: SaleStatus) {
    try {
      setSavingId(item.id);
      await updateItem(item.id, {
        status: "Sold",
        marketplace_data: buildDetails(item, { ...sale, status }),
      });
      addToast(status === "completed" ? "Payout marked received." : "Sale updated.", "success");
    } catch (statusError) {
      addToast(statusError instanceof Error ? statusError.message : "Could not update sale.", "error");
    } finally {
      setSavingId(null);
    }
  }

  const shippingNeeded = sales.filter((entry) => entry.sale.status === "shipping_needed");
  const pendingPayout = sales.filter((entry) => entry.sale.status === "pending_payout");
  const completedSales = sales.filter((entry) => entry.sale.status === "completed");

  function SaleCard({ item, sale }: { item: InventoryItem; sale: SaleDetails }) {
    const profit = netProfit(sale);
    const busy = savingId === item.id;

    return (
      <article className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr]">
          <div className="aspect-square overflow-hidden rounded-xl border border-stone-200 bg-white">
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-300">
                <PackageOpen size={28} />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-stone-950">{item.item_name}</h3>
                <p className="mt-1 text-sm text-stone-500">{sale.platform} - Sold {formatDate(sale.soldDate)}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[sale.status]}`}>
                {statusLabels[sale.status]}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
              {[
                ["Sale price", money(sale.salePrice)],
                ["Original cost", money(sale.originalCost)],
                ["Fees", money(sale.fees)],
                ["Shipping", money(sale.shipping)],
                ["Money made", money(profit)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-white px-3 py-2">
                  <dt className="text-stone-500">{label}</dt>
                  <dd className={`mt-1 font-semibold ${label === "Money made" && profit < 0 ? "text-red-600" : "text-stone-950"}`}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openEditSale(item, sale)}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
              >
                <Edit3 size={14} />
                Edit sale
              </button>
              {sale.status === "shipping_needed" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateSaleStatus(item, sale, "pending_payout")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  <Truck size={14} />
                  Mark shipped
                </button>
              )}
              {sale.status === "pending_payout" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => updateSaleStatus(item, sale, "completed")}
                  className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                >
                  <Banknote size={14} />
                  Payout received
                </button>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Sales
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold text-stone-950">
                  Track money made
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Save sale prices, platform fees, shipping, and payouts so you can see what each item actually made.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewSale}
                disabled={availableItems.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                Mark item sold
              </button>
            </section>

            {loading ? (
              <div className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading sales
                </div>
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} />
                  <div>
                    <h2 className="font-semibold">Sales could not load</h2>
                    <p className="mt-1">{error}</p>
                    <button type="button" onClick={retry} className="mt-4 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white">
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
                <PackageOpen size={34} className="mx-auto text-stone-400" />
                <h2 className="mt-4 text-xl font-semibold text-stone-950">No inventory yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                  Add an item to inventory first, then mark it sold here when it sells.
                </p>
                <Link href="/inventory" className="mt-5 inline-flex rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white">
                  Add item
                </Link>
              </div>
            ) : (
              <>
                <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {[
                    ["Gross sales", money(summary.gross)],
                    ["Total fees", money(summary.fees)],
                    ["Shipping costs", money(summary.shipping)],
                    ["Money made", money(summary.profit)],
                    ["Avg. per sale", money(summary.average)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium text-stone-500">{label}</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-950">{value}</p>
                    </div>
                  ))}
                </section>

                <section className="mb-6 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-xs text-stone-500">Best-selling platform</p>
                      <p className="mt-2 font-semibold text-stone-950">{summary.bestPlatform}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-xs text-stone-500">Shipping needed</p>
                      <p className="mt-2 font-semibold text-stone-950">{summary.shippingNeeded}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 p-4">
                      <p className="text-xs text-stone-500">Pending payout</p>
                      <p className="mt-2 font-semibold text-stone-950">{summary.pendingPayout}</p>
                    </div>
                  </div>
                </section>

                {sales.length === 0 ? (
                  <section className="mb-6 rounded-[1.5rem] border border-dashed border-stone-200 bg-white p-8 text-center shadow-sm">
                    <Banknote size={34} className="mx-auto text-stone-400" />
                    <h2 className="mt-4 text-xl font-semibold text-stone-950">No sales tracked yet</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                      Mark an item as sold to track sale price, fees, shipping, and money made.
                    </p>
                    <button type="button" onClick={openNewSale} disabled={availableItems.length === 0} className="mt-5 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                      Mark item sold
                    </button>
                  </section>
                ) : null}

                <section className="space-y-5">
                  {[
                    ["Sold items", "Every item marked sold.", sales],
                    ["Shipping needed", "Pack and ship these orders.", shippingNeeded],
                    ["Pending payout", "Shipped sales waiting for money to arrive.", pendingPayout],
                    ["Completed sales", "Finished sales with payout received.", completedSales],
                  ].map(([title, helper, entries]) => (
                    <div key={title as string} className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-stone-950">{title as string}</h2>
                          <p className="mt-1 text-sm text-stone-500">{helper as string}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                          {(entries as typeof sales).length} {(entries as typeof sales).length === 1 ? "sale" : "sales"}
                        </span>
                      </div>
                      {(entries as typeof sales).length === 0 ? (
                        <p className="py-6 text-sm text-stone-500">Nothing here right now.</p>
                      ) : (
                        <div className="grid gap-3 pt-4">
                          {(entries as typeof sales).map((entry) => (
                            <SaleCard key={`${title}-${entry.item.id}`} item={entry.item} sale={entry.sale} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </section>
              </>
            )}
          </div>
        </main>

        {form && (
          <div className="fixed inset-0 z-50 flex items-end bg-stone-950/30 px-4 py-4 sm:items-center sm:justify-center">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">{editingItem ? "Edit sale" : "Mark item sold"}</h2>
                  <p className="mt-1 text-sm text-stone-500">Add the money details so profit is calculated for you.</p>
                </div>
                <button type="button" onClick={() => setForm(null)} className="rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700">
                  Close
                </button>
              </div>

              <form onSubmit={saveSale} className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Item
                  <select
                    value={form.itemId}
                    disabled={Boolean(editingItem)}
                    onChange={(event) => setForm({ ...form, itemId: event.target.value })}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400 disabled:bg-stone-100"
                  >
                    {(editingItem ? [editingItem] : availableItems).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.item_name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Sale price
                    <input value={form.salePrice} onChange={(event) => setForm({ ...form, salePrice: event.target.value })} inputMode="decimal" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400" placeholder="60" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Original cost
                    <input value={form.originalCost} onChange={(event) => setForm({ ...form, originalCost: event.target.value })} inputMode="decimal" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400" placeholder="20" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Platform fees
                    <span className="text-xs font-normal leading-5 text-stone-500">Fees are what the selling app keeps from the sale.</span>
                    <input value={form.fees} onChange={(event) => setForm({ ...form, fees: event.target.value })} inputMode="decimal" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400" placeholder="8" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Shipping cost
                    <input value={form.shipping} onChange={(event) => setForm({ ...form, shipping: event.target.value })} inputMode="decimal" className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400" placeholder="6" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Platform
                    <select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value as Platform })} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400">
                      {platforms.map((platform) => (
                        <option key={platform}>{platform}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Sold date
                    <input type="date" value={form.soldDate} onChange={(event) => setForm({ ...form, soldDate: event.target.value })} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold text-stone-800 sm:col-span-2">
                    Sale status
                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as SaleStatus })} className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400">
                      <option value="shipping_needed">Shipping needed</option>
                      <option value="pending_payout">Pending payout</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  Money made: <span className="font-semibold text-stone-950">{money(parseMoney(form.salePrice) - parseMoney(form.originalCost) - parseMoney(form.fees) - parseMoney(form.shipping))}</span>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setForm(null)} className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100">
                    Cancel
                  </button>
                  <button type="submit" disabled={savingId === Number(form.itemId)} className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60">
                    {savingId === Number(form.itemId) && <Loader2 size={16} className="animate-spin" />}
                    Save sale
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedPage>
  );
}
