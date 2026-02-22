"use client";

import { useState, useCallback } from "react";
import type { Listing } from "@/types/listing";
import type { ApiResponse } from "@/types/api";

interface UseSearchResult {
  listings: Listing[];
  total: number;
  loading: boolean;
  error: string | null;
  searchByIssue: (
    volumeName: string,
    issueNumber: string,
    maxPrice?: number,
    sort?: string
  ) => Promise<void>;
  searchByCharacter: (
    characterName: string,
    maxPrice?: number,
    sort?: string
  ) => Promise<void>;
  clearResults: () => void;
}

export function useSearch(): UseSearchResult {
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchByIssue = useCallback(
    async (
      volumeName: string,
      issueNumber: string,
      maxPrice?: number,
      sort?: string
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          volumeName,
          issueNumber,
          ...(maxPrice && { maxPrice: String(maxPrice) }),
          ...(sort && { sort }),
        });
        const res = await fetch(`/api/ebay/search?${params}`);
        const data: ApiResponse<Listing[]> = await res.json();
        if (data.success && data.data) {
          setListings(data.data);
          setTotal(data.meta?.total ?? data.data.length);
        } else {
          setError(data.error || "Search failed");
          setListings([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const searchByCharacter = useCallback(
    async (characterName: string, maxPrice?: number, sort?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          characterName,
          ...(maxPrice && { maxPrice: String(maxPrice) }),
          ...(sort && { sort }),
        });
        const res = await fetch(`/api/ebay/search?${params}`);
        const data: ApiResponse<Listing[]> = await res.json();
        if (data.success && data.data) {
          setListings(data.data);
          setTotal(data.meta?.total ?? data.data.length);
        } else {
          setError(data.error || "Search failed");
          setListings([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setListings([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearResults = useCallback(() => {
    setListings([]);
    setTotal(0);
    setError(null);
  }, []);

  return {
    listings,
    total,
    loading,
    error,
    searchByIssue,
    searchByCharacter,
    clearResults,
  };
}
