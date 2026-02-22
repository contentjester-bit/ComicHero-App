"use client";

import { useState, useCallback, useEffect } from "react";
import type { ApiResponse } from "@/types/api";

interface WantListItemData {
  id: string;
  volumeName: string;
  issueNumber: string;
  targetMaxPrice: number;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  matchCount: number;
  matches: Array<{
    id: string;
    ebayItemId: string;
    title: string;
    price: number;
    totalPrice: number;
    imageUrl: string | null;
    itemUrl: string;
    isNew: boolean;
    foundAt: string;
  }>;
}

interface UseWantListResult {
  items: WantListItemData[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (
    volumeName: string,
    issueNumber: string,
    targetMaxPrice: number,
    notes?: string
  ) => Promise<void>;
  updateItem: (id: string, updates: Record<string, unknown>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  checkDeals: (itemId?: string) => Promise<{ checkedItems: number; newMatches: number } | null>;
  checking: boolean;
}

export function useWantList(): UseWantListResult {
  const [items, setItems] = useState<WantListItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/want-list");
      const data: ApiResponse<WantListItemData[]> = await res.json();
      if (data.success && data.data) {
        setItems(data.data);
      } else {
        setError(data.error || "Failed to fetch want list");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(
    async (
      volumeName: string,
      issueNumber: string,
      targetMaxPrice: number,
      notes?: string
    ) => {
      setError(null);
      try {
        const res = await fetch("/api/want-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeName,
            issueNumber,
            targetMaxPrice,
            notes,
          }),
        });
        const data: ApiResponse<unknown> = await res.json();
        if (data.success) {
          await fetchItems();
        } else {
          setError(data.error || "Failed to add item");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add");
      }
    },
    [fetchItems]
  );

  const updateItem = useCallback(
    async (id: string, updates: Record<string, unknown>) => {
      setError(null);
      try {
        const res = await fetch("/api/want-list", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...updates }),
        });
        const data: ApiResponse<unknown> = await res.json();
        if (data.success) {
          await fetchItems();
        } else {
          setError(data.error || "Failed to update item");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update");
      }
    },
    [fetchItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setError(null);
      try {
        const res = await fetch(`/api/want-list?id=${id}`, {
          method: "DELETE",
        });
        const data: ApiResponse<unknown> = await res.json();
        if (data.success) {
          await fetchItems();
        } else {
          setError(data.error || "Failed to delete item");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    },
    [fetchItems]
  );

  const checkDeals = useCallback(
    async (itemId?: string) => {
      setChecking(true);
      setError(null);
      try {
        const res = await fetch("/api/deals/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemId ? { wantListItemId: itemId } : {}),
        });
        const data: ApiResponse<{
          checkedItems: number;
          newMatches: number;
        }> = await res.json();
        if (data.success && data.data) {
          await fetchItems();
          return data.data;
        } else {
          setError(data.error || "Deal check failed");
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Deal check failed");
        return null;
      } finally {
        setChecking(false);
      }
    },
    [fetchItems]
  );

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    checkDeals,
    checking,
  };
}
