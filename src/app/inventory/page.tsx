"use client";

import { useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useDatabase, useInventoryItems } from "@/hooks/useDatabase";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { aiService, type AIAnalysisResult } from "@/lib/aiService";
import { getPricingIntelligence, type PricingIntelligence } from "@/lib/pricing";
import type { Database, Json } from "@/types/supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type ItemStatus = "draft" | "listed" | "sold";
type DatabaseStatus = "Draft" | "Listed" | "Sold";
type ViewMode = "grid" | "list";

type InventoryDetails = {
  size: string;
  purchasePrice: number | null;
  listingPrice: number | null;
  priceLow: number | null;
  priceHigh: number | null;
  platform: string;
  notes: string;
  description: string;
  tags: string[];
  imageUrls: string[];
};

type ItemForm = {
  title: string;
  description: string;
  brand: string;
  category: string;
  size: string;
  condition: string;
  purchasePrice: string;
  listingPrice: string;
  priceLow: string;
  priceHigh: string;
  platform: string;
  status: ItemStatus;
  notes: string;
  tags: string;
};

const emptyForm: ItemForm = {
  title: "",
  description: "",
  brand: "",
  category: "",
  size: "",
  condition: "Good",
  purchasePrice: "",
  listingPrice: "",
  priceLow: "",
  priceHigh: "",
  platform: "Depop",
  status: "draft",
  notes: "",
  tags: "",
};

const statusOptions: Array<{ value: "all" | ItemStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "listed", label: "Listed" },
  { value: "sold", label: "Sold" },
];

const fieldClass =
  "w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition focus:border-stone-500 focus:bg-white";

type UploadedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type ListingSuggestion = {
  title: string;
  brand: string;
  category: string;
  condition: string;
  tags: string[];
  priceLow: number;
  priceHigh: number;
  price: number;
  description: string;
};

function normalizeStatus(status?: string | null): ItemStatus {
  const normalized = (status ?? "draft").toLowerCase();
  if (normalized === "listed" || normalized === "sold") return normalized;
  return "draft";
}

function money(value: number | null | undefined) {
  if (!value) return "$0";
  return `$${value.toLocaleString()}`;
}

