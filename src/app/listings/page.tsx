"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  CopyPlus,
  Edit3,
  Loader2,
  PackageOpen,
  Send,
  Trash2,
} from "lucide-react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useToast } from "@/components/ToastProvider";
import { useInventoryItems } from "@/hooks/useDatabase";
import type { Database, Json } from "@/types/supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];
type InventoryItemUpdate = Database["public"]["Tables"]["inventory_items"]["Update"];

type ListingStatus = "draft" | "ready" | "listed" | "sold" | "needs_attention";
type Platform = "Depop" | "Grailed" | "eBay" | "Poshmark" | "StockX";

type ListingForm = {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  size: string;
  tags: string;
  platform: Platform;
};

type ListingSection = {
  id: ListingStatus;
  title: string;
  helper: string;
};

const platforms: Platform[] = ["Depop", "Grailed", "eBay", "Poshmark", "StockX"];

const sections: ListingSection[] = [
  {
    id: "draft",
    title: "Drafts",
    helper: "Started listings that still need a quick review.",
  },
  {
    id: "ready",
    title: "Items ready to list",
    helper: "Finished listings you can post to a selling app.",
  },
  {
    id: "listed",
    title: "Active listings",
    helper: "Items already posted for sale.",
  },
  {
    id: "needs_attention",
    title: "Needs attention",
    helper: "Listings missing basics like a photo, price, or description.",
  },
];

const statusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  ready: "Ready to list",
  listed: "Listed",
  sold: "Sold",
  needs_attention: "Needs attention",
};

const statusStyles: Record<ListingStatus, string> = {
  draft: "border-stone-200 bg-stone-100 text-stone-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  listed: "border-blue-200 bg-blue-50 text-blue-700",
  sold: "border-stone-800 bg-stone-950 text-white",
  needs_attention: "border-amber-200 bg-amber-50 text-amber-700",
};

