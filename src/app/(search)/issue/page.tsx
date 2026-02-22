"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { IssueSearchForm } from "@/components/search/issue-search-form";
import { AddToCollectionModal } from "@/components/comics/add-to-collection-modal";
import { WantListButton } from "@/components/comics/want-list-button";
import { useCollection } from "@/hooks/use-collection";
import type { ComicVolume, ComicIssue } from "@/types/comic";
import type { Listing } from "@/types/listing";
import type { ApiResponse } from "@/types/api";

// Key issue detection
function detectKeyIssue(issue: ComicIssue): string | null {
  if (issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0)
    return `1st: ${issue.firstAppearanceCharacters.join(", ")}`;
  if (issue.issueNumber === "1") return "First issue";
  const d = ((issue.description || "") + " " + (issue.name || "")).toLowerCase();
  if (d.includes("first appearance")) return "First appearance";
  if (d.includes("death of") || d.includes("dies")) return "Character death";
  if (d.includes("origin")) return "Origin story";
  const n = parseInt(issue.issueNumber, 10);
  if ([100, 200, 300, 400, 500].includes(n)) return `Milestone #${n}`;
  return null;
}

// ══════ MODULE-LEVEL CACHE for back-button state persistence ══════
const searchCache = {
  volumes: [] as ComicVolume[],
  directIssues: [] as ComicIssue[],
  ebayListings: [] as Listing[],
  ebayTotal: 0,
  expandedVolumeId: null as number | null,
  expandedIssues: [] as ComicIssue[],
  lastSearch: null as { volumeName: string; issueNumber: string; year?: string } | null,
  ebayByIssue: {} as Record<string, Listing[]>,
};

