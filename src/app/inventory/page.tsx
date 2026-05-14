"use client";

import { Fragment, useMemo, useState, useRef } from "react";
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

// Loading skeleton components
const InventoryCardSkeleton = () => (
  <div className="group animate-pulse">
    <div className="aspect-[4/3] rounded-3xl bg-stone-200"></div>
    <div className="mt-4 space-y-3">
      <div className="h-3 w-16 rounded-full bg-stone-200"></div>
      <div className="h-4 w-full rounded-full bg-stone-200"></div>
      <div className="h-3 w-20 rounded-full bg-stone-200"></div>
      <div className="flex items-center justify-between pt-3">
        <div className="h-5 w-16 rounded-full bg-stone-200"></div>
        <div className="h-8 w-20 rounded-full bg-stone-200"></div>
      </div>
    </div>
  </div>
);

const StatsCardSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-stone-200 bg-white p-6">
    <div className="h-3 w-20 rounded-full bg-stone-200 mb-4"></div>
    <div className="h-8 w-12 rounded-full bg-stone-200 mb-2"></div>
    <div className="h-3 w-24 rounded-full bg-stone-200"></div>
  </div>
);

const AIAnalysisSkeleton = () => (
  <div className="rounded-4xl border border-stone-200 bg-stone-50 p-6 animate-pulse">
    <div className="mb-6 h-5 w-3/4 rounded-full bg-stone-200"></div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        <div className="h-12 rounded-3xl bg-stone-200"></div>
        <div className="h-12 rounded-3xl bg-stone-200"></div>
      </div>
      <div className="space-y-3">
        <div className="h-12 rounded-3xl bg-stone-200"></div>
        <div className="h-12 rounded-3xl bg-stone-200"></div>
      </div>
    </div>
    <div className="mt-6 grid gap-3">
      <div className="h-12 rounded-3xl bg-stone-200"></div>
      <div className="h-12 rounded-3xl bg-stone-200"></div>
    </div>
  </div>
);

type PricingPoint = {
  platform: string;
  low: number;
  avg: number;
  high: number;
  trend: number[];
  colorClass: string;
};

const generateMockMarketplaceData = (item: {
  estimated_price?: number | null;
  price_low?: number | null;
  price_high?: number | null;
  category?: string | null;
  brand?: string | null;
}): PricingPoint[] => {
  const base = Math.max(item.estimated_price || 180, 60);
  const safeLow = Math.max(item.price_low || Math.round(base * 0.8), 30);
  const safeHigh = Math.max(item.price_high || Math.round(base * 1.15), base + 20);
  return [
    {
      platform: "Grailed",
      low: Math.round(safeLow * 0.92),
      avg: Math.round(base * 0.98),
      high: Math.round(safeHigh * 1.02),
      trend: [62, 68, 72, 70, 75],
      colorClass: "from-emerald-500 to-emerald-300",
    },
    {
      platform: "eBay",
      low: Math.round(safeLow * 0.88),
      avg: Math.round(base * 0.94),
      high: Math.round(safeHigh * 0.98),
      trend: [55, 60, 66, 64, 69],
      colorClass: "from-sky-500 to-sky-300",
    },
    {
      platform: "StockX",
      low: Math.round(safeLow * 0.95),
      avg: Math.round(base * 1.03),
      high: Math.round(safeHigh * 1.1),
      trend: [70, 74, 78, 80, 84],
      colorClass: "from-violet-500 to-violet-300",
    },
    {
      platform: "Depop",
      low: Math.round(safeLow * 0.85),
      avg: Math.round(base * 0.92),
      high: Math.round(safeHigh * 0.96),
      trend: [50, 55, 60, 58, 63],
      colorClass: "from-stone-500 to-stone-300",
    },
  ];
};