function isRecord(value: Json): value is Record<string, Json> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getDetails(item: InventoryItem): Record<string, Json> {
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

function tagsValue(item: InventoryItem, details: Record<string, Json>): string[] {
  const detailTags = details.tags;
  if (Array.isArray(detailTags)) {
    return detailTags.filter((tag): tag is string => typeof tag === "string");
  }
  return Array.isArray(item.tags) ? item.tags : [];
}

function normalizeDbStatus(status: string): ListingStatus | null {
  const normalized = status.toLowerCase();
  if (normalized === "listed") return "listed";
  if (normalized === "sold") return "sold";
  if (normalized === "draft") return "draft";
  return null;
}

function storedListingStatus(item: InventoryItem): ListingStatus | null {
  const value = stringValue(getDetails(item), "listingStatus");
  if (value === "draft" || value === "ready" || value === "listed" || value === "sold" || value === "needs_attention") {
    return value;
  }
  return normalizeDbStatus(item.status);
}

function listingPrice(item: InventoryItem, details = getDetails(item)): number | null {
  return numberValue(details, "listingPrice") ?? item.estimated_price ?? null;
}

function listingDescription(item: InventoryItem, details = getDetails(item)): string {
  return stringValue(details, "description") || item.generated_description || stringValue(details, "notes");
}

function hasMissingBasics(item: InventoryItem): boolean {
  const details = getDetails(item);
  return !item.image_url || !listingPrice(item, details) || !listingDescription(item, details).trim();
}

function listingStatus(item: InventoryItem): ListingStatus {
  const stored = storedListingStatus(item);
  if (!stored || stored === "draft") {
    return hasMissingBasics(item) ? "needs_attention" : "draft";
  }
  return stored;
}

function databaseStatusFor(status: ListingStatus): string {
  if (status === "listed") return "Listed";
  if (status === "sold") return "Sold";
  return "Draft";
}

function formatMoney(value: number | null): string {
  if (value === null) return "No price yet";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function parsePrice(value: string): number | null {
  const cleanValue = value.replace(/[^0-9.]/g, "");
  if (!cleanValue) return null;
  const parsed = Number(cleanValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function toForm(item: InventoryItem): ListingForm {
  const details = getDetails(item);
  const price = listingPrice(item, details);
  return {
    title: item.item_name,
    description: listingDescription(item, details),
    price: price === null ? "" : String(price),
    category: item.category,
    condition: item.condition,
    size: stringValue(details, "size"),
    tags: tagsValue(item, details).join(", "),
    platform: platforms.includes(stringValue(details, "platform") as Platform)
      ? (stringValue(details, "platform") as Platform)
      : "Depop",
  };
}

function buildDetails(item: InventoryItem, updates: Record<string, Json>): Json {
  return {
    ...getDetails(item),
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

function statusNote(item: InventoryItem, status: ListingStatus): string {
  if (status !== "needs_attention") return statusLabels[status];

  const missing: string[] = [];
  const details = getDetails(item);
  if (!item.image_url) missing.push("photo");
  if (!listingPrice(item, details)) missing.push("price");
  if (!listingDescription(item, details).trim()) missing.push("description");
  return missing.length ? `Needs ${missing.join(", ")}` : statusLabels.needs_attention;
}

export default function ListingsPage() {
  const { items, loading, error, updateItem, createItem, deleteItem, retry } = useInventoryItems();
  const { addToast } = useToast();
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<ListingForm | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const groupedItems = useMemo(() => {
    const groups: Record<ListingStatus, InventoryItem[]> = {
      draft: [],
      ready: [],
      listed: [],
      sold: [],
      needs_attention: [],
    };

    items.forEach((item) => {
      groups[listingStatus(item)].push(item);
    });

    return groups;
  }, [items]);

  const visibleCount = sections.reduce((total, section) => total + groupedItems[section.id].length, 0);

  function startEditing(item: InventoryItem) {
    setEditingItem(item);
    setForm(toForm(item));
  }

  async function saveListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingItem || !form) return;

    const price = parsePrice(form.price);
    const tags = parseTags(form.tags);
    const currentStatus = storedListingStatus(editingItem) ?? listingStatus(editingItem);

    const updates: InventoryItemUpdate = {
      item_name: form.title.trim() || "Untitled item",
      category: form.category.trim() || "Uncategorized",
      condition: form.condition.trim() || "Good",
      estimated_price: price,
      generated_description: form.description.trim(),
      tags,
      marketplace_data: buildDetails(editingItem, {
        description: form.description.trim(),
        listingPrice: price,
        size: form.size.trim(),
        tags,
        platform: form.platform,
        listingStatus: currentStatus,
      }),
    };

    try {
      setSavingId(editingItem.id);
      await updateItem(editingItem.id, updates);
      addToast("Listing details saved.", "success");
      setEditingItem(null);
      setForm(null);
    } catch (saveError) {
      addToast(saveError instanceof Error ? saveError.message : "Could not save listing.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function setListingStatus(item: InventoryItem, status: ListingStatus) {
    try {
      setSavingId(item.id);
      await updateItem(item.id, {
        status: databaseStatusFor(status),
        marketplace_data: buildDetails(item, { listingStatus: status }),
      });
      addToast(`Moved to ${statusLabels[status].toLowerCase()}.`, "success");
    } catch (statusError) {
      addToast(statusError instanceof Error ? statusError.message : "Could not update listing status.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function duplicateListing(item: InventoryItem) {
    const details = getDetails(item);
    const now = new Date().toISOString();
    const duplicate: InventoryItemInsert = {
      user_id: item.user_id,
      image_url: item.image_url,
      item_name: `${item.item_name} copy`,
      brand: item.brand,
      category: item.category,
      color: item.color,
      condition: item.condition,
      estimated_price: item.estimated_price,
      price_low: item.price_low,
      price_high: item.price_high,
      demand_score: item.demand_score,
      generated_title: item.generated_title,
      generated_description: item.generated_description,
      tags: item.tags,
      status: "Draft",
      marketplace_data: {
        ...details,
        listingStatus: "draft",
        updatedAt: now,
      },
    };

    try {
      setSavingId(item.id);
      await createItem(duplicate);
      addToast("Draft duplicated.", "success");
    } catch (duplicateError) {
      addToast(duplicateError instanceof Error ? duplicateError.message : "Could not duplicate listing.", "error");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteDraft(item: InventoryItem) {
    const status = listingStatus(item);
    if (status === "listed" || status === "sold") {
      addToast("Only drafts can be deleted here.", "error");
      return;
    }

    try {
      setDeletingId(item.id);
      await deleteItem(item.id);
      addToast("Draft deleted.", "success");
    } catch (deleteError) {
      addToast(deleteError instanceof Error ? deleteError.message : "Could not delete draft.", "error");
    } finally {
      setDeletingId(null);
    }
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
                  Listings
                </p>
                <h1 className="mt-4 bg-transparent text-3xl font-semibold text-stone-950">
                  Get inventory ready to sell
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  A listing is the buyer-facing post for an inventory item. Review the title, photos, price, and platform before marking it ready.
                </p>
              </div>
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800"
              >
                <PackageOpen size={16} />
                Add inventory item
              </Link>
            </section>

            {loading ? (
              <div className="flex min-h-[22rem] items-center justify-center rounded-[1.5rem] border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 text-sm font-semibold text-stone-600">
                  <Loader2 size={18} className="animate-spin" />
                  Loading listings
                </div>
              </div>
            ) : error ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} />
                  <div>
                    <h2 className="font-semibold">Listings could not load</h2>
                    <p className="mt-1">{error}</p>
                    <button
                      type="button"
                      onClick={retry}
                      className="mt-4 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-8 text-center shadow-sm">
                <PackageOpen size={34} className="mx-auto text-stone-400" />
                <h2 className="mt-4 text-xl font-semibold text-stone-950">No listings yet</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-600">
                  Create a listing from inventory by adding your first item, then come back here to review it before posting.
                </p>
                <Link
                  href="/inventory"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
                >
                  Add item
                </Link>
              </div>
            ) : (
              <>
                <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {sections.map((section) => (
                    <div key={section.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                      <p className="text-xs font-medium text-stone-500">{section.title}</p>
                      <p className="mt-2 text-2xl font-semibold text-stone-950">{groupedItems[section.id].length}</p>
                    </div>
                  ))}
                </section>

                <section className="space-y-5">
                  {sections.map((section) => (
                    <div key={section.id} className="rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 border-b border-stone-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-stone-950">{section.title}</h2>
                          <p className="mt-1 text-sm text-stone-500">{section.helper}</p>
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                          {groupedItems[section.id].length} {groupedItems[section.id].length === 1 ? "item" : "items"}
                        </span>
                      </div>

                      {groupedItems[section.id].length === 0 ? (
                        <p className="py-6 text-sm text-stone-500">Nothing here right now.</p>
                      ) : (
                        <div className="grid gap-3 pt-4 lg:grid-cols-2">
                          {groupedItems[section.id].map((item) => {
                            const details = getDetails(item);
                            const status = listingStatus(item);
                            const price = listingPrice(item, details);
                            const platform = stringValue(details, "platform") || "Depop";
                            const lastUpdated = stringValue(details, "updatedAt") || item.created_at;
                            const busy = savingId === item.id || deletingId === item.id;

                            return (
                              <article key={item.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
                                <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr]">
                                  <div className="relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-white">
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
                                        <p className="mt-1 text-sm font-semibold text-stone-800">{formatMoney(price)}</p>
                                      </div>
                                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>
                                        {statusNote(item, status)}
                                      </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                                      <span>{platform}</span>
                                      <span>Updated {formatDate(lastUpdated)}</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditing(item)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
                                      >
                                        <Edit3 size={14} />
                                        Edit
                                      </button>
                                      {(status === "draft" || status === "needs_attention") && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => setListingStatus(item, "ready")}
                                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 disabled:opacity-60"
                                        >
                                          <CheckCircle2 size={14} />
                                          Mark ready
                                        </button>
                                      )}
                                      {status !== "listed" && status !== "sold" && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => setListingStatus(item, "listed")}
                                          className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                                        >
                                          <Send size={14} />
                                          Mark listed
                                        </button>
                                      )}
                                      {status === "listed" && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => setListingStatus(item, "sold")}
                                          className="inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                                        >
                                          Mark sold
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => duplicateListing(item)}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-stone-100 disabled:opacity-60"
                                      >
                                        <CopyPlus size={14} />
                                        Duplicate
                                      </button>
                                      {status !== "listed" && status !== "sold" && (
                                        <button
                                          type="button"
                                          disabled={busy}
                                          onClick={() => deleteDraft(item)}
                                          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 disabled:opacity-60"
                                        >
                                          <Trash2 size={14} />
                                          Delete draft
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </section>

                {visibleCount === 0 && (
                  <p className="mt-6 text-sm text-stone-500">Sold items are saved in inventory, but this page focuses on listings you can still act on.</p>
                )}
              </>
            )}
          </div>
        </main>

        {editingItem && form && (
          <div className="fixed inset-0 z-50 flex items-end bg-stone-950/30 px-4 py-4 sm:items-center sm:justify-center">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-xl">
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-stone-950">Edit listing</h2>
                  <p className="mt-1 text-sm text-stone-500">Make the buyer-facing details clear before posting.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setForm(null);
                  }}
                  className="rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-stone-700"
                >
                  Close
                </button>
              </div>

              <form onSubmit={saveListing} className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Title
                  <input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                    placeholder="Vintage denim jacket"
                  />
                </label>

                <label className="grid gap-2 text-sm font-semibold text-stone-800">
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={4}
                    className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                    placeholder="Mention condition, fit, flaws, and anything a buyer should know."
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Price
                    <input
                      value={form.price}
                      onChange={(event) => setForm({ ...form, price: event.target.value })}
                      inputMode="decimal"
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                      placeholder="45"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Platform
                    <select
                      value={form.platform}
                      onChange={(event) => setForm({ ...form, platform: event.target.value as Platform })}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                    >
                      {platforms.map((platform) => (
                        <option key={platform}>{platform}</option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Category
                    <input
                      value={form.category}
                      onChange={(event) => setForm({ ...form, category: event.target.value })}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                      placeholder="Jackets"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Condition
                    <input
                      value={form.condition}
                      onChange={(event) => setForm({ ...form, condition: event.target.value })}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                      placeholder="Good"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Size
                    <input
                      value={form.size}
                      onChange={(event) => setForm({ ...form, size: event.target.value })}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                      placeholder="M"
                    />
                  </label>

                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    Tags
                    <input
                      value={form.tags}
                      onChange={(event) => setForm({ ...form, tags: event.target.value })}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-stone-400"
                      placeholder="streetwear, vintage, denim"
                    />
                  </label>
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setForm(null);
                    }}
                    className="rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingId === editingItem.id}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
                  >
                    {savingId === editingItem.id && <Loader2 size={16} className="animate-spin" />}
                    Save listing
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
