"use client";

import { useState, useCallback, useEffect } from "react";
import type { ApiResponse } from "@/types/api";
import type {
  CollectionItem,
  CollectionStats,
  VolumeCollectionStatus,
} from "@/types/collection";

interface UseCollectionResult {
  items: CollectionItem[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchItems: (volumeId?: number, offset?: number) => Promise<void>;
  addToCollection: (issue: {
    comicVineIssueId: number;
    comicVineVolumeId: number;
    volumeName: string;
    issueNumber: string;
    name?: string | null;
    imageUrl?: string | null;
    coverDate?: string | null;
  }) => Promise<boolean>;
  removeFromCollection: (issueId: number) => Promise<boolean>;
  isOwned: (comicVineIssueId: number) => boolean;
}

export function useCollection(initialVolumeId?: number): UseCollectionResult {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownedSet, setOwnedSet] = useState<Set<number>>(new Set());

  const fetchItems = useCallback(
    async (volumeId?: number, offset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (volumeId) params.set("volumeId", String(volumeId));
        params.set("offset", String(offset));
        params.set("limit", "50");

        const res = await fetch(`/api/collection?${params}`);
        const data: ApiResponse<CollectionItem[]> = await res.json();
        if (data.success && data.data) {
          if (offset === 0) {
            setItems(data.data);
          } else {
            setItems((prev) => [...prev, ...data.data!]);
          }
          setTotal(data.meta?.total ?? 0);
          setOwnedSet(
            new Set(
              offset === 0
                ? data.data.map((i) => i.comicVineIssueId)
                : [
                    ...Array.from(ownedSet),
                    ...data.data.map((i) => i.comicVineIssueId),
                  ]
            )
          );
        } else {
          setError(data.error || "Failed to fetch collection");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const addToCollection = useCallback(
    async (issue: {
      comicVineIssueId: number;
      comicVineVolumeId: number;
      volumeName: string;
      issueNumber: string;
      name?: string | null;
      imageUrl?: string | null;
      coverDate?: string | null;
    }): Promise<boolean> => {
      try {
        const res = await fetch("/api/collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(issue),
        });
        const data: ApiResponse<CollectionItem> = await res.json();
        if (data.success && data.data) {
          setOwnedSet((prev) => new Set([...Array.from(prev), issue.comicVineIssueId]));
          setItems((prev) => [data.data!, ...prev]);
          setTotal((prev) => prev + 1);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const removeFromCollection = useCallback(
    async (issueId: number): Promise<boolean> => {
      try {
        const res = await fetch(`/api/collection?issueId=${issueId}`, {
          method: "DELETE",
        });
        const data: ApiResponse<{ deleted: true }> = await res.json();
        if (data.success) {
          setOwnedSet((prev) => {
            const next = new Set(prev);
            next.delete(issueId);
            return next;
          });
          setItems((prev) =>
            prev.filter((i) => i.comicVineIssueId !== issueId)
          );
          setTotal((prev) => prev - 1);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const isOwned = useCallback(
    (comicVineIssueId: number) => ownedSet.has(comicVineIssueId),
    [ownedSet]
  );

  useEffect(() => {
    fetchItems(initialVolumeId);
  }, [initialVolumeId, fetchItems]);

  return {
    items,
    total,
    loading,
    error,
    fetchItems,
    addToCollection,
    removeFromCollection,
    isOwned,
  };
}

export function useVolumeCollectionStatus(volumeId: number | undefined) {
  const [status, setStatus] = useState<VolumeCollectionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!volumeId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/collection/volume/${volumeId}`);
      const data: ApiResponse<VolumeCollectionStatus> = await res.json();
      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch {
      // Silently fail — not critical
    } finally {
      setLoading(false);
    }
  }, [volumeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}

export function useCollectionStats() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/collection/stats");
        const data: ApiResponse<CollectionStats> = await res.json();
        if (data.success && data.data) {
          setStats(data.data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { stats, loading };
}
