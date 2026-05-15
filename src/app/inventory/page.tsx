"use client";

import { Fragment, useMemo, useState, useRef, useEffect } from "react";
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
    <div className="mb-4 h-3 w-20 rounded-full bg-stone-200"></div>
    <div className="mb-2 h-8 w-12 rounded-full bg-stone-200"></div>
    <div className="h-3 w-24 rounded-full bg-stone-200"></div>
  </div>
);

const AIAnalysisSkeleton = () => (
  <div className="animate-pulse rounded-3xl border border-stone-200 bg-stone-50 p-6">
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
  sample: string;
  note: string;
};

const generatePricingReferences = (item: {
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
      sample: "Similar style listings",
      note: "Best when measurements and flaws are clearly shown",
    },
    {
      platform: "eBay",
      low: Math.round(safeLow * 0.88),
      avg: Math.round(base * 0.94),
      high: Math.round(safeHigh * 0.98),
      sample: "Recent sold listings",
      note: "Search title and condition details affect price",
    },
    {
      platform: "StockX",
      low: Math.round(safeLow * 0.95),
      avg: Math.round(base * 1.03),
      high: Math.round(safeHigh * 1.1),
      sample: "Model-based price check",
      note: "Most useful for exact sneakers and verified items",
    },
    {
      platform: "Depop",
      low: Math.round(safeLow * 0.85),
      avg: Math.round(base * 0.92),
      high: Math.round(safeHigh * 0.96),
      sample: "Similar casual listings",
      note: "Good photos and simple captions help quick sales",
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
  const platformData = useMemo(() => generatePricingReferences(item), [item]);

  const pricingSummary = useMemo(() => {
    const low = Math.min(...platformData.map((row) => row.low));
    const avg = Math.round(platformData.reduce((sum, row) => sum + row.avg, 0) / platformData.length);
    const high = Math.max(...platformData.map((row) => row.high));
    const quickSale = Math.round((low + avg) / 2);
    const higherAsk = Math.round((avg + high) / 2);
    const recommended = Math.round(
      quickSale + (higherAsk - quickSale) * (pricingBias / 100)
    );
    return { low, avg, high, quickSale, higherAsk, recommended };
  }, [platformData, pricingBias]);

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Price check</p>
          <h4 className="mt-2 text-lg font-semibold text-stone-950">What similar items sell for</h4>
          <p className="mt-1 text-sm text-stone-600">
            Estimates are based on the saved item price, low/high range, and example selling-app references. Review before listing.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Lowest</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.low.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Average</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.avg.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-stone-950 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-500">Highest</p>
            <p className="mt-2 text-xl font-semibold">${pricingSummary.high.toLocaleString()}</p>
          </div>
          <div className="rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-stone-950 shadow-sm">
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-stone-600">Suggested</p>
            <p className="mt-2 text-xl font-semibold text-stone-950">${pricingSummary.recommended.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Quick sale</p>
          <p className="mt-2 text-lg font-semibold text-stone-950">${pricingSummary.quickSale.toLocaleString()}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">Lower price if you want it to move faster.</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Fair ask</p>
          <p className="mt-2 text-lg font-semibold text-stone-950">${pricingSummary.avg.toLocaleString()}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">A balanced starting point from the reference range.</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Higher ask</p>
          <p className="mt-2 text-lg font-semibold text-stone-950">${pricingSummary.higherAsk.toLocaleString()}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">Use only if photos, condition, and size are strong.</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-600">Selling goal</p>
          <p className="text-xs font-medium text-stone-800">{pricingBias < 40 ? "Faster sale" : pricingBias > 65 ? "Higher ask" : "Balanced"}</p>
        </div>
        <div className="mt-3">
          <input
            type="range"
            min={0}
            max={100}
            value={pricingBias}
            onChange={(event) => setPricingBias(Number(event.target.value))}
            className="h-2 w-full appearance-none rounded-full bg-stone-200 accent-stone-950"
          />
          <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
            <span>Faster sale</span>
            <span>Higher ask</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {platformData.map((row) => (
          <div key={row.platform} className="rounded-3xl border border-stone-200 bg-white p-3 text-stone-900 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">{row.platform}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{row.sample}</span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>Low</span>
                <span>${row.low.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Usually around</span>
                <span>${row.avg.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>High</span>
                <span>${row.high.toLocaleString()}</span>
              </div>
            </div>
            <p className="mt-3 rounded-2xl bg-stone-50 px-3 py-2 text-xs leading-5 text-stone-500">{row.note}</p>
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
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
        `A clean ${analysis.category.toLowerCase()} piece from ${analysis.brand}, ready to review before selling.`
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

  const openCameraCapture = () => {
    cameraInputRef.current?.click();
  };

  const openGalleryUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const mobileRegex = /Mobi|Android|iPhone|iPad|iPod|webOS|BlackBerry|Opera Mini/i;
    const frame = requestAnimationFrame(() => {
      setIsMobile(mobileRegex.test(navigator.userAgent) || navigator.maxTouchPoints > 1);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

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
      <div className="min-h-screen bg-stone-50 text-stone-950">
        <Header />
        <main className="px-6 py-12 lg:px-10">
          <div className="mx-auto max-w-7xl">
            {/* Hero Section */}
            <section className="mb-10">
              <p className="inline-flex rounded-full border border-stone-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-600 shadow-sm">Resale workspace</p>
              <h1 className="mt-4 bg-transparent text-3xl font-semibold tracking-[-0.03em] text-stone-950">Professional inventory management</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
                AI pricing help, selling-app context, and real-time inventory tracking in a compact seller workspace.
              </p>
            </section>

            {/* Statistics Dashboard */}
            <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Total items</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{inventory.length}</p>
                <p className="mt-2 text-xs text-stone-500">In your inventory</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Total value</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">${(stats.totalValue / 1000).toFixed(1)}k</p>
                <p className="mt-2 text-xs text-stone-500">Estimated portfolio</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Active listings</p>
                <p className="mt-3 text-3xl font-semibold text-stone-950">{stats.listed.length}</p>
                <p className="mt-2 text-xs text-stone-600">${(stats.listedValue / 1000).toFixed(1)}k value</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Drafts</p>
                <p className="mt-4 text-4xl font-semibold text-stone-950">{stats.drafts.length}</p>
                <p className="mt-2 text-xs text-stone-500">${(stats.draftValue / 1000).toFixed(1)}k awaiting</p>
              </div>
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">Sold</p>
                <p className="mt-4 text-4xl font-semibold text-stone-950">{stats.sold.length}</p>
                <p className="mt-2 text-xs text-stone-500">Completed sales</p>
              </div>
            </section>

            {/* Upload + Quick Actions Section */}
            <section className="mb-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Upload new item</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">Add to inventory</h2>
                <p className="mt-2 text-sm text-stone-600">Use AI to estimate price, condition, and buyer interest.</p>
                <div className="mt-4 flex flex-col gap-3">
                  <label className={`cursor-pointer rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-6 text-center transition ${
                    uploading ? 'cursor-not-allowed opacity-50' : 'hover:border-stone-400 hover:bg-stone-100'
                  }`}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="hidden"
                    />
                    <svg className="mx-auto h-8 w-8 text-stone-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p className="mt-2 text-sm font-semibold text-stone-950">{uploading ? 'Processing...' : isMobile ? 'Tap to upload or take a photo' : 'Click to upload or drag'}</p>
                    <p className="text-xs text-stone-500">PNG, JPG up to 10MB</p>
                  </label>
                  {isMobile && !uploading && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={openCameraCapture}
                        className="w-full rounded-full bg-stone-950 px-4 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-950"
                      >
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={openGalleryUpload}
                        className="w-full rounded-full border border-stone-200 bg-white px-4 py-4 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-950"
                      >
                        Upload from Gallery
                      </button>
                    </div>
                  )}
                  {uploading && (
                    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
                      {uploadProgress}
                    </div>
                  )}
                  {previewUrl && !uploading && (
                    <div className="mt-3 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="grid gap-4">
                        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 shadow-sm">
                          <div className="aspect-[5/4] overflow-hidden">
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="h-full w-full object-cover transition duration-500 hover:scale-105"
                            />
                          </div>
                          <div className="border-t border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                            <p className="font-semibold text-stone-950">Preview</p>
                            <p className="mt-1 text-sm">Ready for listing.</p>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Suggested listing</p>
                              <h3 className="mt-1 text-lg font-semibold text-stone-950">What Kloset found</h3>
                            </div>
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-stone-600">
                              {analysisLoading ? 'Preparing' : analysisReady ? 'Ready to review' : 'Waiting'}
                            </span>
                          </div>

                          {analysisReady && analysisResult && (
                            <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2">
                              <div className="min-w-0 rounded-2xl bg-stone-50 px-3 py-3 shadow-sm">
                                <div className="flex flex-col justify-between gap-1">
                                  <p className="text-[11px] uppercase tracking-[0.08em] text-stone-500 leading-5">Brand match</p>
                                  <p className="break-words text-lg font-semibold text-stone-950">{analysisResult.brand_confidence}%</p>
                                </div>
                              </div>
                              <div className="min-w-0 rounded-2xl bg-stone-50 px-3 py-3 shadow-sm">
                                <div className="flex flex-col justify-between gap-1">
                                  <p className="text-[11px] uppercase tracking-[0.08em] text-stone-500 leading-5">Overall match</p>
                                  <p className="break-words text-lg font-semibold text-stone-950">{analysisResult.confidence_score}%</p>
                                </div>
                              </div>
                              <div className="min-w-0 rounded-2xl bg-stone-50 px-3 py-3 shadow-sm">
                                <div className="flex flex-col justify-between gap-1">
                                  <p className="text-[11px] uppercase tracking-[0.08em] text-stone-500 leading-5">Buyer interest</p>
                                  <p className="break-words text-lg font-semibold text-stone-950">{analysisResult.market_demand}</p>
                                </div>
                              </div>
                              <div className="min-w-0 rounded-2xl bg-stone-50 px-3 py-3 shadow-sm">
                                <div className="flex flex-col justify-between gap-1">
                                  <p className="text-[11px] uppercase tracking-[0.08em] text-stone-500 leading-5">Likely sale timing</p>
                                  <p className="break-words text-lg font-semibold text-stone-950">{analysisResult.sell_through_estimate}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Listing details</p>
                              <h3 className="mt-1 text-lg font-semibold text-stone-950">Refine item</h3>
                            </div>
                            <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] uppercase tracking-[0.15em] text-stone-600">
                              {analysisReady ? 'Ready' : analysisLoading ? 'Analyzing' : 'Waiting'}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3">
                            <div>
                              <label className="block text-sm font-semibold text-stone-800">Title</label>
                              <input
                                value={generatedTitle}
                                onChange={(event) => setGeneratedTitle(event.target.value)}
                                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-stone-800">Description</label>
                              <textarea
                                value={generatedDescription}
                                onChange={(event) => setGeneratedDescription(event.target.value)}
                                rows={3}
                                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-semibold text-stone-800">Category</label>
                                <input
                                  value={generatedCategory}
                                  onChange={(event) => setGeneratedCategory(event.target.value)}
                                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-stone-800">Brand</label>
                                <input
                                  value={generatedBrand}
                                  onChange={(event) => setGeneratedBrand(event.target.value)}
                                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                                />
                              </div>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm font-semibold text-stone-800">Suggested price</label>
                                <div className="relative">
                                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-stone-500">$</span>
                                  <input
                                    type="number"
                                    value={generatedPrice}
                                    onChange={(event) => setGeneratedPrice(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 pl-9 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-semibold text-stone-800">Condition</label>
                                <input
                                  value={generatedCondition}
                                  onChange={(event) => setGeneratedCondition(event.target.value)}
                                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <span>Low estimate</span>
                              <span>${analysisResult?.price_low?.toLocaleString() || '--'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Usually sells around</span>
                              <span>${analysisResult?.price_average?.toLocaleString() || '--'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>High estimate</span>
                              <span>${analysisResult?.price_high?.toLocaleString() || '--'}</span>
                            </div>
                            <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                              <span className="font-medium">Good for quick sale</span>
                              <span className="font-semibold text-stone-950">${analysisResult?.recommended_quick_sale?.toLocaleString() || '--'}</span>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <button
                              onClick={handleUpload}
                              disabled={!analysisReady || uploading}
                              className="rounded-full bg-stone-950 px-3 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {uploading ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelUpload}
                              className="rounded-full border border-stone-200 bg-white px-3 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-stone-50"
                            >
                              Cancel
                            </button>
                          </div>
                          <p className="mt-3 text-xs text-stone-500">
                            Kloset suggests a starting point from the item details. Review the price, condition, and description before saving.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Inventory snapshot</p>
                <h2 className="mt-2 text-xl font-semibold text-stone-950">What to focus on</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Most common category</span>
                    <span className="font-semibold text-stone-950">{stats.trendingCategory}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Average item value</span>
                    <span className="font-semibold text-stone-950">${inventory.length > 0 ? Math.round(stats.totalValue / inventory.length) : 0}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                    <span className="text-sm text-stone-600">Listed items</span>
                    <span className="font-semibold text-stone-950">{inventory.length > 0 ? Math.round((stats.listed.length / inventory.length) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Filter Toolbar */}
            <section className="mb-6 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <label className="sr-only" htmlFor="inventory-search-toolbar">Search inventory</label>
                  <input
                    id="inventory-search-toolbar"
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, brand, or category..."
                    className="w-full rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
                  >
                    {statusMap.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value)}
                    className="rounded-full border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-950 outline-none transition hover:border-stone-300 focus:border-stone-500 focus:bg-white"
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
                        view === "grid" ? "bg-stone-950 text-white" : "border border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={() => setView("list")}
                      className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${
                        view === "list" ? "bg-stone-950 text-white" : "border border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100"
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
              {filteredInventory.length > 0 && (
                <p className="mt-3 text-xs text-stone-500">Showing {filteredInventory.length} of {inventory.length} items</p>
              )}
            </section>

            {/* Inventory Display */}
            <section>
              {loading ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center">
                  <p className="text-stone-500">Loading your inventory...</p>
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
                  <p className="font-semibold">Error loading inventory</p>
                  <p className="mt-3 text-sm text-red-700">{error}</p>
                  <button
                    type="button"
                    onClick={refresh}
                    className="mt-4 inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    Retry loading inventory
                  </button>
                </div>
              ) : filteredInventory.length === 0 && inventory.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm sm:p-14">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 h-16 w-16 text-stone-400">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <h3 className="mb-3 text-2xl font-semibold text-stone-950">Your inventory desk is empty</h3>
                    <p className="mb-8 leading-relaxed text-stone-600">
                      Upload your first item and let AI check pricing, condition, and buyer interest across apps like Grailed, Depop, and eBay.
                    </p>
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                      <label htmlFor="empty-upload-hero" className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-stone-950 px-8 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-stone-800">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Upload Your First Item
                      </label>
                      <p className="text-xs font-medium text-stone-500">PNG, JPG up to 10MB</p>
                    </div>
                  </div>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 p-10 text-center">
                  <div className="mx-auto max-w-sm">
                    <div className="mx-auto mb-4 h-12 w-12 text-stone-500">
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-stone-950">No items match your filters</h3>
                    <p className="mt-2 text-sm text-stone-600">Try adjusting your search, status, or sort options</p>
                  </div>
                </div>
              ) : view === "grid" ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredInventory.map((item) => (
                    <article key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl">
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
                            item.status === 'Listed' ? 'bg-stone-950 text-white shadow-stone-950/20' :
                            item.status === 'Sold' ? 'bg-sky-400 text-stone-950 shadow-sky-400/25' :
                            'bg-stone-950 text-white shadow-stone-950/25'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          <div className="flex items-center justify-between">
                            <div className="rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm">
                              <p className="text-xs font-semibold text-stone-950">
                                ${item.estimated_price?.toLocaleString() || 'TBD'}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "Listed")}
                              disabled={updatingIds.has(item.id)}
                              className="rounded-2xl bg-stone-950 px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-sm transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {updatingIds.has(item.id) ? "…" : item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "List"}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex-1">
                          <p className="text-xs font-medium uppercase tracking-[0.24em] text-stone-500">{item.brand}</p>
                          <h3 className="mt-3 line-clamp-2 text-lg font-semibold leading-tight text-stone-950">{item.item_name}</h3>
                          <p className="mt-3 text-sm font-medium text-stone-600">{item.category}</p>
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
                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
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
                          <tr className={`border-t border-stone-200 transition hover:bg-stone-100 ${idx % 2 === 0 ? "bg-white" : "bg-stone-50"}`}>
                            <td className="px-6 py-4 font-semibold text-stone-950">{item.item_name}</td>
                            <td className="px-6 py-4">{item.brand}</td>
                            <td className="px-6 py-4 text-sm text-stone-600">{item.category}</td>
                            <td className="px-6 py-4">
                              <span className={`rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] ${
                                item.status === "Listed"
                                  ? "bg-stone-200 text-stone-800"
                                  : item.status === "Sold"
                                  ? "bg-sky-100 text-sky-800"
                                  : "bg-stone-950 text-white"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-semibold text-stone-950">${item.estimated_price?.toLocaleString() || 'TBD'}</td>
                            <td className="px-6 py-4 text-sm text-stone-500">{item.created_at ? formatDate(item.created_at) : '-'}</td>
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(item.id, item.status === "Listed" ? "Sold" : item.status === "Sold" ? "Draft" : "Listed")}
                                disabled={updatingIds.has(item.id)}
                                className="rounded-full border border-stone-300 bg-stone-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-950 hover:bg-stone-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
