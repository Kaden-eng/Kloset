"use client";

import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { withTimeout } from "@/lib/asyncUtils";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];
type InventoryItemUpdate = Database["public"]["Tables"]["inventory_items"]["Update"];

type MarketplaceAnalytics = Database["public"]["Tables"]["marketplace_analytics"]["Row"];
type MarketplaceAnalyticsInsert = Database["public"]["Tables"]["marketplace_analytics"]["Insert"];

type SavedAnalysis = Database["public"]["Tables"]["saved_analyses"]["Row"];
type SavedAnalysisInsert = Database["public"]["Tables"]["saved_analyses"]["Insert"];

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
};

export class DatabaseService {
  constructor(private supabase: SupabaseClient<Database>) {}

  private logSupabaseError(label: string, error: unknown, context?: Record<string, unknown>) {
    const supabaseError = error as SupabaseErrorLike;
    console.error(`[DatabaseService] ${label} failed`, {
      message: supabaseError?.message ?? String(error),
      code: supabaseError?.code,
      details: supabaseError?.details,
      hint: supabaseError?.hint,
      status: supabaseError?.status,
      name: supabaseError?.name,
      context,
      fullError: error,
    });
  }

  private async execute<T extends { data: any; error: any }>(
    request: any,
    timeoutMs = 15000,
    label = "Supabase request"
  ): Promise<T> {
    console.debug(`[DatabaseService] ${label} starting with ${timeoutMs}ms timeout`);
    try {
      const result = await withTimeout(request, timeoutMs, `${label} timed out`) as T;
      console.debug(`[DatabaseService] ${label} completed successfully`);
      return result;
    } catch (error) {
      console.error(`[DatabaseService] ${label} failed:`, error);
      throw error;
    }
  }