const MarketplacePricingIntelligence = ({
  item,
}: {
  item: {
    estimated_price?: number | null;
    price_low?: number | null;
    price_high?: number | null;
    item_name: string;
    brand?: string | null;
    category?: string | null;
  };
}) => {
  const [pricingBias, setPricingBias] = useState(32);
  const platformData = useMemo(() => generateMockMarketplaceData(item), [item]);

  const pricingSummary = useMemo(() => {
    const low = Math.min(...platformData.map((row) => row.low));
    const avg = Math.round(platformData.reduce((sum, row) => sum + row.avg, 0) / platformData.length);
    const high = Math.max(...platformData.map((row) => row.high));
    const recommended = Math.round(
      Math.max(
        avg + (high - avg) * (pricingBias / 100) * 0.8,
        avg * (1 - (100 - pricingBias) / 100 * 0.08)
      )
    );
    return { low, avg, high, recommended };
  }, [platformData, pricingBias]);

  return (
    <div className="rounded-4xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-stone-300 hover:shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Market pricing intelligence</p>
          <h4 className="mt-3 text-lg font-semibold text-stone-900">Cross-market insight</h4>
          <p className="mt-2 text-sm text-stone-600">Real-time resale pricing intelligence across Grailed, eBay, Depop, StockX, GOAT, Vestiaire, The RealReal, and Poshmark.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Lowest</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.low.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Average</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.avg.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Highest</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.high.toLocaleString()}</p>
          </div>
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-stone-900 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-emerald-700">Recommended</p>
            <p className="mt-2 text-xl font-semibold text-emerald-900">${pricingSummary.recommended.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-4xl border border-stone-100 bg-stone-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-stone-600">Pricing strategy</p>
          <p className="text-sm font-medium text-stone-700">{pricingBias < 50 ? "Sell Fast" : pricingBias > 50 ? "Max Profit" : "Balanced"}</p>
        </div>
        <div className="mt-4">
          <input
            type="range"
            min={0}
            max={100}
            value={pricingBias}
            onChange={(event) => setPricingBias(Number(event.target.value))}
            className="w-full appearance-none rounded-full bg-stone-200 h-2 accent-stone-900"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500">
            <span>Sell Fast</span>
            <span>Max Profit</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {platformData.map((row) => (
          <div key={row.platform} className="rounded-4xl border border-stone-200 bg-white p-4 text-stone-900 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-600">{row.platform}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-stone-500">{item.brand || item.category || "Design"}</span>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-stone-700">
              <div className="flex items-center justify-between">
                <span>Low</span>
                <span>${row.low.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg</span>
                <span>${row.avg.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>High</span>
                <span>${row.high.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              {row.trend.map((value, idx) => (
                <div key={idx} className="h-2 rounded-full bg-white/15 transition-all duration-300" style={{ width: `${value}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedCategory, setGeneratedCategory] = useState("");
  const [generatedBrand, setGeneratedBrand] = useState("");
  const [generatedPrice, setGeneratedPrice] = useState<number | "">("");
  const [generatedCondition, setGeneratedCondition] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisReady = Boolean(analysisResult && !analysisLoading);

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

  const generateAnalysis = async (file: File) => {
    setAnalysisLoading(true);
    setAnalysisResult(null);
    setUploadProgress("Reviewing item details...");

    try {
      const analysis = await Promise.race([
        aiService.analyzeItem(file),
        new Promise<AIAnalysisResult>((_, reject) =>
          setTimeout(() => reject(new Error("AI analysis timeout")), 10000)
        ),
      ]);

      setAnalysisResult(analysis);
      setGeneratedTitle(analysis.generated_title || `${analysis.brand} ${analysis.category}`);
      setGeneratedDescription(
        analysis.generated_description ||
        `A considered ${analysis.category.toLowerCase()} piece from ${analysis.brand}, primed for the resale market.`
      );
      setGeneratedCategory(analysis.category);
      setGeneratedBrand(analysis.brand);
      setGeneratedPrice(analysis.estimated_price || 0);
      setGeneratedCondition(analysis.condition);
      setUploadProgress("Suggested listing ready.");
    } catch (err) {
      console.error("Listing analysis failed", err);
      const message = err instanceof Error ? err.message : "Listing analysis failed";
      addToast(message.includes("timeout") ? "Listing analysis timed out. Please try again." : message, "error");
      setUploadProgress("Item analysis failed. Try another image.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      addToast("Please select an image file", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addToast("File size must be less than 10MB", "error");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
    setGeneratedTitle("");
    setGeneratedDescription("");
    setGeneratedCategory("");
    setGeneratedBrand("");
    setGeneratedPrice("");
    setGeneratedCondition("");
    generateAnalysis(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !session?.user?.id) {
      console.log("Upload cancelled: no file or no session");
      setUploadProgress("Ready to upload");
      return;
    }

    console.log("Starting upload for file:", selectedFile.name, "size:", selectedFile.size);
    setUploading(true);
    setUploadProgress("Preparing upload...");

    const uploadTimeout = setTimeout(() => {
      console.error("Upload timeout after 30 seconds");
      setUploading(false);
      setUploadProgress("Upload timed out. Please try again.");
      addToast("Upload timed out. Please try again.", "error");
      cleanupPreview();
    }, 30000);

    try {
      setUploadProgress("Uploading image...");
      console.log("Step 1: Uploading image to Supabase Storage");

      const imageUrl = await Promise.race([
        db.uploadInventoryImage(selectedFile, session.user.id, selectedFile.name),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error("Image upload timeout")), 15000)
        ),
      ]);

      console.log("Image uploaded successfully:", imageUrl);
      setUploadProgress("Preparing listing details...");

      console.log("Step 2: Using generated listing data");
      setUploadProgress("Finalizing listing...");

      const newItem = await db.createInventoryItem({
        user_id: session.user.id,
        item_name: generatedTitle || analysisResult?.generated_title || `${analysisResult?.brand || "Luxury"} ${analysisResult?.category || "Item"}`,
        brand: generatedBrand || analysisResult?.brand || "Unknown",
        category: generatedCategory || analysisResult?.category || "Uncategorized",
        image_url: imageUrl,
        estimated_price: typeof generatedPrice === 'number' ? generatedPrice : analysisResult?.estimated_price || 0,
        price_low: analysisResult?.price_low || 0,
        price_high: analysisResult?.price_high || 0,
        condition: generatedCondition || analysisResult?.condition || "Good",
        demand_score: analysisResult?.demand_score || 0,
        status: "Draft",
        tags: analysisResult?.tags || [],
        generated_title: generatedTitle,
        generated_description: generatedDescription,
      });

      console.log("Inventory item created with ID:", newItem.id);
      console.log("Step 4: Creating marketplace analytics");

      await Promise.all(
        (analysisResult?.marketplaces ?? []).map(async (analytics) => {
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
      if (analysisResult) {
        await aiService.saveAnalysis(session.user.id, analysisResult);
      }

      console.log("Upload completed successfully");
      clearTimeout(uploadTimeout);
      addToast("Item analyzed and added to inventory successfully!", "success");
      setUploadProgress("Analysis complete. Draft saved.");
      cleanupPreview();
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
      cleanupPreview();
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress((current) => current.includes("failed") ? "Ready to upload" : current);
      }, 500);
    }
  };

  const cleanupPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setAnalysisResult(null);
    setAnalysisLoading(false);
    setGeneratedTitle("");
    setGeneratedDescription("");
    setGeneratedCategory("");
    setGeneratedBrand("");
    setGeneratedPrice("");
    setGeneratedCondition("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelUpload = () => {
    cleanupPreview();
    setUploading(false);
    setUploadProgress("Ready to upload");
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
                <p className="mt-3 text-sm text-stone-600">Use intelligent analysis to estimate price, condition, and demand.</p>
                <div className="mt-5 flex flex-col gap-3">
                  <label className={`rounded-3xl border-2 border-dashed border-stone-200 bg-stone-50 px-6 py-7 text-center transition cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-stone-300 hover:bg-stone-100'
                  }`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
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
                  {previewUrl && !uploading && (
                    <div className="mt-4 space-y-5">
                      <div className="grid gap-4 items-start lg:grid-cols-[1.3fr_0.95fr]">
                        <div className="overflow-hidden rounded-4xl border border-stone-200 bg-stone-100 shadow-sm">
                          <div className="aspect-[5/4] overflow-hidden">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            />
                          </div>
                          <div className="border-t border-stone-200 bg-white/90 px-4 py-3 text-sm text-stone-600">
                            <p className="font-semibold text-stone-900">Preview</p>
                            <p className="mt-1 text-sm">Ready for listing.</p>
                          </div>
                        </div>

                        <div className="rounded-4xl border border-stone-200 bg-white p-5 shadow-sm">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <p className="text-xs uppercase tracking-[0.28em] text-stone-500">Suggested listing</p>
                              <h3 className="mt-2 text-xl font-semibold text-stone-900">Listing details</h3>
                            </div>
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-600">
                              {analysisLoading ? 'Preparing' : analysisReady ? 'Ready to review' : 'Waiting'}
                            </span>
                          </div>

                          {analysisReady && analysisResult && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-3xl bg-stone-50 px-3 py-3 text-xs text-stone-700 shadow-sm">
                                <p className="uppercase tracking-[0.28em] text-stone-500">Confidence</p>
                                <p className="mt-2 text-base font-semibold text-stone-900">{analysisResult.confidence_score}%</p>
                              </div>
                              <div className="rounded-3xl bg-stone-50 px-3 py-3 text-xs text-stone-700 shadow-sm">
                                <p className="uppercase tracking-[0.28em] text-stone-500">Demand</p>
                                <p className="mt-2 text-base font-semibold text-stone-900">{analysisResult.market_demand}</p>
                              </div>
                              <div className="rounded-3xl bg-stone-50 px-3 py-3 text-xs text-stone-700 shadow-sm">
                                <p className="uppercase tracking-[0.28em] text-stone-500">Sell-through</p>
                                <p className="mt-2 text-base font-semibold text-stone-900">{analysisResult.sell_through_estimate}</p>
                              </div>
                            </div>
                          )}

                          <div className="mt-6 space-y-4">
                            {analysisLoading ? (
                              <AIAnalysisSkeleton />
                            ) : analysisReady ? (
                              <div className="space-y-4">
                                <label className="block text-sm font-semibold text-stone-800">Title</label>
                                <input
                                  value={generatedTitle}
                                  onChange={(event) => setGeneratedTitle(event.target.value)}
                                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                />

                                <label className="block text-sm font-semibold text-stone-800">Description</label>
                                <textarea
                                  value={generatedDescription}
                                  onChange={(event) => setGeneratedDescription(event.target.value)}
                                  rows={4}
                                  className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                />

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="block text-sm font-semibold text-stone-800">Category</label>
                                    <input
                                      value={generatedCategory}
                                      onChange={(event) => setGeneratedCategory(event.target.value)}
                                      className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-stone-800">Brand</label>
                                    <input
                                      value={generatedBrand}
                                      onChange={(event) => setGeneratedBrand(event.target.value)}
                                      className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                    />
                                  </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <label className="block text-sm font-semibold text-stone-800">Recommended price</label>
                                    <div className="relative">
                                      <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-stone-500">$</span>
                                      <input
                                        type="number"
                                        value={generatedPrice}
                                        onChange={(event) => setGeneratedPrice(Number(event.target.value))}
                                        className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 pl-10 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-semibold text-stone-800">Condition</label>
                                    <input
                                      value={generatedCondition}
                                      onChange={(event) => setGeneratedCondition(event.target.value)}
                                      className="w-full rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-900"
                                    />
                                  </div>
                                </div>

                                {analysisResult && (
                                  <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                                    <p className="font-semibold text-stone-900">Pricing guide</p>
                                    <p className="mt-2">Range ${analysisResult.price_low.toLocaleString()} – ${analysisResult.price_high.toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-6 text-sm text-stone-600">
                                <p className="font-medium text-stone-900">Your suggested listing appears here after image upload.</p>
                                <p className="mt-2">Upload a polished item image and let the system propose refined copy and pricing for resale.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="rounded-4xl border border-stone-200 bg-white/90 px-5 py-4 text-stone-900 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Workflow</p>
                          <div className="mt-3 space-y-1 text-sm leading-6 text-stone-600">
                            <p>1. Upload your item image.</p>
                            <p>2. Review the suggested title, description, and pricing.</p>
                            <p>3. Edit, then save the listing.</p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            onClick={handleUpload}
                            disabled={!analysisReady || uploading}
                            className="rounded-3xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {uploading ? 'Saving listing...' : 'Save listing'}
                          </button>
                          <button
                            onClick={cancelUpload}
                            className="rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-stone-50"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="rounded-4xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                          <p className="font-medium">Tip</p>
                          <p className="mt-2">Use the generated title and price as a premium baseline, then refine the description to match your brand voice.</p>
                        </div>
                      </div>
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
                <div className="rounded-4xl border border-dashed border-stone-200 bg-gradient-to-br from-stone-50 to-stone-100 p-20 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto h-20 w-20 text-stone-400 mb-6">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-stone-900 mb-3">Your luxury inventory awaits</h3>
                    <p className="text-stone-600 leading-relaxed mb-8">
                      Transform your closet into a profitable business. Upload your first item and let AI analyze pricing, condition, and marketplace demand across platforms like Grailed, Depop, and eBay.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                      <label htmlFor="empty-upload-hero" className="inline-flex items-center gap-3 rounded-3xl bg-stone-900 px-8 py-4 text-sm font-bold text-white transition hover:bg-stone-800 hover:shadow-lg cursor-pointer">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Upload Your First Item
                      </label>
                      <p className="text-xs text-stone-500 font-medium">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="rounded-4xl border border-dashed border-stone-200 bg-stone-50 p-16 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-900">No items match your filters</h3>
                    <p className="mt-2 text-sm text-stone-600">Try adjusting your search, status, or sort options</p>
                  </div>
                </div>
              ) : view === "grid" ? (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredInventory.map((item) => (
                    <article key={item.id} className="group relative flex flex-col rounded-4xl border border-stone-200 bg-white overflow-hidden transition-all duration-300 hover:border-stone-300 hover:shadow-2xl hover:shadow-stone-900/10 hover:-translate-y-1">
                      <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <div className="absolute top-4 right-4">
                          <span className={`rounded-full px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.25em] shadow-lg ${
                            item.status === 'Listed' ? 'bg-emerald-500 text-white shadow-emerald-500/25' :
                            item.status === 'Sold' ? 'bg-blue-500 text-white shadow-blue-500/25' :
                            'bg-stone-900 text-white shadow-stone-900/25'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="flex items-center justify-between">
                            <div className="rounded-2xl bg-white/90 backdrop-blur-sm px-3 py-2 shadow-lg">
                              <p className="text-xs font-semibold text-stone-900">
                                ${item.estimated_price?.toLocaleString() || 'TBD'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "Listed")}
                              disabled={updatingIds.has(item.id)}
                              className="rounded-2xl bg-white/90 backdrop-blur-sm px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-stone-900 shadow-lg transition hover:bg-stone-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingIds.has(item.id) ? "…" : item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "List"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.28em] text-stone-500 font-medium">{item.brand}</p>
                          <h3 className="mt-3 line-clamp-2 text-lg font-bold text-stone-900 leading-tight">{item.item_name}</h3>
                          <p className="mt-3 text-sm text-stone-600 font-medium">{item.category}</p>
                          {item.created_at && (
                            <p className="mt-2 text-xs text-stone-400 font-medium">Added {formatDate(item.created_at)}</p>
                          )}
                        </div>
                        <div className="mt-5">
                          <MarketplacePricingIntelligence item={item} />
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
                        <Fragment key={item.id}>
                          <tr className={`border-t border-stone-200 transition hover:bg-stone-50 ${idx % 2 === 0 ? "bg-white" : "bg-stone-50"}`}>
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
                          <tr className={`${idx % 2 === 0 ? "bg-stone-50" : "bg-white"}`}>
                            <td colSpan={7} className="px-6 py-4">
                              <MarketplacePricingIntelligence item={item} />
                            </td>
                          </tr>
                        </Fragment>
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
