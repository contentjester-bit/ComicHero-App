"use client";

import { useState, useEffect } from "react";
import { KeyIssueCard } from "@/components/comics/key-issue-card";
import type { KeyIssue, KeyIssueCategory } from "@/types/comic";
import type { ApiResponse } from "@/types/api";

const categories: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "first_appearance", label: "First Appearances" },
  { value: "death", label: "Deaths" },
  { value: "origin", label: "Origins" },
  { value: "major_storyline", label: "Major Storylines" },
  { value: "key_crossover", label: "Key Crossovers" },
  { value: "other", label: "Other Notable" },
];

export default function KeyIssuesPage() {
  const [keyIssues, setKeyIssues] = useState<KeyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    fetchKeyIssues();
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchKeyIssues() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (category) params.set("category", category);
      const res = await fetch(`/api/comicvine/key-issues?${params}`);
      const data: ApiResponse<KeyIssue[]> = await res.json();
      if (data.success && data.data) {
        setKeyIssues(data.data);
      } else {
        setError(data.error || "Failed to load key issues");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const filteredIssues = query
    ? keyIssues.filter(
        (k) =>
          k.volumeName.toLowerCase().includes(query.toLowerCase()) ||
          k.reason.toLowerCase().includes(query.toLowerCase())
      )
    : keyIssues;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Key Issues</h1>
        <p className="mt-1 text-sm text-gray-600">
          Browse the most collectible comic book issues -- first appearances, deaths, and major events
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search key issues..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as KeyIssueCategory | "")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <p className="text-sm text-gray-600">
        Showing <strong>{filteredIssues.length}</strong> key issues
      </p>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 rounded bg-gray-200" />
                <div className="h-4 w-2/3 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredIssues.map((keyIssue) => (
            <KeyIssueCard key={keyIssue.id} keyIssue={keyIssue} />
          ))}
        </div>
      )}
    </div>
  );
}