function IssueSearchContent() {
  const searchParams = useSearchParams();
  const initialVolumeName = searchParams.get("volumeName") || "";
  const initialIssueNumber = searchParams.get("issueNumber") || "";

  const [config, setConfig] = useState<{ ebayEnabled: boolean } | null>(null);

  // Restore from cache
  const [volumes, setVolumes] = useState<ComicVolume[]>(searchCache.volumes);
  const [directIssues, setDirectIssues] = useState<ComicIssue[]>(searchCache.directIssues);
  const [ebayListings, setEbayListings] = useState<Listing[]>(searchCache.ebayListings);
  const [ebayTotal, setEbayTotal] = useState(searchCache.ebayTotal);
  const [loading, setLoading] = useState(false);
  const [ebayLoading, setEbayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedVolumeId, setExpandedVolumeId] = useState<number | null>(searchCache.expandedVolumeId);
  const [expandedIssues, setExpandedIssues] = useState<ComicIssue[]>(searchCache.expandedIssues);
  const [expandedLoading, setExpandedLoading] = useState(false);

  const { addToCollection, removeFromCollection, isOwned } = useCollection();
  const [modalIssue, setModalIssue] = useState<ComicIssue | null>(null);

  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);

  const [lastSearch, setLastSearch] = useState<{ volumeName: string; issueNumber: string; year?: string } | null>(searchCache.lastSearch);

  // eBay prices per issue key
  const [ebayByIssue, setEbayByIssue] = useState<Record<string, Listing[]>>(searchCache.ebayByIssue);

  // Persist to cache
  useEffect(() => {
    searchCache.volumes = volumes;
    searchCache.directIssues = directIssues;
    searchCache.ebayListings = ebayListings;
    searchCache.ebayTotal = ebayTotal;
    searchCache.expandedVolumeId = expandedVolumeId;
    searchCache.expandedIssues = expandedIssues;
    searchCache.lastSearch = lastSearch;
    searchCache.ebayByIssue = ebayByIssue;
  }, [volumes, directIssues, ebayListings, ebayTotal, expandedVolumeId, expandedIssues, lastSearch, ebayByIssue]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ ebayEnabled: false }));
  }, []);

  useEffect(() => {
    if (initialVolumeName && !lastSearch) {
      handleSearch(initialVolumeName, initialIssueNumber);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(
    async (
      volumeName: string,
      issueNumber: string,
      year?: string,
      maxPrice?: number,
      sort?: string
    ) => {
      setLoading(true);
      setError(null);
      setDirectIssues([]);
      setVolumes([]);
      setExpandedVolumeId(null);
      setExpandedIssues([]);
      setSelectedIssues(new Set());
      setEbayByIssue({});
      setLastSearch({ volumeName, issueNumber, year });

      try {
        if (issueNumber) {
          const params = new URLSearchParams({
            query: volumeName,
            issueNumber,
            ...(year && { year }),
          });
          const res = await fetch(`/api/comicvine/search-issue?${params}`);
          const data: ApiResponse<{ issues: ComicIssue[]; volume: ComicVolume | null }> = await res.json();
          if (data.success && data.data) {
            setDirectIssues(data.data.issues || []);
            if (data.data.volume) setVolumes([data.data.volume]);
          } else {
            const vRes = await fetch(`/api/comicvine/search?query=${encodeURIComponent(volumeName)}&resources=volume`);
            const vData = await vRes.json();
            if (vData.success && vData.data?.volumes) setVolumes(vData.data.volumes);
          }
        } else {
          const params = new URLSearchParams({ query: volumeName, resources: "volume" });
          const res = await fetch(`/api/comicvine/search?${params}`);
          const data = await res.json();
          if (data.success && data.data?.volumes) {
            let vols = data.data.volumes as ComicVolume[];
            if (year) {
              const y = parseInt(year, 10);
              vols = vols.filter((v: ComicVolume) => v.startYear && Math.abs(v.startYear - y) <= 2);
              if (vols.length === 0) vols = data.data.volumes;
            }
            setVolumes(vols);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }

      // eBay search in parallel
      if (config?.ebayEnabled && issueNumber) {
        setEbayLoading(true);
        try {
          const ebayParams = new URLSearchParams({ volumeName, issueNumber, ...(maxPrice && { maxPrice: String(maxPrice) }), ...(sort && { sort }) });
          const res = await fetch(`/api/ebay/search?${ebayParams}`);
          const data: ApiResponse<Listing[]> = await res.json();
          if (data.success && data.data) {
            setEbayListings(data.data);
            setEbayTotal(data.meta?.total ?? data.data.length);
            // Map eBay listings to issue key for inline display
            const key = `${volumeName.toLowerCase()}#${issueNumber}`;
            setEbayByIssue((prev) => ({ ...prev, [key]: data.data! }));
          }
        } catch { /* */ }
        finally { setEbayLoading(false); }
      } else {
        setEbayListings([]);
        setEbayTotal(0);
      }
    },
    [config]
  );

  const handleExpandVolume = async (vol: ComicVolume) => {
    if (expandedVolumeId === vol.comicVineId) {
      setExpandedVolumeId(null);
      setExpandedIssues([]);
      return;
    }
    setExpandedVolumeId(vol.comicVineId);
    setExpandedLoading(true);
    try {
      const res = await fetch(`/api/comicvine/volume/${vol.comicVineId}?limit=100`);
      const data = await res.json();
      if (data.success && data.data?.issues) setExpandedIssues(data.data.issues);
    } catch { /* */ }
    finally { setExpandedLoading(false); }
  };

  async function handleModalAdd(issueData: Parameters<typeof addToCollection>[0] & { condition?: string; pricePaid?: number; notes?: string }) {
    return await addToCollection(issueData);
  }

  function toggleSelect(issueId: number) {
    setSelectedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issueId)) next.delete(issueId);
      else next.add(issueId);
      return next;
    });
  }

  async function handleBulkAdd() {
    setBulkAdding(true);
    const allIssues = [...directIssues, ...expandedIssues];
    for (const id of selectedIssues) {
      const issue = allIssues.find((i) => i.comicVineId === id);
      if (issue && !isOwned(id)) {
        await addToCollection({
          comicVineIssueId: issue.comicVineId,
          comicVineVolumeId: parseInt(issue.volumeId, 10),
          volumeName: issue.volumeName,
          issueNumber: issue.issueNumber,
          name: issue.name,
          imageUrl: issue.imageUrl,
          coverDate: issue.coverDate,
        });
      }
    }
    setSelectedIssues(new Set());
    setBulkAdding(false);
  }

  // Get eBay price summary for an issue
  function getEbayPriceRange(volumeName: string, issueNumber: string): { min: number; max: number; avg: number; count: number } | null {
    const key = `${volumeName.toLowerCase()}#${issueNumber}`;
    const listings = ebayByIssue[key];
    if (!listings || listings.length === 0) return null;
    const prices = listings.map((l) => l.price).sort((a, b) => a - b);
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      avg: prices.reduce((s, p) => s + p, 0) / prices.length,
      count: listings.length,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🔍 Search by Issue</h1>
        <p className="mt-1 text-sm text-gray-600">
          Search for comics by title, issue number, and year
          {config?.ebayEnabled && " — eBay prices included"}
        </p>
      </div>

      <IssueSearchForm
        onSearch={handleSearch}
        loading={loading}
        initialVolumeName={lastSearch?.volumeName || initialVolumeName}
        initialIssueNumber={lastSearch?.issueNumber || initialIssueNumber}
        initialYear={lastSearch?.year || ""}
        ebayEnabled={config?.ebayEnabled ?? false}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ═══ DIRECT ISSUE RESULTS ═══ */}
      {directIssues.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            📖 Issue Results ({directIssues.length} found)
          </h2>

          {directIssues.map((issue) => {
            const keyInfo = detectKeyIssue(issue);
            const owned = isOwned(issue.comicVineId);
            const ebayRange = getEbayPriceRange(issue.volumeName, issue.issueNumber);

            return (
              <div
                key={issue.comicVineId}
                className={`rounded-xl border-2 bg-white p-4 transition-shadow hover:shadow-lg ${
                  keyInfo ? "border-amber-300" : "border-gray-200"
                } ${owned ? "ring-2 ring-green-200" : ""}`}
              >
                <div className="flex gap-4">
                  {/* Cover */}
                  <Link href={`/issue/${issue.comicVineId}`} className="shrink-0">
                    {issue.imageUrl ? (
                      <img src={issue.imageUrl} alt="" className="w-28 rounded-lg shadow-md" />
                    ) : (
                      <div className="flex h-40 w-28 items-center justify-center rounded-lg bg-indigo-50">
                        <span className="text-lg font-bold text-indigo-400">#{issue.issueNumber}</span>
                      </div>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/issue/${issue.comicVineId}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600">
                          {issue.volumeName} #{issue.issueNumber}
                        </Link>
                        {issue.name && <p className="text-sm text-gray-600">&ldquo;{issue.name}&rdquo;</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {keyInfo && (
                          <span className="shrink-0 rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                            🔑 {keyInfo}
                          </span>
                        )}
                        {/* Inline eBay Price */}
                        {ebayRange && (
                          <div className="rounded-lg bg-green-50 border border-green-200 px-2.5 py-1 text-right">
                            <p className="text-xs text-green-700 font-medium">eBay Market</p>
                            <p className="text-sm font-bold text-green-800">
                              ${ebayRange.min.toFixed(0)} – ${ebayRange.max.toFixed(0)}
                            </p>
                            <p className="text-[10px] text-green-600">
                              avg ${ebayRange.avg.toFixed(2)} · {ebayRange.count} listings
                            </p>
                          </div>
                        )}
                        {ebayLoading && !ebayRange && (
                          <span className="text-[10px] text-gray-400">Loading eBay...</span>
                        )}
                      </div>
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {issue.coverDate && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{issue.coverDate}</span>
                      )}
                      {issue.creators && issue.creators.length > 0 && (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {issue.creators.slice(0, 3).map((c) => c.name).join(", ")}
                        </span>
                      )}
                      {issue.characters && issue.characters.length > 0 && (
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                          {issue.characters.slice(0, 4).join(", ")}
                          {issue.characters.length > 4 && ` +${issue.characters.length - 4}`}
                        </span>
                      )}
                    </div>

                    {issue.description && (
                      <p className="line-clamp-2 text-sm text-gray-600">{issue.description.replace(/<[^>]*>/g, "").slice(0, 200)}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {owned ? (
                        <span className="inline-flex items-center gap-1 rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                          ✓ In Collection
                        </span>
                      ) : (
                        <button
                          onClick={() => setModalIssue(issue)}
                          className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add to Collection
                        </button>
                      )}
                      <WantListButton volumeName={issue.volumeName} issueNumber={issue.issueNumber} />
                      <Link href={`/issue/${issue.comicVineId}`} className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
                        Full Details →
                      </Link>
                      <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={selectedIssues.has(issue.comicVineId)}
                          onChange={() => toggleSelect(issue.comicVineId)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Select
                      </label>
                    </div>
                  </div>
                </div>

                {/* Issue → Series Connection Diagram */}
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className="inline-block h-3 w-3 rounded bg-indigo-500" />
                      <span className="font-medium">Issue #{issue.issueNumber}</span>
                    </div>
                    <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <button
                      onClick={() => handleExpandVolume(volumes.find((v) => String(v.comicVineId) === issue.volumeId) || { comicVineId: parseInt(issue.volumeId), name: issue.volumeName, issueCount: 0 } as ComicVolume)}
                      className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      <span className="inline-block h-3 w-3 rounded bg-purple-500" />
                      Series: {issue.volumeName}
                      <svg
                        className={`h-3 w-3 transition-transform ${expandedVolumeId === parseInt(issue.volumeId) ? "rotate-180" : ""}`}
                        fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {ebayRange && (
                      <>
                        <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                        <div className="flex items-center gap-1 rounded bg-green-50 px-2 py-0.5">
                          <span className="inline-block h-3 w-3 rounded bg-green-500" />
                          <span className="font-medium text-green-700">eBay: ${ebayRange.avg.toFixed(2)} avg</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ VOLUME (SERIES) RESULTS ═══ */}
      {volumes.length > 0 && directIssues.length === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            📚 Comic Series ({volumes.length} found)
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {volumes.map((volume) => (
              <div key={volume.comicVineId} className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
                <Link href={`/volume/${volume.comicVineId}`} className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                  {volume.imageUrl ? (
                    <img src={volume.imageUrl} alt={volume.name} className="h-full w-full object-contain transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="p-4 text-center"><p className="text-lg font-bold text-indigo-600">{volume.name}</p></div>
                  )}
                  <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5">
                    <span className="text-xs font-medium text-white">{volume.issueCount} issues</span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{volume.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {volume.publisher && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">{volume.publisher}</span>}
                    {volume.startYear && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{volume.startYear}</span>}
                  </div>
                  <button
                    onClick={() => handleExpandVolume(volume)}
                    className="mt-auto text-left text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {expandedVolumeId === volume.comicVineId ? "▼ Hide issues" : "▶ Browse issues"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ EXPANDED SERIES ISSUES ═══ */}
      {expandedVolumeId && (
        <div className="rounded-xl border-2 border-purple-200 bg-purple-50 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-purple-900">
              Issues in Series
            </h3>
            <button
              onClick={() => { setExpandedVolumeId(null); setExpandedIssues([]); }}
              className="text-xs text-purple-600 hover:text-purple-800"
            >
              Close ✕
            </button>
          </div>

          {expandedLoading ? (
            <div className="mt-3 text-sm text-gray-500">Loading issues...</div>
          ) : (
            <div className="mt-3 space-y-4">
              {/* Key issues highlight */}
              {expandedIssues.filter((i) => detectKeyIssue(i)).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">🔑 Key Issues</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {expandedIssues
                      .filter((i) => detectKeyIssue(i))
                      .map((issue) => {
                        const key = detectKeyIssue(issue)!;
                        const owned = isOwned(issue.comicVineId);
                        return (
                          <div key={issue.comicVineId} className={`flex-shrink-0 w-24 rounded-lg border ${owned ? "border-green-300 bg-green-50" : "border-amber-200 bg-white"}`}>
                            <Link href={`/issue/${issue.comicVineId}`} className="block aspect-[3/4] bg-gray-100 rounded-t-lg overflow-hidden">
                              {issue.imageUrl ? (
                                <img src={issue.imageUrl} alt="" className="h-full w-full object-contain" />
                              ) : (
                                <div className="flex h-full items-center justify-center bg-amber-100"><span className="text-sm font-bold text-amber-700">#{issue.issueNumber}</span></div>
                              )}
                            </Link>
                            <div className="p-1.5">
                              <p className="text-[10px] font-bold text-gray-900">#{issue.issueNumber}</p>
                              <p className="text-[8px] text-amber-700 leading-tight">{key}</p>
                              <div className="mt-1 flex gap-0.5">
                                {owned ? (
                                  <span className="text-[8px] text-green-600 font-bold">✓</span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setModalIssue(issue)}
                                      className="rounded bg-green-100 px-1 py-0.5 text-[8px] text-green-700 hover:bg-green-200"
                                    >
                                      + Collect
                                    </button>
                                    <label className="flex items-center gap-0.5 text-[8px] text-gray-400">
                                      <input type="checkbox" checked={selectedIssues.has(issue.comicVineId)} onChange={() => toggleSelect(issue.comicVineId)} className="h-2.5 w-2.5 rounded" />
                                    </label>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Full issue grid */}
              <details className="rounded-lg border border-gray-200 bg-white">
                <summary className="cursor-pointer p-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  View all {expandedIssues.length} issues
                </summary>
                <div className="grid grid-cols-5 gap-1 p-3 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-14">
                  {expandedIssues.map((issue) => {
                    const key = detectKeyIssue(issue);
                    const owned = isOwned(issue.comicVineId);
                    return (
                      <div key={issue.comicVineId} className={`relative flex flex-col overflow-hidden rounded border ${key ? "border-amber-300" : owned ? "border-green-300" : "border-gray-200"}`}>
                        <Link href={`/issue/${issue.comicVineId}`} className="aspect-[3/4] bg-gray-100">
                          {issue.imageUrl ? (
                            <img src={issue.imageUrl} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-50"><span className="text-[10px] font-bold text-gray-400">#{issue.issueNumber}</span></div>
                          )}
                        </Link>
                        <div className="p-0.5 text-center">
                          <p className="text-[8px] font-bold text-gray-900">#{issue.issueNumber}</p>
                          {key && <span className="text-[7px] text-red-600">🔑</span>}
                          {owned && <span className="text-[7px] text-green-600">✓</span>}
                        </div>
                        {!owned && (
                          <label className="absolute right-0.5 top-0.5">
                            <input type="checkbox" checked={selectedIssues.has(issue.comicVineId)} onChange={() => toggleSelect(issue.comicVineId)} className="h-3 w-3 rounded border-gray-300 text-indigo-600" />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* ═══ BULK ADD BAR ═══ */}
      {selectedIssues.size > 0 && (
        <div className="sticky bottom-4 z-40 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 shadow-lg">
          <span className="text-sm font-medium text-green-800">
            {selectedIssues.size} issue{selectedIssues.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIssues(new Set())} className="rounded px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100">
              Clear
            </button>
            <button
              onClick={handleBulkAdd}
              disabled={bulkAdding}
              className="rounded bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {bulkAdding ? "Adding..." : `Add ${selectedIssues.size} to Collection`}
            </button>
          </div>
        </div>
      )}

      {/* ═══ EBAY LISTINGS ═══ */}
      {config?.ebayEnabled && ebayTotal > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            🛒 eBay Listings ({ebayTotal} found)
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ebayListings.slice(0, 9).map((listing) => (
              <a
                key={listing.itemId}
                href={listing.itemUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md"
              >
                {listing.imageUrl && (
                  <img src={listing.imageUrl} alt="" className="h-20 w-14 shrink-0 rounded object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="line-clamp-2 text-sm font-medium text-gray-900">{listing.title}</p>
                  <p className="mt-1 text-lg font-bold text-green-600">${listing.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{listing.condition}</p>
                </div>
              </a>
            ))}
          </div>
          {ebayTotal > 9 && (
            <p className="text-center text-xs text-gray-500">{ebayTotal - 9} more listings available</p>
          )}
        </div>
      )}

      {ebayLoading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
          Loading eBay prices...
        </div>
      )}

      {!config?.ebayEnabled && (volumes.length > 0 || directIssues.length > 0) && (
        <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
          eBay listing search will be available once you configure your eBay API credentials.
        </div>
      )}

      {/* Empty state */}
      {!loading && volumes.length === 0 && directIssues.length === 0 && lastSearch && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
          <p className="text-sm">No results found. Try adjusting your search terms.</p>
        </div>
      )}

      {/* Add to Collection Modal */}
      {modalIssue && (
        <AddToCollectionModal
          issue={{
            comicVineIssueId: modalIssue.comicVineId,
            comicVineVolumeId: parseInt(modalIssue.volumeId, 10),
            volumeName: modalIssue.volumeName,
            issueNumber: modalIssue.issueNumber,
            name: modalIssue.name,
            imageUrl: modalIssue.imageUrl,
            coverDate: modalIssue.coverDate,
          }}
          onAdd={handleModalAdd}
          onClose={() => setModalIssue(null)}
        />
      )}
    </div>
  );
}

export default function IssueSearchPage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400">Loading...</div>}>
      <IssueSearchContent />
    </Suspense>
  );
}
