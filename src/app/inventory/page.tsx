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
  const { items: inventory, loading, error, updateItem } = useInventoryItems();
  const db = useDatabase();
  const { session } = useSupabase();
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortKey, setSortKey] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("Ready to upload");

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
    try {
      await updateItem(id, { status });
      addToast(`Item status updated to ${status}`, "success");
    } catch (err) {
      addToast("Failed to update item status", "error");
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) {
      console.log("Upload cancelled: no file or no session");
      return;
    }

    console.log("Starting upload for file:", file.name, "size:", file.size);
    setUploading(true);
    setUploadProgress("Preparing upload...");

    // Add timeout wrapper
    const uploadTimeout = setTimeout(() => {
      console.error("Upload timeout after 30 seconds");
      setUploading(false);
      setUploadProgress("Upload timed out. Please try again.");
      addToast("Upload timed out. Please try again.", "error");
    }, 30000);

    try {
      setUploadProgress("Uploading image...");
      console.log("Step 1: Uploading image to Supabase Storage");

      // Upload image with timeout
      const imageUrl = await Promise.race([
        db.uploadInventoryImage(file, session.user.id, file.name),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Image upload timeout")), 15000)
        )
      ]);

      console.log("Image uploaded successfully:", imageUrl);
      setUploadProgress("Analyzing item with AI...");

      console.log("Step 2: Starting AI analysis");
      // Analyze with AI and timeout
      const analysis = await Promise.race([
        aiService.analyzeItem(file),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timeout")), 10000)
        )
      ]);

      console.log("AI analysis completed:", analysis.brand, analysis.category);
      setUploadProgress("Saving analysis results...");

      console.log("Step 3: Creating inventory item in database");
      // Create inventory item
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
      // Create marketplace analytics
      await Promise.all(
        analysis.marketplaces.map(async (analytics, index) => {
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
      // Save analysis for future reference
      await aiService.saveAnalysis(session.user.id, analysis);

      console.log("Upload completed successfully");
      clearTimeout(uploadTimeout);
      addToast("Item analyzed and added to inventory successfully!", "success");
      setUploadProgress("Analysis complete. Draft saved.");

      // Clear the file input
      event.target.value = '';

    } catch (err) {
      console.error("Upload failed with error:", err);
      clearTimeout(uploadTimeout);
      setUploadProgress("Upload failed. Try again.");

      // More specific error messages
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
      // Ensure loading state is cleared
      setTimeout(() => {
        setUploading(false);
      }, 1000);
    }
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <Header />
        <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-10 shadow-2xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Inventory management</p>
                  <h1 className="mt-4 text-4xl font-semibold text-stone-900">Keep every item in motion</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                      view === "grid" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                      view === "list" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    List
                  </button>
                </div>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Quick upload</p>
                  <h2 className="mt-4 text-xl font-semibold text-stone-900">AI-powered item capture</h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    Upload an item image, analyze pricing, and save it to inventory automatically with a polished success flow.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <label className={`rounded-3xl border border-stone-200 bg-white px-4 py-3 text-center text-sm font-semibold transition ${
                      uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-stone-900 hover:bg-stone-100'
                    }`}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                      {uploading ? 'Processing...' : 'Upload item image'}
                    </label>
                    <div className="rounded-3xl border border-stone-200 bg-stone-100 px-4 py-4 text-sm text-stone-600">
                      {uploadProgress}
                    </div>
                  </div>
                </div>

                <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Summary</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Items</p>
                      <p className="mt-3 text-3xl font-semibold text-stone-900">{inventory.length}</p>
                    </div>
                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Drafts</p>
                      <p className="mt-3 text-3xl font-semibold text-stone-900">{inventory.filter((item) => item.status === "Draft").length}</p>
                    </div>
                  </div>
                  <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Estimated inventory value</p>
                    <p className="mt-3 text-2xl font-semibold text-stone-900">
                      ${inventory.reduce((sum, item) => sum + (item.estimated_price || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-[1.5fr_1fr] lg:grid-cols-[1.8fr_1fr]">
                <div className="rounded-4xl border border-stone-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Search</p>
                      <h2 className="mt-2 text-xl font-semibold text-stone-900">Filter your inventory</h2>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none"
                      >
                        {statusMap.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <select
                        value={sortKey}
                        onChange={(event) => setSortKey(event.target.value)}
                        className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none"
                      >
                        {sortOptions.map((option) => (
                          <option key={option.id} value={option.id}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 rounded-4xl border border-stone-200 bg-stone-50 p-4">
                    <label className="sr-only" htmlFor="inventory-search">Search inventory</label>
                    <input
                      id="inventory-search"
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, brand, or category"
                      className="w-full rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                  <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Insights</p>
                  <div className="mt-6 space-y-4 text-sm text-stone-600">
                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="font-semibold text-stone-900">Most active status</p>
                      <p className="mt-2">{(() => {
                        const counts = statusMap.slice(1).map((status) => ({ status, count: inventory.filter((item) => item.status === status).length }));
                        const winner = counts.sort((a, b) => b.count - a.count)[0];
                        return winner?.count ? `${winner.status} (${winner.count})` : "No items yet";
                      })()}</p>
                    </div>
                    <div className="rounded-3xl border border-stone-200 bg-white p-4">
                      <p className="font-semibold text-stone-900">Current upload flow</p>
                      <p className="mt-2">Upload an item to analyze, price, and save in one luxury flow.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10">
                <div className="rounded-4xl border border-stone-200 bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Inventory list</p>
                      <h2 className="mt-2 text-xl font-semibold text-stone-900">{filteredInventory.length} items</h2>
                    </div>
                    <p className="text-sm text-stone-500">Viewing {view} mode</p>
                  </div>

                  {loading ? (
                    <div className="mt-8 rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center text-stone-500">
                      Loading inventory...
                    </div>
                  ) : error ? (
                    <div className="mt-8 rounded-4xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
                      Error loading inventory: {error}
                    </div>
                  ) : filteredInventory.length === 0 && inventory.length === 0 ? (
                    <div className="mt-8 rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mx-auto h-12 w-12 text-stone-400">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-stone-900">No inventory yet</h3>
                        <p className="mt-2 text-sm text-stone-500">
                          Upload your first item to get started with AI-powered analysis and marketplace insights.
                        </p>
                        <div className="mt-6">
                          <label htmlFor="empty-upload" className="cursor-pointer rounded-3xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-stone-800">
                            Upload first item
                          </label>
                          <input
                            id="empty-upload"
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
                    <div className="mt-8 rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center text-stone-500">
                      No matching items found. Try adjusting your filters.
                    </div>
                  ) : view === "grid" ? (
                    <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                      {filteredInventory.map((item) => (
                        <article key={item.id} className="rounded-4xl border border-stone-200 bg-stone-50 overflow-hidden shadow-sm">
                          <div className="aspect-[4/3] bg-stone-100">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.item_name} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">{item.brand}</p>
                                <h3 className="mt-2 text-lg font-semibold text-stone-900">{item.item_name}</h3>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                                item.status === 'Listed' ? 'bg-green-100 text-green-800' :
                                item.status === 'Sold' ? 'bg-blue-100 text-blue-800' :
                                'bg-stone-900 text-white'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-4 text-sm text-stone-600">{item.category}</p>
                            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-stone-900">
                              <span>${item.estimated_price?.toLocaleString() || 'TBD'}</span>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : "Listed")}
                                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-100"
                              >
                                {item.status === "Listed" ? "Mark sold" : "List item"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-8 overflow-hidden rounded-4xl border border-stone-200 bg-stone-50">
                      <table className="w-full border-collapse text-left text-sm text-stone-700">
                        <thead className="bg-white">
                          <tr>
                            <th className="px-6 py-4 font-semibold text-stone-500">Item</th>
                            <th className="px-6 py-4 font-semibold text-stone-500">Brand</th>
                            <th className="px-6 py-4 font-semibold text-stone-500">Status</th>
                            <th className="px-6 py-4 font-semibold text-stone-500">Price</th>
                            <th className="px-6 py-4 font-semibold text-stone-500">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map((item) => (
                            <tr key={item.id} className="border-t border-stone-200 bg-white even:bg-stone-50">
                              <td className="px-6 py-4 font-semibold text-stone-900">{item.item_name}</td>
                              <td className="px-6 py-4">{item.brand}</td>
                              <td className="px-6 py-4">
                                <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                                  item.status === "Listed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.status === "Sold"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-stone-100 text-stone-600"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">${item.estimated_price?.toLocaleString() || 'TBD'}</td>
                              <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : "Listed")}
                                  className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-900 hover:bg-stone-100"
                                >
                                  {item.status === "Listed" ? "Mark sold" : "List"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-4xl border border-stone-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Action center</p>
                <h2 className="mt-4 text-xl font-semibold text-stone-900">Manage faster</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Use quick status actions and smart sorting to keep your resale lineup moving.
                </p>
              </div>
              <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Live metrics</p>
                <div className="mt-6 space-y-4 text-sm text-stone-600">
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white px-4 py-4">
                    <span>Total inventory</span>
                    <span className="font-semibold text-stone-900">{inventory.length}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white px-4 py-4">
                    <span>Draft value</span>
                    <span className="font-semibold text-stone-900">${inventory.filter((item) => item.status === "Draft").reduce((sum, item) => sum + (item.estimated_price || 0), 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-3xl border border-stone-200 bg-white px-4 py-4">
                    <span>Listed value</span>
                    <span className="font-semibold text-stone-900">${inventory.filter((item) => item.status === "Listed").reduce((sum, item) => sum + (item.estimated_price || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