  // Inventory Items
  async getInventoryItems(userId: string): Promise<InventoryItem[]> {
    console.debug(`[DatabaseService] Fetching inventory items for user: ${userId}`);

    const start = Date.now();
    try {
      const query = this.supabase
        .from("inventory_items")
        .select("id, user_id, item_name, brand, category, estimated_price, status, created_at, image_url")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);

      const { data, error } = await query;

      const duration = Date.now() - start;
      console.debug(`[DatabaseService] Load inventory items completed in ${duration}ms, returned ${data?.length || 0} items`);

      if (error) {
        this.logSupabaseError("Supabase inventory query", error, { userId, duration });
        throw error;
      }

      return data || [];
    } catch (error) {
      const duration = Date.now() - start;
      this.logSupabaseError("Load inventory items", error, { userId, duration });
      throw error;
    }
  }

  async getInventoryItem(id: number, userId: string): Promise<InventoryItem | null> {
    const { data, error } = await this.execute(
      this.supabase
        .from("inventory_items")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single(),
      15000,
      "Load inventory item"
    );

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  }

  async createInventoryItem(item: InventoryItemInsert): Promise<InventoryItem> {
    const { data, error } = await this.execute(
      (this.supabase as any)
        .from("inventory_items")
        .insert(item)
        .select()
        .single(),
      15000,
      "Create inventory item"
    );

    if (error) throw error;
    return data;
  }

  async updateInventoryItem(id: number, userId: string, updates: InventoryItemUpdate): Promise<InventoryItem> {
    const { data, error } = await this.execute(
      (this.supabase as any)
        .from("inventory_items")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single(),
      15000,
      "Update inventory item"
    );

    if (error) throw error;
    return data;
  }

  async deleteInventoryItem(id: number, userId: string): Promise<void> {
    const { error } = await this.execute(
      this.supabase
        .from("inventory_items")
        .delete()
        .eq("id", id)
        .eq("user_id", userId),
      15000,
      "Delete inventory item"
    );

    if (error) throw error;
  }

  // Marketplace Analytics
  async getMarketplaceAnalytics(inventoryItemId: number): Promise<MarketplaceAnalytics[]> {
    const { data, error } = await this.execute(
      this.supabase
        .from("marketplace_analytics")
        .select("*")
        .eq("inventory_item_id", inventoryItemId)
        .order("created_at", { ascending: false }),
      15000,
      "Load marketplace analytics"
    );

    if (error) throw error;
    return data || [];
  }

  async createMarketplaceAnalytics(analytics: MarketplaceAnalyticsInsert): Promise<MarketplaceAnalytics> {
    const { data, error } = await this.execute(
      (this.supabase as any)
        .from("marketplace_analytics")
        .insert(analytics)
        .select()
        .single(),
      15000,
      "Create marketplace analytics"
    );

    if (error) throw error;
    return data;
  }

  async updateMarketplaceAnalytics(
    inventoryItemId: number,
    platform: string,
    updates: Partial<MarketplaceAnalyticsInsert>
  ): Promise<MarketplaceAnalytics> {
    const { data, error } = await (this.supabase as any)
      .from("marketplace_analytics")
      .update(updates)
      .eq("inventory_item_id", inventoryItemId)
      .eq("platform", platform)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Saved Analyses
  async getSavedAnalyses(userId: string): Promise<SavedAnalysis[]> {
    const { data, error } = await this.supabase
      .from("saved_analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async saveAnalysis(analysis: SavedAnalysisInsert): Promise<SavedAnalysis> {
    const { data, error } = await this.execute(
      (this.supabase as any)
        .from("saved_analyses")
        .insert(analysis)
        .select()
        .single(),
      15000,
      "Save analysis"
    );

    if (error) throw error;
    return data;
  }

  async deleteSavedAnalysis(id: number, userId: string): Promise<void> {
    const { error } = await this.execute(
      this.supabase
        .from("saved_analyses")
        .delete()
        .eq("id", id)
        .eq("user_id", userId),
      15000,
      "Delete saved analysis"
    );

    if (error) throw error;
  }

  // File Upload
  async uploadInventoryImage(file: File, userId: string, fileName: string): Promise<string> {
    console.debug("[DatabaseService] Uploading inventory image", { fileName, userId });
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await this.execute(
      this.supabase.storage
        .from('inventory-images')
        .upload(filePath, file),
      20000,
      "Upload inventory image"
    );

    if (error) throw error;

    const publicUrlResponse = this.supabase.storage
      .from('inventory-images')
      .getPublicUrl(data.path);

    if (!publicUrlResponse?.data?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }

    return publicUrlResponse.data.publicUrl;
  }

  // Bulk operations
  async createInventoryItemWithAnalytics(
    item: InventoryItemInsert,
    analytics?: MarketplaceAnalyticsInsert[]
  ): Promise<{ item: InventoryItem; analytics: MarketplaceAnalytics[] }> {
    // Start a transaction-like operation
    const createdItem = await this.createInventoryItem(item);

    let createdAnalytics: MarketplaceAnalytics[] = [];
    if (analytics && analytics.length > 0) {
      const analyticsWithItemId = analytics.map(a => ({
        ...a,
        inventory_item_id: createdItem.id
      }));

      const { data, error } = await this.execute(
        (this.supabase as any)
          .from("marketplace_analytics")
          .insert(analyticsWithItemId)
          .select(),
        15000,
        "Create marketplace analytics batch"
      );

      if (error) throw error;
      createdAnalytics = data || [];
    }

    return { item: createdItem, analytics: createdAnalytics };
  }

  // Search and filter
  async searchInventoryItems(
    userId: string,
    query?: string,
    category?: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<InventoryItem[]> {
    let queryBuilder = this.supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId);

    if (query) {
      queryBuilder = queryBuilder.or(`item_name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    if (status) {
      queryBuilder = queryBuilder.eq("status", status);
    }

    const { data, error } = await this.execute(
      queryBuilder
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      15000,
      "Search inventory items"
    );

    if (error) throw error;
    return data || [];
  }

  // Statistics
  async getInventoryStats(userId: string): Promise<{
    total: number;
    draft: number;
    listed: number;
    sold: number;
    totalValue: number;
  }> {
    const { data, error } = await this.execute(
      (this.supabase as any)
        .from("inventory_items")
        .select("status, estimated_price")
        .eq("user_id", userId),
      15000,
      "Load inventory stats"
    );

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      draft: 0,
      listed: 0,
      sold: 0,
      totalValue: 0
    };

    data?.forEach((item: any) => {
      switch (item.status) {
        case 'Draft':
          stats.draft++;
          break;
        case 'Listed':
          stats.listed++;
          break;
        case 'Sold':
          stats.sold++;
          break;
      }
      if (item.estimated_price) {
        stats.totalValue += item.estimated_price;
      }
    });

    return stats;
  }
}