function parsePrice(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function tagList(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function tagsToText(tags: string[] | null | undefined) {
  return (tags ?? []).join(", ");
}

function safePrice(value: number | null | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function buildFallbackSuggestion(file: File, form: ItemForm): ListingSuggestion {
  const fileName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const category = form.category.trim() || "Apparel";
  const brand = form.brand.trim() || "Unknown";
  const condition = form.condition || "Good";
  const basePrice = category === "Outerwear" ? 58 : category === "Footwear" ? 72 : category === "Bottoms" ? 42 : 32;
  const conditionFactor = condition === "New" ? 1.15 : condition === "Like New" ? 1.05 : condition === "Fair" ? 0.75 : 0.9;
  const price = Math.round(basePrice * conditionFactor);
  const priceLow = Math.max(12, Math.round(price * 0.8));
  const priceHigh = Math.max(priceLow + 8, Math.round(price * 1.15));
  const title = form.title.trim() || `${brand !== "Unknown" ? `${brand} ` : ""}${fileName || category}`.trim();

  return {
    title,
    brand,
    category,
    condition,
    tags: [category, condition, "resale"].filter(Boolean),
    priceLow,
    priceHigh,
    price,
    description: `${title}. ${condition} condition. Add measurements, fabric details, and any flaws before posting.`,
  };
}

function suggestionFromAnalysis(analysis: AIAnalysisResult, form: ItemForm): ListingSuggestion {
  const title = form.title.trim() || analysis.generated_title || `${analysis.brand} ${analysis.category}`;
  const priceLow = safePrice(analysis.price_low, 18);
  const priceHigh = Math.max(priceLow + 8, safePrice(analysis.price_high, priceLow + 18));
  const conservativePrice = Math.min(
    priceHigh,
    Math.max(priceLow, safePrice(analysis.recommended_quick_sale, Math.round((priceLow + priceHigh) / 2)))
  );

  return {
    title,
    brand: form.brand.trim() || analysis.brand,
    category: form.category.trim() || analysis.category,
    condition: form.condition || analysis.condition || "Good",
    tags: analysis.tags.slice(0, 6),
    priceLow,
    priceHigh,
    price: conservativePrice,
    description:
      form.description.trim() ||
      analysis.generated_description ||
      `${title}. Review the condition, measurements, and any flaws before listing.`,
  };
}

function readDetails(item: InventoryItem): InventoryDetails {
  const data = item.marketplace_data && typeof item.marketplace_data === "object" && !Array.isArray(item.marketplace_data)
    ? item.marketplace_data as Record<string, Json>
    : {};

  const numberOrNull = (value: Json | undefined) => typeof value === "number" ? value : null;
  const stringOrEmpty = (value: Json | undefined) => typeof value === "string" ? value : "";

  return {
    size: stringOrEmpty(data.size),
    purchasePrice: numberOrNull(data.purchasePrice) ?? item.price_low ?? null,
    listingPrice: numberOrNull(data.listingPrice) ?? item.estimated_price ?? null,
    priceLow: numberOrNull(data.priceLow) ?? item.price_low ?? null,
    priceHigh: numberOrNull(data.priceHigh) ?? item.price_high ?? null,
    platform: stringOrEmpty(data.platform),
    notes: stringOrEmpty(data.notes),
    description: stringOrEmpty(data.description) || item.generated_description || "",
    tags: Array.isArray(data.tags) ? data.tags.filter((tag): tag is string => typeof tag === "string") : item.tags,
    imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.filter((url): url is string => typeof url === "string") : [],
  };
}

function statusLabel(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toDatabaseStatus(status: ItemStatus): DatabaseStatus {
  if (status === "listed") return "Listed";
  if (status === "sold") return "Sold";
  return "Draft";
}

function statusClass(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  if (normalized === "sold") return "bg-stone-950 text-white";
  if (normalized === "listed") return "bg-[#b7ff32] text-stone-950";
  return "bg-stone-100 text-stone-700";
}

function pricingForItem(item: InventoryItem) {
  const details = readDetails(item);
  return getPricingIntelligence({
    title: item.item_name,
    brand: item.brand,
    category: item.category,
    condition: item.condition,
    listingPrice: details.listingPrice,
    priceLow: details.priceLow,
    priceHigh: details.priceHigh,
    tags: details.tags,
  });
}

function PricingSnapshot({ pricing, compact = false }: { pricing: PricingIntelligence; compact?: boolean }) {
  const comps = compact ? pricing.comps.slice(0, 2) : pricing.comps.slice(0, 3);

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {[
          ["Quick-sale price", pricing.quickSalePrice],
          ["Suggested price", pricing.marketPrice],
          ["Higher-price option", pricing.maxProfitPrice],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white px-3 py-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-stone-950">{money(value as number)}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2 text-xs text-stone-600 sm:flex-row sm:items-center sm:justify-between">
        <span>Usually sells between {money(pricing.recentSoldLow)}-{money(pricing.recentSoldHigh)}</span>
        <span className="font-semibold text-stone-800">{pricing.confidenceLabel} confidence</span>
      </div>
      {!compact ? (
        <p className="mt-2 text-xs leading-5 text-stone-500">
          Quick-sale is a lower price for a faster sale. Higher-price option may take longer but can leave more room for profit.
        </p>
      ) : null}
      <div className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {comps.map((comp) => (
          <div key={comp.id} className="grid gap-1 px-3 py-2 text-xs sm:grid-cols-[1fr_auto]">
            <div>
              <p className="font-semibold text-stone-900">{comp.platform} sold</p>
              <p className="text-stone-500">{comp.conditionNote} - {comp.soldDate}</p>
            </div>
            <p className="font-semibold text-stone-950 sm:text-right">{money(comp.soldPrice)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { items: inventory, loading, error, createItem, updateItem, deleteItem, refresh } = useInventoryItems();
  const db = useDatabase();
  const { session } = useSupabase();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [suggestion, setSuggestion] = useState<ListingSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ItemStatus>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filteredInventory = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inventory.filter((item) => {
      const details = readDetails(item);
      const matchesStatus = statusFilter === "all" || normalizeStatus(item.status) === statusFilter;
      const matchesSearch =
        !query ||
        [item.item_name, item.brand, item.category, item.condition, details.size, details.platform]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [inventory, search, statusFilter]);

  const resetForm = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setForm(emptyForm);
    setPhotos([]);
    setSuggestion(null);
    setSuggesting(false);
    setEditingItem(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateForm = (field: keyof ItemForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        addToast(`${file.name} is not an image.`, "error");
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        addToast(`${file.name} is over 10MB.`, "error");
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    const newPhotos = validFiles.slice(0, Math.max(0, 6 - photos.length)).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPhotos((current) => [...current, ...newPhotos]);

    if (!editingItem && newPhotos[0]) {
      await generateSuggestions(newPhotos[0].file);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos((current) => {
      const removed = current.find((photo) => photo.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((photo) => photo.id !== id);
    });
  };

  const movePhoto = (id: string, direction: -1 | 1) => {
    setPhotos((current) => {
      const index = current.findIndex((photo) => photo.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const [photo] = next.splice(index, 1);
      next.splice(nextIndex, 0, photo);
      return next;
    });
  };

  const applySuggestion = (nextSuggestion: ListingSuggestion) => {
    setForm((current) => ({
      ...current,
      title: current.title.trim() || nextSuggestion.title,
      description: current.description.trim() || nextSuggestion.description,
      brand: current.brand.trim() || nextSuggestion.brand,
      category: current.category.trim() || nextSuggestion.category,
      condition: current.condition || nextSuggestion.condition,
      listingPrice: current.listingPrice || String(nextSuggestion.price),
      priceLow: current.priceLow || String(nextSuggestion.priceLow),
      priceHigh: current.priceHigh || String(nextSuggestion.priceHigh),
      tags: current.tags.trim() || tagsToText(nextSuggestion.tags),
      status: "draft",
    }));
  };

  const generateSuggestions = async (file = photos[0]?.file) => {
    if (!file) {
      addToast("Add a photo before generating suggestions.", "error");
      return;
    }

    setSuggesting(true);
    setSuggestion(null);

    try {
      const analysis = await Promise.race([
        aiService.analyzeItem(file),
        new Promise<AIAnalysisResult>((_, reject) => {
          window.setTimeout(() => reject(new Error("Suggestion request timed out")), 8000);
        }),
      ]);
      const nextSuggestion = suggestionFromAnalysis(analysis, form);
      setSuggestion(nextSuggestion);
      applySuggestion(nextSuggestion);
      addToast("Listing suggestions added. Review before saving.", "success");
    } catch {
      const fallback = buildFallbackSuggestion(file, form);
      setSuggestion(fallback);
      applySuggestion(fallback);
      addToast("Suggestions were limited, so Kloset made a conservative draft.", "info");
    } finally {
      setSuggesting(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    const details = readDetails(item);
    setEditingItem(item);
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setSuggestion(null);
    setForm({
      title: item.item_name,
      description: details.description,
      brand: item.brand,
      category: item.category,
      size: details.size,
      condition: item.condition,
      purchasePrice: details.purchasePrice ? String(details.purchasePrice) : "",
      listingPrice: details.listingPrice ? String(details.listingPrice) : "",
      priceLow: details.priceLow ? String(details.priceLow) : "",
      priceHigh: details.priceHigh ? String(details.priceHigh) : "",
      platform: details.platform || "Depop",
      status: normalizeStatus(item.status),
      notes: details.notes,
      tags: tagsToText(details.tags),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.user?.id) {
      addToast("Please sign in before saving inventory.", "error");
      return;
    }

    if (!form.title.trim()) {
      addToast("Add an item title before saving.", "error");
      return;
    }

    if (!editingItem && photos.length === 0) {
      addToast("Add at least one item photo before saving.", "error");
      return;
    }

    setSaving(true);

    try {
      let imageUrls = editingItem ? readDetails(editingItem).imageUrls : [];
      let imageUrl = editingItem?.image_url ?? null;
      if (photos.length > 0) {
        imageUrls = await Promise.all(
          photos.map((photo) => db.uploadInventoryImage(photo.file, session.user.id, photo.file.name))
        );
        imageUrl = imageUrls[0] ?? imageUrl;
      }

      const purchasePrice = parsePrice(form.purchasePrice);
      const listingPrice = parsePrice(form.listingPrice);
      const priceLow = parsePrice(form.priceLow) ?? listingPrice;
      const priceHigh = parsePrice(form.priceHigh) ?? listingPrice;
      const tags = tagList(form.tags);
      const marketplaceData: InventoryDetails = {
        size: form.size.trim(),
        purchasePrice,
        listingPrice,
        priceLow,
        priceHigh,
        platform: form.platform.trim(),
        notes: form.notes.trim(),
        description: form.description.trim(),
        tags,
        imageUrls,
      };

      const payload = {
        item_name: form.title.trim(),
        brand: form.brand.trim() || "Unknown",
        category: form.category.trim() || "Uncategorized",
        condition: form.condition.trim() || "Good",
        image_url: imageUrl,
        estimated_price: listingPrice,
        price_low: priceLow,
        price_high: priceHigh,
        status: editingItem ? toDatabaseStatus(form.status) : "Draft",
        marketplace_data: marketplaceData as unknown as Json,
        generated_title: form.title.trim(),
        generated_description: form.description.trim() || form.notes.trim() || null,
        tags,
        demand_score: 0,
      };

      if (editingItem) {
        await updateItem(editingItem.id, payload);
        addToast("Inventory item updated.", "success");
      } else {
        await createItem({ ...payload, user_id: session.user.id });
        addToast("Draft listing saved to inventory.", "success");
      }

      resetForm();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Inventory item could not be saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete "${item.item_name}" from inventory?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await deleteItem(item.id);
      if (editingItem?.id === item.id) resetForm();
      addToast("Inventory item deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Inventory item could not be deleted.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const summary = useMemo(() => {
    return inventory.reduce(
      (totals, item) => {
        const details = readDetails(item);
        const status = normalizeStatus(item.status);

        totals.total += 1;
        if (status === "listed") totals.listed += 1;
        if (status === "sold") totals.sold += 1;
        totals.value += details.listingPrice ?? 0;
        return totals;
      },
      { total: 0, listed: 0, sold: 0, value: 0 }
    );
  }, [inventory]);

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-10 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">
                  Inventory
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-stone-950">
                  Add and manage your items
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                  Inventory means the items you own and may want to sell. Save photos, prices, platform, status, and notes here before making a listing.
                </p>
              </div>
            </section>

            <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Total items", summary.total],
                ["Active listings", summary.listed],
                ["Sold items", summary.sold],
                ["Inventory value", money(summary.value)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.35rem] border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">{label}</p>
                  <p className="mt-4 text-3xl font-semibold text-stone-950">{value}</p>
                </div>
              ))}
            </section>

            <section className="mb-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">
                      {editingItem ? "Edit item" : "Listing draft"}
                    </p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">
                      {editingItem ? "Update item details" : "Create a draft listing"}
                    </h2>
                  </div>
                  {editingItem ? (
                    <button type="button" onClick={resetForm} className="text-sm font-semibold text-stone-500 transition hover:text-stone-950">
                      Cancel
                    </button>
                  ) : null}
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <label htmlFor="item-image" className="block text-sm font-medium text-stone-700">Photos</label>
                        <p className="mt-1 text-xs text-stone-500">Add up to 6 photos. Put the best one first.</p>
                      </div>
                      <input
                        ref={fileInputRef}
                        id="item-image"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-full file:border-0 file:bg-stone-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white sm:max-w-xs"
                      />
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                          <div className="aspect-square bg-stone-100">
                            <img src={photo.previewUrl} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-2 px-3 py-2">
                            <span className="text-xs font-medium text-stone-500">{index === 0 ? "Main photo" : `Photo ${index + 1}`}</span>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => movePhoto(photo.id, -1)} disabled={index === 0} className="rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-600 disabled:opacity-40">Up</button>
                              <button type="button" onClick={() => movePhoto(photo.id, 1)} disabled={index === photos.length - 1} className="rounded-full border border-stone-200 px-2 py-1 text-xs text-stone-600 disabled:opacity-40">Down</button>
                              <button type="button" onClick={() => removePhoto(photo.id)} className="rounded-full border border-red-200 px-2 py-1 text-xs font-semibold text-red-700">Remove</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {photos.length === 0 && !editingItem ? (
                        <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-500 sm:col-span-3">
                          Upload photos to preview them here and generate a practical draft.
                        </div>
                      ) : null}
                      {photos.length === 0 && editingItem?.image_url ? (
                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                          <div className="aspect-square bg-stone-100">
                            <img src={editingItem.image_url} alt={editingItem.item_name} className="h-full w-full object-cover" />
                          </div>
                          <p className="px-3 py-2 text-xs text-stone-500">Current main photo</p>
                        </div>
                      ) : null}
                    </div>
                    {!editingItem ? (
                      <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-stone-950">Smart suggestions</p>
                          <p className="mt-1 text-xs text-stone-500">Kloset drafts conservative details from the photo name and anything you type.</p>
                        </div>
                        <button type="button" onClick={() => generateSuggestions()} disabled={suggesting || photos.length === 0} className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50">
                          {suggesting ? "Drafting..." : suggestion ? "Refresh suggestions" : "Generate suggestions"}
                        </button>
                      </div>
                    ) : null}
                    {suggestion ? (
                      <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm">
                        <p className="font-semibold text-stone-950">Suggested range: {money(suggestion.priceLow)} - {money(suggestion.priceHigh)}</p>
                        <p className="mt-1">Start around {money(suggestion.price)} if you want a realistic first listing price.</p>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-stone-700">Title</label>
                      <input id="title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} className={fieldClass} placeholder="Black wool coat" />
                    </div>
                    <div>
                      <label htmlFor="brand" className="block text-sm font-medium text-stone-700">Brand</label>
                      <input id="brand" value={form.brand} onChange={(event) => updateForm("brand", event.target.value)} className={fieldClass} placeholder="COS" />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-stone-700">Category</label>
                      <input id="category" value={form.category} onChange={(event) => updateForm("category", event.target.value)} className={fieldClass} placeholder="Coats" />
                    </div>
                    <div>
                      <label htmlFor="size" className="block text-sm font-medium text-stone-700">Size</label>
                      <input id="size" value={form.size} onChange={(event) => updateForm("size", event.target.value)} className={fieldClass} placeholder="Medium" />
                    </div>
                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-stone-700">Condition</label>
                      <select id="condition" value={form.condition} onChange={(event) => updateForm("condition", event.target.value)} className={fieldClass}>
                        {["New", "Like New", "Good", "Fair"].map((condition) => <option key={condition}>{condition}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="platform" className="block text-sm font-medium text-stone-700">Platform</label>
                      <input id="platform" value={form.platform} onChange={(event) => updateForm("platform", event.target.value)} className={fieldClass} placeholder="Depop" />
                    </div>
                    <div>
                      <label htmlFor="purchase-price" className="block text-sm font-medium text-stone-700">Purchase price</label>
                      <input id="purchase-price" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(event) => updateForm("purchasePrice", event.target.value)} className={fieldClass} placeholder="25" />
                    </div>
                    <div>
                      <label htmlFor="listing-price" className="block text-sm font-medium text-stone-700">Listing price</label>
                      <p className="mt-1 text-xs text-stone-500">The price buyers see first. You can adjust it later before posting.</p>
                      <input id="listing-price" type="number" min="0" step="0.01" value={form.listingPrice} onChange={(event) => updateForm("listingPrice", event.target.value)} className={fieldClass} placeholder="65" />
                    </div>
                    <div>
                      <label htmlFor="price-low" className="block text-sm font-medium text-stone-700">Quick-sale price</label>
                      <p className="mt-1 text-xs text-stone-500">A lower price that may help the item sell faster.</p>
                      <input id="price-low" type="number" min="0" step="0.01" value={form.priceLow} onChange={(event) => updateForm("priceLow", event.target.value)} className={fieldClass} placeholder="50" />
                    </div>
                    <div>
                      <label htmlFor="price-high" className="block text-sm font-medium text-stone-700">Higher-price option</label>
                      <p className="mt-1 text-xs text-stone-500">A higher price to try if you are willing to wait longer.</p>
                      <input id="price-high" type="number" min="0" step="0.01" value={form.priceHigh} onChange={(event) => updateForm("priceHigh", event.target.value)} className={fieldClass} placeholder="75" />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="tags" className="block text-sm font-medium text-stone-700">Tags</label>
                      <input id="tags" value={form.tags} onChange={(event) => updateForm("tags", event.target.value)} className={fieldClass} placeholder="wool, coat, minimal" />
                    </div>
                    {editingItem ? (
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-stone-700">Status</label>
                      <select id="status" value={form.status} onChange={(event) => updateForm("status", event.target.value)} className={fieldClass}>
                        <option value="draft">Draft</option>
                        <option value="listed">Listed</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>
                    ) : null}
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-stone-700">Description</label>
                    <textarea id="description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} className={`${fieldClass} min-h-28 resize-y`} placeholder="Describe the item, fit, condition, and any flaws." />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-stone-700">Notes</label>
                    <textarea id="notes" value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} className={`${fieldClass} min-h-24 resize-y`} placeholder="Flaws, measurements, or anything to remember." />
                  </div>

                  <button type="submit" disabled={saving} className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Saving..." : editingItem ? "Save changes" : "Add to inventory"}
                  </button>
                </div>
              </form>

              <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Saved inventory</p>
                    <h2 className="mt-2 text-xl font-semibold text-stone-950">Your items</h2>
                    <p className="mt-1 text-sm text-stone-500">These are the items saved to your workspace. Drafts are not posted yet.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setViewMode("grid")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "grid" ? "bg-stone-950 text-white" : "border border-stone-200 bg-stone-50 text-stone-700"}`}>Grid</button>
                    <button type="button" onClick={() => setViewMode("list")} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "list" ? "bg-stone-950 text-white" : "border border-stone-200 bg-stone-50 text-stone-700"}`}>List</button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_12rem]">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} className={fieldClass} placeholder="Search inventory" />
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | ItemStatus)} className={fieldClass}>
                    {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                  </select>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center text-sm text-stone-500">Loading inventory...</div>
                  ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                      <p>{error}</p>
                      <button type="button" onClick={refresh} className="mt-3 rounded-full bg-white px-4 py-2 font-semibold text-red-700">Retry</button>
                    </div>
                  ) : filteredInventory.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-8 text-center">
                      <p className="font-semibold text-stone-950">{inventory.length === 0 ? "No inventory yet" : "No items match your search"}</p>
                      <p className="mt-2 text-sm text-stone-500">{inventory.length === 0 ? "Add your first item with the form on this page. Start with one clear photo and a short title." : "Try a different search or status."}</p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredInventory.map((item) => {
                        const details = readDetails(item);
                        const pricing = pricingForItem(item);
                        return (
                          <article key={item.id} className="overflow-hidden rounded-[1.25rem] border border-stone-200 bg-white shadow-sm">
                            <div className="aspect-[4/3] bg-stone-100">
                              {item.image_url ? <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{item.brand}</p>
                                  <h3 className="mt-1 font-semibold text-stone-950">{item.item_name}</h3>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                              </div>
                              <p className="mt-3 text-sm text-stone-500">{item.category}{details.size ? ` - ${details.size}` : ""}</p>
                              <p className="mt-2 text-lg font-semibold text-stone-950">{money(details.listingPrice)}</p>
                              <PricingSnapshot pricing={pricing} compact />
                              <div className="mt-4 flex gap-2">
                                <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950">Edit</button>
                                <button type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60">
                                  {deletingId === item.id ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200">
                      {filteredInventory.map((item) => {
                        const details = readDetails(item);
                        const pricing = pricingForItem(item);
                        return (
                          <div key={item.id} className="grid gap-4 bg-white p-4 sm:grid-cols-[4rem_1fr_auto] sm:items-center">
                            <div className="aspect-square overflow-hidden rounded-xl bg-stone-100">
                              {item.image_url ? <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" /> : null}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold text-stone-950">{item.item_name}</h3>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>{statusLabel(item.status)}</span>
                              </div>
                              <p className="mt-1 text-sm text-stone-500">{item.brand} - {item.category}{details.size ? ` - ${details.size}` : ""}</p>
                              <p className="mt-1 text-sm font-semibold text-stone-950">{money(details.listingPrice)}</p>
                              <p className="mt-1 text-xs text-stone-500">Suggested price: {money(pricing.marketPrice)} - recent sale prices {money(pricing.recentSoldLow)}-{money(pricing.recentSoldHigh)}</p>
                            </div>
                            <div className="flex gap-2 sm:justify-end">
                              <button type="button" onClick={() => startEdit(item)} className="rounded-full border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-950 hover:text-stone-950">Edit</button>
                              <button type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id} className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60">
                                {deletingId === item.id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
