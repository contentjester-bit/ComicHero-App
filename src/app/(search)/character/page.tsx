"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { CharacterSearchForm } from "@/components/search/character-search-form";
import { AddToCollectionModal } from "@/components/comics/add-to-collection-modal";
import { WantListButton } from "@/components/comics/want-list-button";
import { useCollection } from "@/hooks/use-collection";
import type { Character, KeyIssue, ComicIssue } from "@/types/comic";
import type { Listing } from "@/types/listing";
import type { ApiResponse } from "@/types/api";

// Persist search state across navigations
const searchCache: {
  characters: Character[];
  query: string;
  expandedId: number | null;
  keyIssues: Record<number, KeyIssue[]>;
  ebayListings: Listing[];
} = {
  characters: [],
  query: "",
  expandedId: null,
  keyIssues: {},
  ebayListings: [],
};

export default function CharacterSearchPage() {
  const [characters, setCharacters] = useState<Character[]>(searchCache.characters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{ ebayEnabled: boolean } | null>(null);
  const [ebayListings, setEbayListings] = useState<Listing[]>(searchCache.ebayListings);
  const [ebayLoading, setEbayLoading] = useState(false);
  const [ebayTotal, setEbayTotal] = useState(0);

  // Expanded character + key issues
  const [expandedCharId, setExpandedCharId] = useState<number | null>(searchCache.expandedId);
  const [keyIssuesMap, setKeyIssuesMap] = useState<Record<number, KeyIssue[]>>(searchCache.keyIssues);
  const [keyIssuesLoading, setKeyIssuesLoading] = useState(false);

  // Collection / modal
  const { addToCollection, isOwned } = useCollection();
  const [modalIssue, setModalIssue] = useState<ComicIssue | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ ebayEnabled: false }));
  }, []);

  // Persist to cache on state change
  useEffect(() => {
    searchCache.characters = characters;
    searchCache.keyIssues = keyIssuesMap;
    searchCache.expandedId = expandedCharId;
    searchCache.ebayListings = ebayListings;
  }, [characters, keyIssuesMap, expandedCharId, ebayListings]);

  const handleSearch = useCallback(
    async (characterName: string, maxPrice?: number, sort?: string) => {
      setLoading(true);
      setError(null);
      setExpandedCharId(null);
      searchCache.query = characterName;

      try {
        const params = new URLSearchParams({ query: characterName, resources: "character" });
        const res = await fetch(`/api/comicvine/search?${params}`);
        const data: ApiResponse<{ characters: Character[] }> = await res.json();
        if (data.success && data.data?.characters) {
          setCharacters(data.data.characters);
        } else {
          setError(data.error || "Search failed");
          setCharacters([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setCharacters([]);
      } finally {
        setLoading(false);
      }

      // eBay search
      if (config?.ebayEnabled) {
        setEbayLoading(true);
        try {
          const ebayParams = new URLSearchParams({
            characterName,
            ...(maxPrice && { maxPrice: String(maxPrice) }),
            ...(sort && { sort }),
          });
          const res = await fetch(`/api/ebay/search?${ebayParams}`);
          const data: ApiResponse<Listing[]> = await res.json();
          if (data.success && data.data) {
            setEbayListings(data.data);
            setEbayTotal(data.meta?.total ?? data.data.length);
          }
        } catch { /* */ }
        finally { setEbayLoading(false); }
      }
    },
    [config]
  );

  // Expand character to show key issues
  const handleExpandCharacter = async (character: Character) => {
    const charId = character.comicVineId;
    if (expandedCharId === charId) {
      setExpandedCharId(null);
      return;
    }
    setExpandedCharId(charId);

    // Already cached?
    if (keyIssuesMap[charId]) return;

    setKeyIssuesLoading(true);
    try {
      const res = await fetch(`/api/comicvine/key-issues?characterId=${charId}&images=true`);
      const data: ApiResponse<KeyIssue[]> = await res.json();
      if (data.success && data.data) {
        setKeyIssuesMap((prev) => ({ ...prev, [charId]: data.data!.slice(0, 10) }));
      }
    } catch { /* */ }
    finally { setKeyIssuesLoading(false); }
  };

  // Handle add to collection via modal
  async function handleModalAdd(issueData: Parameters<typeof addToCollection>[0]) {
    return await addToCollection(issueData);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🦸 Search by Character</h1>
        <p className="mt-1 text-sm text-gray-600">
          Look up characters and discover their key issues
          {config?.ebayEnabled && " — eBay prices included"}
        </p>
      </div>

      <CharacterSearchForm
        onSearch={handleSearch}
        loading={loading || ebayLoading}
        ebayEnabled={config?.ebayEnabled ?? false}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* ═══ CHARACTER RESULTS ═══ */}
      {characters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Characters ({characters.length} found)
          </h2>

          <div className="space-y-4">
            {characters.map((character) => {
              const isExpanded = expandedCharId === character.comicVineId;
              const charKeyIssues = keyIssuesMap[character.comicVineId] || [];

              return (
                <div key={character.comicVineId}>
                  {/* Character Card */}
                  <div
                    className={`flex gap-4 rounded-xl border-2 bg-white p-4 transition-shadow hover:shadow-md cursor-pointer ${
                      isExpanded ? "border-purple-300 shadow-md" : "border-gray-200"
                    }`}
                    onClick={() => handleExpandCharacter(character)}
                  >
                    {/* Image */}
                    <div className="shrink-0">
                      {character.imageUrl ? (
                        <img src={character.imageUrl} alt={character.name} className="h-28 w-20 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-purple-50">
                          <svg className="h-10 w-10 text-purple-300" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{character.name}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {character.publisher && (
                              <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">{character.publisher}</span>
                            )}
                            {character.realName && (
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{character.realName}</span>
                            )}
                            {character.issueCount > 0 && (
                              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">
                                {character.issueCount.toLocaleString()} appearances
                              </span>
                            )}
                          </div>
                        </div>
                        <svg
                          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>

                      {character.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">{character.description}</p>
                      )}

                      {/* Action buttons */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Link
                          href={`/character/${character.comicVineId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                        >
                          Full Profile →
                        </Link>
                        <Link
                          href={`/curate?search=${encodeURIComponent(character.name)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                        >
                          📚 Go to Curate →
                        </Link>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExpandCharacter(character); }}
                          className="rounded bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          🔑 {isExpanded ? "Hide" : "Show"} Key Issues
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ═══ EXPANDED: Key Issues for this character ═══ */}
                  {isExpanded && (
                    <div className="ml-4 mt-2 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                      <h4 className="font-bold text-amber-900">
                        🔑 Top Key Issues — {character.name}
                      </h4>

                      {keyIssuesLoading && !charKeyIssues.length ? (
                        <div className="mt-3 text-sm text-gray-500">Loading key issues...</div>
                      ) : charKeyIssues.length === 0 ? (
                        <p className="mt-3 text-sm text-gray-500">
                          No specific key issues found in database. Try searching for the character&apos;s first appearance series in Issue Search.
                        </p>
                      ) : (
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                          {charKeyIssues.map((ki) => {
                            const owned = ki.comicVineIssueId ? isOwned(ki.comicVineIssueId) : false;
                            return (
                              <div
                                key={ki.id}
                                className={`flex flex-col overflow-hidden rounded-lg border bg-white ${
                                  owned ? "border-green-300" : "border-amber-200"
                                }`}
                              >
                                {ki.comicVineIssueId ? (
                                  <Link href={`/issue/${ki.comicVineIssueId}`} className="aspect-[3/4] bg-gray-100">
                                    {ki.imageUrl ? (
                                      <img src={ki.imageUrl} alt="" className="h-full w-full object-contain" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center bg-amber-100">
                                        <span className="text-sm font-bold text-amber-700">#{ki.issueNumber}</span>
                                      </div>
                                    )}
                                  </Link>
                                ) : (
                                  <div className="aspect-[3/4] bg-gray-100">
                                    {ki.imageUrl ? (
                                      <img src={ki.imageUrl} alt="" className="h-full w-full object-contain" />
                                    ) : (
                                      <div className="flex h-full items-center justify-center bg-amber-100">
                                        <span className="text-sm font-bold text-amber-700">#{ki.issueNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="p-2">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {ki.volumeName} #{ki.issueNumber}
                                  </p>
                                  <p className="mt-0.5 text-[10px] text-amber-700 line-clamp-2">{ki.reason}</p>
                                  {ki.coverDate && (
                                    <p className="text-[10px] text-gray-400">{ki.coverDate}</p>
                                  )}
                                  <div className="mt-1.5 flex gap-1">
                                    {owned ? (
                                      <span className="text-[10px] font-bold text-green-600">✓ Owned</span>
                                    ) : (
                                      <>
                                        {ki.comicVineIssueId && (
                                          <button
                                            onClick={() => setModalIssue({
                                              comicVineId: ki.comicVineIssueId!,
                                              id: String(ki.comicVineIssueId),
                                              volumeId: "0",
                                              volumeName: ki.volumeName,
                                              issueNumber: ki.issueNumber,
                                              name: ki.reason,
                                              imageUrl: ki.imageUrl,
                                              coverDate: ki.coverDate || null,
                                              description: null,
                                              characterIds: [],
                                            })}
                                            className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200"
                                          >
                                            + Collect
                                          </button>
                                        )}
                                        <WantListButton volumeName={ki.volumeName} issueNumber={ki.issueNumber} />
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
        </div>
      )}

      {/* Empty state */}
      {!loading && characters.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center text-gray-500">
          <p className="text-sm">Search for a character to see their key issues, first appearances, and more.</p>
        </div>
      )}

      {/* Add to Collection Modal */}
      {modalIssue && (
        <AddToCollectionModal
          issue={{
            comicVineIssueId: modalIssue.comicVineId,
            comicVineVolumeId: parseInt(modalIssue.volumeId, 10) || 0,
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
