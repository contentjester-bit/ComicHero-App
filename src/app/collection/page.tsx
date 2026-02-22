"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCollection, useCollectionStats } from "@/hooks/use-collection";

export default function CollectionPage() {
  const router = useRouter();
  const { items, total, loading, error, removeFromCollection } = useCollection();
  const { stats, loading: statsLoading } = useCollectionStats();

  // Search / filter
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"added" | "name" | "issue" | "price">("added");
  const [filterVolume, setFilterVolume] = useState<string>("");

  // Multi-select
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  // Get unique volumes for filter dropdown
  const uniqueVolumes = useMemo(() => {
    const vols = [...new Set(items.map((i) => i.volumeName))].sort();
    return vols;
  }, [items]);

  // Filter and sort
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.volumeName.toLowerCase().includes(q) ||
          i.issueNumber.includes(q) ||
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q))
      );
    }

    // Volume filter
    if (filterVolume) {
      result = result.filter((i) => i.volumeName === filterVolume);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.volumeName.localeCompare(b.volumeName) || parseInt(a.issueNumber) - parseInt(b.issueNumber));
        break;
      case "issue":
        result.sort((a, b) => parseInt(a.issueNumber) - parseInt(b.issueNumber));
        break;
      case "price":
        result.sort((a, b) => (b.pricePaid ?? 0) - (a.pricePaid ?? 0));
        break;
      case "added":
      default:
        result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }

    return result;
  }, [items, searchQuery, filterVolume, sortBy]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  // Build selected items data for actions
  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  // Navigate to bundles with selected items
  function handleCreateBundle() {
    const data = selectedItems.map((i) => ({
      volumeName: i.volumeName,
      issueNumber: i.issueNumber,
      comicVineIssueId: i.comicVineIssueId,
      imageUrl: i.imageUrl,
    }));
    sessionStorage.setItem("bundleFromCollection", JSON.stringify(data));
    router.push("/bundles?fromCollection=true");
  }

  // Navigate to art creator with selected items
  function handleSetToCoverArt() {
    const data = selectedItems.map((i) => ({
      volumeName: i.volumeName,
      issueNumber: i.issueNumber,
      comicVineIssueId: i.comicVineIssueId,
      imageUrl: i.imageUrl,
    }));
    sessionStorage.setItem("coverArtFromCollection", JSON.stringify(data));
    router.push("/art-creator?fromCollection=true");
  }

  // Extract asking price from notes
  function getAskingPrice(notes: string | null): string | null {
    if (!notes) return null;
    const match = notes.match(/Asking:\s*\$?([\d.]+)/);
    return match ? match[1] : null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 My Collection</h1>
          <p className="mt-1 text-sm text-gray-600">
            {total} issue{total !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setSelectMode(!selectMode); if (selectMode) clearSelection(); }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectMode
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {selectMode ? "✕ Cancel Select" : "☐ Select Mode"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Issues</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{stats.totalIssues.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Series</p>
            <p className="mt-1 text-2xl font-bold text-purple-600">{stats.totalVolumes.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Invested</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-gray-500">Avg / Book</p>
            <p className="mt-1 text-2xl font-bold text-orange-600">
              ${stats.totalIssues > 0 ? (stats.totalValue / stats.totalIssues).toFixed(2) : "0"}
            </p>
          </div>
        </div>
      )}

      {/* Search / Filter / Sort Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500">Search Collection</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Title, issue #, or notes..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="w-full sm:w-48">
          <label className="mb-1 block text-xs font-medium text-gray-500">Filter by Series</label>
          <select
            value={filterVolume}
            onChange={(e) => setFilterVolume(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Series</option>
            {uniqueVolumes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="added">Recently Added</option>
            <option value="name">Series Name</option>
            <option value="issue">Issue Number</option>
            <option value="price">Price Paid</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-gray-200 bg-white">
              <div className="aspect-[3/4] bg-gray-200" />
              <div className="space-y-2 p-3"><div className="h-4 rounded bg-gray-200" /><div className="h-3 w-2/3 rounded bg-gray-200" /></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {searchQuery || filterVolume ? "No matching comics" : "No comics yet"}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {searchQuery || filterVolume
              ? "Try adjusting your filters."
              : "Search for volumes and click \"Collect\" on issues to start building your collection."}
          </p>
        </div>
      ) : (
        <>
          {selectMode && (
            <div className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 p-3">
              <button onClick={selectAll} className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                Select All ({filteredItems.length})
              </button>
              <button onClick={clearSelection} className="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300">
                Clear
              </button>
              <span className="text-xs text-indigo-700">{selectedIds.size} selected</span>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Showing {filteredItems.length} of {total} issue{total !== 1 ? "s" : ""}
          </p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {filteredItems.map((item) => {
              const asking = getAskingPrice(item.notes);
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`group relative flex flex-col overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? "border-indigo-400 ring-2 ring-indigo-300 shadow-md"
                      : "border-gray-200 hover:shadow-md"
                  } bg-white`}
                  onClick={selectMode ? () => toggleSelect(item.id) : undefined}
                >
                  {/* Cover */}
                  <div className="relative aspect-[3/4] bg-gray-100">
                    {selectMode && (
                      <div className="absolute left-1 top-1 z-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    {!selectMode ? (
                      <Link href={`/issue/${item.comicVineIssueId}`} className="block h-full w-full">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={`${item.volumeName} #${item.issueNumber}`} className="h-full w-full object-contain" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-indigo-50">
                            <span className="text-xs font-bold text-indigo-600">#{item.issueNumber}</span>
                          </div>
                        )}
                      </Link>
                    ) : (
                      item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-contain cursor-pointer" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-indigo-50 cursor-pointer">
                          <span className="text-xs font-bold text-indigo-600">#{item.issueNumber}</span>
                        </div>
                      )
                    )}
                    {/* Condition badge */}
                    {item.condition && item.condition !== "Raw" && (
                      <div className="absolute right-0.5 top-0.5 rounded bg-black/70 px-1 py-0.5">
                        <span className="text-[8px] font-bold text-white">{item.condition}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-1.5">
                    <p className="truncate text-[10px] font-medium text-gray-900">{item.volumeName}</p>
                    <p className="text-[10px] text-gray-500">#{item.issueNumber}</p>
                    <div className="flex items-center justify-between">
                      {item.pricePaid != null && (
                        <span className="text-[9px] text-green-600 font-medium">${item.pricePaid.toFixed(0)}</span>
                      )}
                      {asking && (
                        <span className="text-[9px] text-orange-600 font-medium">Ask: ${asking}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══ SELECTION ACTION BAR ═══ */}
      {selectedIds.size > 0 && (
        <div className="sticky bottom-4 z-40 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-lg">
          <span className="text-sm font-medium text-indigo-800">
            {selectedIds.size} comic{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCreateBundle}
              className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-medium text-white hover:bg-orange-700 transition-colors"
            >
              📦 Create Bundle
            </button>
            {selectedIds.size >= 3 && selectedIds.size <= 12 && (
              <button
                onClick={handleSetToCoverArt}
                className="rounded-lg bg-pink-600 px-4 py-2 text-xs font-medium text-white hover:bg-pink-700 transition-colors"
              >
                🎨 Set to Cover Art
              </button>
            )}
            <button
              onClick={clearSelection}
              className="rounded-lg bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
