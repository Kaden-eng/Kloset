"use client";

/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { DatabaseService } from "@/lib/database";
import type { Database } from "@/types/supabase";

type InventoryItem = Database["public"]["Tables"]["inventory_items"]["Row"];
type InventoryItemInsert = Database["public"]["Tables"]["inventory_items"]["Insert"];
type InventoryItemUpdate = Database["public"]["Tables"]["inventory_items"]["Update"];

type MarketplaceAnalytics = Database["public"]["Tables"]["marketplace_analytics"]["Row"];

export function useDatabase() {
  const { supabase } = useSupabase();
  const [dbService] = useState(() => new DatabaseService(supabase));

  return dbService;
}

export function useInventoryItems() {
  const db = useDatabase();
  const { session, supabase } = useSupabase();
  const userId = session?.user?.id;
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const activeLoadIdRef = useRef(0);

  const loadItems = useCallback(async () => {
    if (!userId) {
      console.debug("[useInventoryItems] No authenticated user, skipping inventory load");
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const loadId = activeLoadIdRef.current + 1;
    activeLoadIdRef.current = loadId;

    try {
      console.debug("[useInventoryItems] Starting inventory load", { userId });
      setLoading(true);
      setError(null);

      const data = await db.getInventoryItems(userId);
      if (activeLoadIdRef.current !== loadId) return;

      setItems(data);
      console.debug("[useInventoryItems] Successfully loaded inventory", { count: data.length });
    } catch (err) {
      if (activeLoadIdRef.current !== loadId) return;
      const message = err instanceof Error ? err.message : "Failed to load inventory";
      setItems([]);
      setError(message);
    } finally {
      if (activeLoadIdRef.current === loadId) {
        setLoading(false);
      }
    }
  }, [db, userId]);

  useEffect(() => {
    loadItems();
    return () => {
      activeLoadIdRef.current += 1;
    };
  }, [loadItems, retryTrigger]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) {
      console.debug("[useInventoryItems] No user session, skipping realtime subscription");
      return;
    }

    console.debug("[useInventoryItems] Setting up realtime subscription for user:", userId);

    const channel = supabase
      .channel(`inventory_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.debug("[useInventoryItems] Realtime update received:", payload.eventType);
          if (payload.eventType === 'INSERT') {
            setItems(prev => {
              const newItem = payload.new as InventoryItem;
              return prev.some((item) => item.id === newItem.id) ? prev : [newItem, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setItems(prev => prev.map(item =>
              item.id === payload.new.id ? payload.new as InventoryItem : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.debug("[useInventoryItems] Realtime subscription status:", status);
      });

    return () => {
      console.debug("[useInventoryItems] Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  const createItem = useCallback(async (item: InventoryItemInsert) => {
    if (!userId) throw new Error('Not authenticated');

    const newItem = await db.createInventoryItem({
      ...item,
      user_id: userId
    });
    // Optimistic update - item will also be added via real-time subscription
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [db, userId]);

  const updateItem = useCallback(async (id: number, updates: InventoryItemUpdate) => {
    if (!userId) throw new Error('Not authenticated');

    const updatedItem = await db.updateInventoryItem(id, userId, updates);
    // Optimistic update - item will also be updated via real-time subscription
    setItems(prev => prev.map(item =>
      item.id === id ? updatedItem : item
    ));
    return updatedItem;
  }, [db, userId]);

  const deleteItem = useCallback(async (id: number) => {
    if (!userId) throw new Error('Not authenticated');

    await db.deleteInventoryItem(id, userId);
    // Optimistic update - item will also be removed via real-time subscription
    setItems(prev => prev.filter(item => item.id !== id));
  }, [db, userId]);

  const retry = useCallback(() => {
    console.debug("[useInventoryItems] Retry inventory load requested");
    setRetryTrigger((count) => count + 1);
  }, []);

  return {
    items,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadItems,
    retry,
  };
}

export function useInventoryItem(id: number) {
  const db = useDatabase();
  const { session } = useSupabase();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.debug("[useInventoryItem] Loading item", id);
      setLoading(true);
      setError(null);
      const data = await db.getInventoryItem(id, session.user.id);
      setItem(data);
      console.debug("[useInventoryItem] Loaded item", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item');
    } finally {
      setLoading(false);
    }
  }, [db, id, session?.user?.id]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const updateItem = useCallback(async (updates: InventoryItemUpdate) => {
    if (!session?.user?.id || !item) throw new Error('Not authenticated or item not loaded');

    const updatedItem = await db.updateInventoryItem(item.id, session.user.id, updates);
    setItem(updatedItem);
    return updatedItem;
  }, [db, item, session?.user?.id]);

  return {
    item,
    loading,
    error,
    updateItem,
    refresh: loadItem
  };
}

export function useMarketplaceAnalytics(inventoryItemId: number) {
  const db = useDatabase();
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      console.debug("[useMarketplaceAnalytics] Loading analytics for item", inventoryItemId);
      setLoading(true);
      setError(null);
      const data = await db.getMarketplaceAnalytics(inventoryItemId);
      setAnalytics(data);
      console.debug("[useMarketplaceAnalytics] Loaded analytics", data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [db, inventoryItemId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    analytics,
    loading,
    error,
    refresh: loadAnalytics
  };
}

export function useInventoryStats() {
  const db = useDatabase();
  const { session, supabase } = useSupabase();
  const [stats, setStats] = useState<{
    total: number;
    draft: number;
    listed: number;
    sold: number;
    totalValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      console.debug("[useInventoryStats] Loading stats for user", session.user.id);
      setLoading(true);
      setError(null);
      const data = await db.getInventoryStats(session.user.id);
      setStats(data);
      console.debug("[useInventoryStats] Loaded stats", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [db, session?.user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Real-time subscription for stats updates
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('inventory_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          // When inventory changes, refresh stats
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session?.user?.id, loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
}

export function useSearchInventory(query?: string, category?: string, status?: string) {
  const db = useDatabase();
  const { session } = useSupabase();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery?: string, searchCategory?: string, searchStatus?: string) => {
    if (!session?.user?.id) return;

    try {
      console.debug("[useSearchInventory] Searching inventory", { searchQuery, searchCategory, searchStatus });
      setLoading(true);
      setError(null);
      const data = await db.searchInventoryItems(
        session.user.id,
        searchQuery || query,
        searchCategory || category,
        searchStatus || status
      );
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search inventory');
    } finally {
      setLoading(false);
    }
  }, [db, session?.user?.id, query, category, status]);

  useEffect(() => {
    if (query !== undefined || category !== undefined || status !== undefined) {
      search();
    }
  }, [search, query, category, status]);

  return {
    items,
    loading,
    error,
    search
  };
}
