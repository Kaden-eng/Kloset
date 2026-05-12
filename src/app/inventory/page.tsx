"use client";

import { useMemo, useState } from "react";
import Header from "@/components/Header";
import ProtectedPage from "@/components/ProtectedPage";
import { useInventoryItems, useDatabase } from "@/hooks/useDatabase";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ToastProvider";
import { aiService, type AIAnalysisResult } from "@/lib/aiService";

const statusMap = ["All", "Draft", "Listed", "Sold"];
const sortOptions = [
  { id: "newest", label: "Newest" },
  { id: "oldest", label: "Oldest" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "price-asc", label: "Price: Low to High" },
];

export default function InventoryPage() {
  const { items: inventory, loading, error, updateItem, refresh } = useInventoryItems();
  const db = useDatabase();
  const { session } = useSupabase();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Ready to upload");
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());

  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        const query = search.toLowerCase();
        const matchesQuery =
          item.item_name.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query);
        const matchesStatus = statusFilter === "All" || item.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        if (sortKey === "newest") {
          return Number(new Date(b.created_at).getTime()) - Number(new Date(a.created_at).getTime());
        }
        if (sortKey === "oldest") {
          return Number(new Date(a.created_at).getTime()) - Number(new Date(b.created_at).getTime());
        }
        if (sortKey === "price-desc") {
          return (b.estimated_price || 0) - (a.estimated_price || 0);
        }
        return (a.estimated_price || 0) - (b.estimated_price || 0);
      });
  }, [inventory, search, statusFilter, sortKey]);

  const handleStatusUpdate = async (id: number, status: string) => {
    if (updatingIds.has(id)) return;

    setUpdatingIds((prev) => new Set(prev).add(id));
    addToast(`Updating item status to ${status}...`, "info", 2500);

    try {
      await updateItem(id, { status });
      addToast(`Item status updated to ${status}`, "success");
    } catch (err) {
      console.error("Status update failed", err);
      const message = err instanceof Error ? err.message : "Failed to update item status.";
      addToast(message, "error");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) {
      console.log("Upload cancelled: no file or no session");
      setUploadProgress("Ready to upload");
      return;
    }

    console.log("Starting upload for file:", file.name, "size:", file.size);
    setUploading(true);
    setUploadProgress("Preparing upload...");

    const uploadTimeout = setTimeout(() => {
      console.error("Upload timeout after 30 seconds");
      setUploading(false);
      setUploadProgress("Upload timed out. Please try again.");
      addToast("Upload timed out. Please try again.", "error");
    }, 30000);

    try {
      setUploadProgress("Uploading image...");
      console.log("Step 1: Uploading image to Supabase Storage");

      const imageUrl = await Promise.race([
        db.uploadInventoryImage(file, session.user.id, file.name),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Image upload timeout")), 15000)
        ),
      ]);

      console.log("Image uploaded successfully:", imageUrl);
      setUploadProgress("Analyzing item with AI...");

      console.log("Step 2: Starting AI analysis");
      const analysis = await Promise.race([
        aiService.analyzeItem(file),
        new Promise<AIAnalysisResult>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timeout")), 10000)
        ),
      ]);

      console.log("AI analysis completed:", analysis.brand, analysis.category);
      setUploadProgress("Saving analysis results...");

      console.log("Step 3: Creating inventory item in database");
      const newItem = await db.createInventoryItem({
        user_id: session.user.id,
        item_name: analysis.generated_title || `${analysis.brand} ${analysis.category}`,
        brand: analysis.brand,
        category: analysis.category,
        image_url: imageUrl,
        estimated_price: analysis.estimated_price,
        price_low: analysis.price_low,
        price_high: analysis.price_high,
        condition: analysis.condition,
        demand_score: analysis.demand_score,
        status: "Draft",
        tags: analysis.tags,
        generated_title: analysis.generated_title,
        generated_description: analysis.generated_description,
      });

      console.log("Inventory item created with ID:", newItem.id);
      console.log("Step 4: Creating marketplace analytics");

      await Promise.all(
        analysis.marketplaces.map(async (analytics) => {
          console.log(`Creating analytics for ${analytics.platform}`);
          return db.createMarketplaceAnalytics({
            inventory_item_id: newItem.id,
            platform: analytics.platform,
            estimated_sale_price: analytics.estimated_sale_price,
            estimated_sell_speed: analytics.estimated_sell_speed,
            fee_estimate: analytics.fee_estimate,
            demand_rating: analytics.demand_rating,
          });
        })
      );

      console.log("Step 5: Saving analysis for future reference");
      await aiService.saveAnalysis(session.user.id, analysis);

      console.log("Upload completed successfully");
      clearTimeout(uploadTimeout);
      addToast("Item analyzed and added to inventory successfully!", "success");
      setUploadProgress("Analysis complete. Draft saved.");
      event.target.value = "";
    } catch (err) {
      console.error("Upload failed with error:", err);
      clearTimeout(uploadTimeout);
      setUploadProgress("Upload failed. Try again.");

      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          addToast("Upload timed out. Please check your connection and try again.", "error");
        } else if (err.message.includes("storage")) {
          addToast("Storage upload failed. Please try again.", "error");
        } else if (err.message.includes("analysis")) {
          addToast("AI analysis failed. Please try again.", "error");
        } else {
          addToast(`Upload failed: ${err.message}`, "error");
        }
      } else {
        addToast("Upload failed. Please try again.", "error");
      }
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress((current) => current.includes("failed") ? "Ready to upload" : current);
      }, 500);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const drafts = inventory.filter((item) => item.status === "Draft");
    const listed = inventory.filter((item) => item.status === "Listed");
    const sold = inventory.filter((item) => item.status === "Sold");
    const trendingCategory = inventory.length > 0
      ? Object.entries(inventory.reduce((acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"
      : "N/A";

    return {
      totalValue,
      drafts,
      listed,
      sold,
      trendingCategory,
      draftValue: drafts.reduce((sum, item) => sum + (item.estimated_price || 0), 0),
      listedValue: listed.reduce((sum, item) => sum + (item.estimated_price || 0), 0),
    };
  }, [inventory]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <Header />
        <main className="px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {/* Hero Section */}
            <section className="mb-16">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Resale workspace</p>
              <h1 className="mt-6 text-4xl font-semibold text-stone-900">Professional inventory management</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
                Advanced reseller platform with AI-powered pricing, marketplace insights, and real-time inventory tracking.
              </p>
            </section>

            {/* Statistics Dashboard */}
            <section className="mb-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-4xl border border-stone-200 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Total items</p>
                <p className="mt-4 text-4xl font-semibold text-stone-900">{inventory.length}</p>
                <p className="mt-2 text-xs text-stone-500">In your inventory</p>
              </div>
              <div className="rounded-4xl border border-stone-200 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Total value</p>
                <p className="mt-4 text-3xl font-semibold text-stone-900">${(stats.totalValue / 1000).toFixed(1)}k</p>
                <p className="mt-2 text-xs text-stone-500">Estimated portfolio</p>
              </div>
              <div className="rounded-4xl border border-stone-200 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Active listings</p>
                <p className="mt-4 text-4xl font-semibold text-stone-900">{stats.listed.length}</p>
                <p className="mt-2 text-xs text-stone-500">${(stats.listedValue / 1000).toFixed(1)}k value</p>
              </div>
              <div className="rounded-4xl border border-stone-200 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Drafts</p>
                <p className="mt-4 text-4xl font-semibold text-stone-900">{stats.drafts.length}</p>
                <p className="mt-2 text-xs text-stone-500">${(stats.draftValue / 1000).toFixed(1)}k awaiting</p>
              </div>
              <div className="rounded-4xl border border-stone-200 bg-white p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Sold</p>
                <p className="mt-4 text-4xl font-semibold text-stone-900">{stats.sold.length}</p>
                <p className="mt-2 text-xs text-stone-500">Completed sales</p>
              </div>
            </section>

            {/* Upload + Quick Actions Section */}
            <section className="mb-16 grid gap-6 lg:grid-cols-2">
              <div className="rounded-4xl border border-stone-200 bg-white p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Upload new item</p>
                <h2 className="mt-3 text-xl font-semibold text-stone-900">Add to inventory</h2>
                <p className="mt-3 text-sm text-stone-600">Use AI to instantly analyze pricing, condition, and marketplace demand.</p>
                <div className="mt-6 flex flex-col gap-3">
                  <label className={`rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 px-6 py-8 text-center transition cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-stone-900 hover:bg-stone-100'
                  }`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <svg className="mx-auto h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold text-stone-900">{uploading ? 'Processing...' : 'Click to upload or drag'}</p>
                    <p className="text-xs text-stone-500">PNG, JPG up to 10MB</p>
                  </label>
                  {uploading && (
                    <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                      {uploadProgress}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-4xl border border-stone-200 bg-white p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Portfolio snapshot</p>
                <h2 className="mt-3 text-xl font-semibold text-stone-900">Your resale metrics</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Trending category</span>
                    <span className="font-semibold text-stone-900">{stats.trendingCategory}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Avg. item value</span>
                    <span className="font-semibold text-stone-900">${inventory.length > 0 ? Math.round(stats.totalValue / inventory.length) : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Listed percentage</span>
                    <span className="font-semibold text-stone-900">{inventory.length > 0 ? Math.round((stats.listed.length / inventory.length) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Toolbar */}
            <section className="mb-8 rounded-4xl border border-stone-200 bg-white p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="inventory-search-toolbar">Search inventory</label>
                  <input
                    id="inventory-search-toolbar"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, brand, or category..."
                    className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition hover:border-stone-300 focus:border-stone-400 focus:bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition hover:border-stone-300 focus:border-stone-400 focus:bg-white"
                  >
                    {statusMap.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition hover:border-stone-300 focus:border-stone-400 focus:bg-white"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setView("grid")}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                        view === "grid" ? "bg-stone-900 text-white" : "border border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                        view === "list" ? "bg-stone-900 text-white" : "border border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
              {filteredInventory.length > 0 && (
                <p className="mt-4 text-xs text-stone-500">Showing {filteredInventory.length} of {inventory.length} items</p>
              )}
            </section>

            {/* Inventory Display */}
            <section>
              {loading ? (
                <div className="rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-16 text-center">
                  <p className="text-stone-500">Loading your inventory...</p>
                </div>
              ) : error ? (
                <div className="rounded-4xl border border-red-200 bg-red-50 p-16 text-center text-red-700">
                  <p className="font-semibold">Error loading inventory</p>
                  <p className="mt-3 text-sm text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="mt-6 inline-flex items-center justify-center rounded-3xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Retry loading inventory
                  </button>
                </div>
              ) : filteredInventory.length === 0 && inventory.length === 0 ? (
                <div className="rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto h-16 w-16 text-stone-300 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900">Start your resale empire</h3>
                    <p className="mt-2 text-sm text-stone-600">
                      Upload your first item to begin analyzing pricing, managing listings, and tracking marketplace demand.
                    </p>
                    <div className="mt-6">
                      <label htmlFor="empty-upload-hero" className="inline-flex items-center gap-2 rounded-3xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Upload first item
                      </label>
                      <input
                        id="empty-upload-hero"
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </div>
                  </div>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-12 text-center text-stone-500">
                  <p className="font-medium">No items match your filters</p>
                  <p className="mt-2 text-sm">Try adjusting your search, status, or sort options</p>
                </div>
              ) : view === "grid" ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredInventory.map((item) => (
                    <article key={item.id} className="group flex flex-col rounded-4xl border border-stone-200 bg-white overflow-hidden transition hover:border-stone-300 hover:shadow-lg">
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover transition group-hover:scale-105" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
                        <div className="absolute top-3 right-3">
                          <span className={`rounded-full px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.22em] ${
                            item.status === 'Listed' ? 'bg-green-100 text-green-800' :
                            item.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                            'bg-stone-900 text-white'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{item.brand}</p>
                          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-stone-900">{item.item_name}</h3>
                          <p className="mt-2 text-xs text-stone-500">{item.category}</p>
                          {item.created_at && (
                            <p className="mt-1 text-xs text-stone-400">Added {formatDate(item.created_at)}</p>
                          )}
                        </div>
                        <div className="mt-4 border-t border-stone-100 pt-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-stone-500">Estimated value</p>
                              <p className="mt-1 text-lg font-semibold text-stone-900">
                                ${item.estimated_price?.toLocaleString() || 'TBD'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "Listed")}
                              disabled={updatingIds.has(item.id)}
                              className="rounded-full border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:bg-stone-900 hover:text-white hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingIds.has(item.id) ? "…" : item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "List"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-4xl border border-stone-200 bg-white shadow-sm">
                  <table className="w-full border-collapse text-left text-sm text-stone-700">
                    <thead className="border-b border-stone-200 bg-stone-50">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-stone-500">Item</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Brand</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Category</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Status</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Value</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Added</th>
                        <th className="px-6 py-4 font-semibold text-stone-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventory.map((item, idx) => (
                        <tr key={item.id} className={`border-t border-stone-200 transition hover:bg-stone-50 ${idx % 2 === 0 ? "bg-white" : "bg-stone-50"}`}>
                          <td className="px-6 py-4 font-semibold text-stone-900">{item.item_name}</td>
                          <td className="px-6 py-4">{item.brand}</td>
                          <td className="px-6 py-4 text-sm text-stone-600">{item.category}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                              item.status === "Listed"
                                ? "bg-green-100 text-green-800"
                                : item.status === "Sold"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-stone-900 text-white"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-stone-900">${item.estimated_price?.toLocaleString() || 'TBD'}</td>
                          <td className="px-6 py-4 text-sm text-stone-500">{item.created_at ? formatDate(item.created_at) : '-'}</td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "Listed")}
                              disabled={updatingIds.has(item.id)}
                              className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-700 transition hover:bg-stone-900 hover:text-white hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingIds.has(item.id) ? "…" : item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "List"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
