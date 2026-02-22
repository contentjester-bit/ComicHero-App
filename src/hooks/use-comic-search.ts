"use client";

import { useState, useCallback, useEffect } from "react";
import type { ComicVolume, Character } from "@/types/comic";
import type { ApiResponse } from "@/types/api";

interface ApiConfig {
  ebayEnabled: boolean;
  comicVineEnabled: boolean;
}

interface UseComicSearchResult {
  volumes: ComicVolume[];
  characters: Character[];
  loading: boolean;
  error: string | null;
  config: ApiConfig | null;
  searchVolumes: (query: string) => Promise<void>;
  searchCharacters: (name: string) => Promise<void>;
  clearResults: () => void;
}

export function useComicSearch(): UseComicSearchResult {
  const [volumes, setVolumes] = useState<ComicVolume[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ApiConfig | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ ebayEnabled: false, comicVineEnabled: false }));
  }, []);

  const searchVolumes = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    setVolumes([]);
    try {
      const params = new URLSearchParams({ query, resources: "volume" });
      const res = await fetch(`/api/comicvine/search?${params}`);
      const data: ApiResponse<{ volumes: ComicVolume[] }> = await res.json();
      if (data.success && data.data) {
        setVolumes(data.data.volumes || []);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCharacters = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    setCharacters([]);
    try {
      const params = new URLSearchParams({ query: name, resources: "character" });
      const res = await fetch(`/api/comicvine/search?${params}`);
      const data: ApiResponse<{ characters: Character[] }> = await res.json();
      if (data.success && data.data) {
        setCharacters(data.data.characters || []);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setVolumes([]);
    setCharacters([]);
    setError(null);
  }, []);

  return {
    volumes,
    characters,
    loading,
    error,
    config,
    searchVolumes,
    searchCharacters,
    clearResults,
  };
}
