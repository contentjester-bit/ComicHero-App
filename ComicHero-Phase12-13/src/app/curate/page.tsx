"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { ComicIssue, ComicVolume } from "@/types/comic";

// ── Static Story Paths (pre-built reading orders) ──
interface ComicNode {
  id: string;
  volumeName: string;
  issueNumber: string;
  coverDate?: string;
  imageUrl?: string;
  reason: string;
  category: string;
  significance: number;
  comicVineIssueId?: number;
}

interface StoryPath {
  id: string;
  name: string;
  description: string;
  nodes: ComicNode[];
  color: string;
}

const STORY_PATHS: StoryPath[] = [
  {
    id: "xmen-saga", name: "X-Men Saga",
    description: "The complete X-Men reading order from debut to Claremont's golden age",
    color: "from-yellow-400 to-orange-500",
    nodes: [
      { id: "xmen-1", volumeName: "X-Men", issueNumber: "1", coverDate: "1963-09", reason: "First appearance of the X-Men and Magneto", category: "first_appearance", significance: 10, comicVineIssueId: 6450 },
      { id: "xmen-4", volumeName: "X-Men", issueNumber: "4", coverDate: "1964-03", reason: "First appearance of Scarlet Witch & Quicksilver", category: "first_appearance", significance: 9, comicVineIssueId: 6453 },
      { id: "xmen-12", volumeName: "X-Men", issueNumber: "12", coverDate: "1965-07", reason: "First appearance of Juggernaut", category: "first_appearance", significance: 8, comicVineIssueId: 6461 },
      { id: "gxm-1", volumeName: "Giant-Size X-Men", issueNumber: "1", coverDate: "1975-05", reason: "New team! Wolverine, Storm, Colossus, Nightcrawler debut", category: "first_appearance", significance: 10, comicVineIssueId: 26511 },
      { id: "xmen-94", volumeName: "X-Men", issueNumber: "94", coverDate: "1975-08", reason: "New X-Men era begins", category: "major_storyline", significance: 9, comicVineIssueId: 6543 },
      { id: "xmen-101", volumeName: "X-Men", issueNumber: "101", coverDate: "1976-10", reason: "Phoenix saga begins", category: "major_storyline", significance: 10, comicVineIssueId: 6550 },
      { id: "xmen-129", volumeName: "X-Men", issueNumber: "129", coverDate: "1980-01", reason: "First Kitty Pryde & Emma Frost", category: "first_appearance", significance: 9, comicVineIssueId: 6578 },
      { id: "xmen-137", volumeName: "X-Men", issueNumber: "137", coverDate: "1980-09", reason: "Death of Phoenix — iconic", category: "death", significance: 10, comicVineIssueId: 6586 },
      { id: "xmen-141", volumeName: "X-Men", issueNumber: "141", coverDate: "1981-01", reason: "Days of Future Past", category: "major_storyline", significance: 10, comicVineIssueId: 6590 },
    ],
  },
  {
    id: "spider-man-essentials", name: "Spider-Man Essentials",
    description: "Must-read Spidey issues from debut to key Bronze Age books",
    color: "from-red-500 to-blue-600",
    nodes: [
      { id: "af-15", volumeName: "Amazing Fantasy", issueNumber: "15", coverDate: "1962-08", reason: "First appearance of Spider-Man", category: "first_appearance", significance: 10, comicVineIssueId: 6637 },
      { id: "asm-14", volumeName: "Amazing Spider-Man", issueNumber: "14", coverDate: "1964-07", reason: "First Green Goblin", category: "first_appearance", significance: 9, comicVineIssueId: 6693 },
      { id: "asm-50", volumeName: "Amazing Spider-Man", issueNumber: "50", coverDate: "1967-07", reason: "Spider-Man No More! Iconic cover", category: "major_storyline", significance: 8, comicVineIssueId: 6729 },
      { id: "asm-121", volumeName: "Amazing Spider-Man", issueNumber: "121", coverDate: "1973-06", reason: "Death of Gwen Stacy", category: "death", significance: 10, comicVineIssueId: 6800 },
      { id: "asm-129", volumeName: "Amazing Spider-Man", issueNumber: "129", coverDate: "1974-02", reason: "First Punisher", category: "first_appearance", significance: 10, comicVineIssueId: 6808 },
      { id: "asm-252", volumeName: "Amazing Spider-Man", issueNumber: "252", coverDate: "1984-05", reason: "First black costume / symbiote", category: "major_storyline", significance: 9, comicVineIssueId: 6931 },
      { id: "asm-300", volumeName: "Amazing Spider-Man", issueNumber: "300", coverDate: "1988-05", reason: "First full Venom", category: "first_appearance", significance: 10, comicVineIssueId: 6979 },
    ],
  },
  {
    id: "wolverine-origins", name: "Wolverine Origins",
    description: "Tracing Wolverine from first appearance through solo series",
    color: "from-yellow-600 to-gray-700",
    nodes: [
      { id: "ish-181", volumeName: "Incredible Hulk", issueNumber: "181", coverDate: "1974-11", reason: "First full Wolverine", category: "first_appearance", significance: 10, comicVineIssueId: 21491 },
      { id: "gxm-1-w", volumeName: "Giant-Size X-Men", issueNumber: "1", coverDate: "1975-05", reason: "Wolverine joins X-Men", category: "major_storyline", significance: 10, comicVineIssueId: 26511 },
      { id: "wol-1-mini", volumeName: "Wolverine", issueNumber: "1", coverDate: "1982-09", reason: "First solo series (mini)", category: "major_storyline", significance: 9, comicVineIssueId: 7396 },
      { id: "wol-1-ong", volumeName: "Wolverine", issueNumber: "1", coverDate: "1988-11", reason: "Ongoing series launches", category: "major_storyline", significance: 8, comicVineIssueId: 8282 },
      { id: "wol-10", volumeName: "Wolverine", issueNumber: "10", coverDate: "1989-08", reason: "Sabretooth in Wolverine solo", category: "first_appearance", significance: 8, comicVineIssueId: 8291 },
    ],
  },
];

const catColors: Record<string, string> = {
  first_appearance: "bg-blue-100 text-blue-800 border-blue-200",
  death: "bg-red-100 text-red-800 border-red-200",
  origin: "bg-purple-100 text-purple-800 border-purple-200",
  major_storyline: "bg-amber-100 text-amber-800 border-amber-200",
  key_crossover: "bg-green-100 text-green-800 border-green-200",
};

const catLabel: Record<string, string> = {
  first_appearance: "1st App",
  death: "Death",
  origin: "Origin",
  major_storyline: "Key Story",
  key_crossover: "Crossover",
};

function CurateContent() {
  const curateSearchParams = useSearchParams();
  const initialSearch = curateSearchParams?.get("search") || "";
  
  const [activePath, setActivePath] = useState<StoryPath>(STORY_PATHS[0]);
  const [selectedNode, setSelectedNode] = useState<ComicNode | null>(null);
  const [aiStory, setAiStory] = useState<string | null>(null);
  const [loadingStory, setLoadingStory] = useState(false);

  // ── Live search: find a series and show its key issues ──
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searchResults, setSearchResults] = useState<ComicVolume[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<ComicVolume | null>(null);
  const [volumeIssues, setVolumeIssues] = useState<ComicIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [coverCache, setCoverCache] = useState<Record<number, string>>({});

  // Auto-search if query param provided
  useEffect(() => {
    if (initialSearch) {
      handleSearchDirect(initialSearch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Direct search helper for auto-search
  const handleSearchDirect = async (query: string) => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/comicvine/search?query=${encodeURIComponent(query)}&resources=volume`);
      const data = await res.json();
      if (data.success && data.data?.volumes) setSearchResults(data.data.volumes);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  };

  // Search for series
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/comicvine/search?query=${encodeURIComponent(searchQuery)}&resources=volume`);
      const data = await res.json();
      if (data.success && data.data?.volumes) setSearchResults(data.data.volumes);
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }, [searchQuery]);

  // Load issues for selected volume
  const handleSelectVolume = async (vol: ComicVolume) => {
    setSelectedVolume(vol);
    setVolumeIssues([]);
    setIssuesLoading(true);
    try {
      const res = await fetch(`/api/comicvine/volume/${vol.comicVineId}?limit=100`);
      const data = await res.json();
      if (data.success && data.data?.issues) setVolumeIssues(data.data.issues);
    } catch { /* */ }
    finally { setIssuesLoading(false); }
  };

  // Fetch real cover for a static node
  const fetchNodeCover = async (node: ComicNode) => {
    if (!node.comicVineIssueId || coverCache[node.comicVineIssueId]) return;
    try {
      const res = await fetch(`/api/comicvine/issue/${node.comicVineIssueId}`);
      const data = await res.json();
      if (data.success && data.data?.imageUrl) {
        setCoverCache(prev => ({ ...prev, [node.comicVineIssueId!]: data.data.imageUrl }));
      }
    } catch { /* */ }
  };

  const handleGetStory = async () => {
    setLoadingStory(true); setAiStory(null);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeName: activePath.name, issueNumber: "Reading Order", condition: "NM", mode: "curate",
          description: `Explain the reading order: ${activePath.nodes.map(n => `${n.volumeName} #${n.issueNumber} (${n.reason})`).join(", ")}`,
        }),
      });
      const data = await res.json();
      if (data.success) setAiStory(data.data.description);
      else setAiStory("AI not available. Make sure OPENAI_API_KEY is set in Vercel.");
    } catch { setAiStory("Failed to generate. Check OpenAI API key."); }
    finally { setLoadingStory(false); }
  };

  // Detect key issues from live volume search
  function isKeyIssue(issue: ComicIssue): string | null {
    if (issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0) return `1st: ${issue.firstAppearanceCharacters.join(", ")}`;
    if (issue.issueNumber === "1") return "First issue";
    const d = ((issue.description || "") + " " + (issue.name || "")).toLowerCase();
    if (d.includes("first appearance")) return "First appearance";
    if (d.includes("death of") || d.includes("dies")) return "Character death";
    if (d.includes("origin")) return "Origin story";
    const n = parseInt(issue.issueNumber, 10);
    if ([100,200,300,400,500].includes(n)) return `Milestone #${n}`;
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 p-6 text-white">
        <h1 className="text-3xl font-bold">📚 Curate</h1>
        <p className="mt-1 text-purple-100">Connect story dots. Build reading orders. Discover how comics connect.</p>
      </div>

      {/* ── LIVE SEARCH: Build Your Own Reading Order ── */}
      <div className="rounded-lg border-2 border-indigo-300 bg-indigo-50 p-6">
        <h2 className="text-xl font-bold text-gray-900">🔍 Explore Any Series</h2>
        <p className="mt-1 text-sm text-gray-600">Search for a series and see its key issues with real covers</p>
        <div className="mt-4 flex gap-2">
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. Fantastic Four, Avengers, Batman..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button onClick={handleSearch} disabled={searchLoading || !searchQuery.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400">
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {searchResults.map((vol) => (
              <button key={vol.comicVineId} onClick={() => handleSelectVolume(vol)}
                className={`flex flex-col overflow-hidden rounded-lg border bg-white text-left transition-all hover:shadow-md ${selectedVolume?.comicVineId === vol.comicVineId ? "border-indigo-500 ring-2 ring-indigo-200" : "border-gray-200"}`}>
                {vol.imageUrl ? (
                  <div className="aspect-[3/4] bg-gray-100"><img src={vol.imageUrl} alt={vol.name} className="h-full w-full object-contain" /></div>
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center bg-indigo-100"><span className="text-xs font-bold text-indigo-600">{vol.name}</span></div>
                )}
                <div className="p-2">
                  <p className="text-xs font-bold text-gray-900 truncate">{vol.name}</p>
                  <p className="text-[10px] text-gray-500">{vol.publisher} • {vol.startYear} • {vol.issueCount} issues</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Volume issues with key detection */}
        {selectedVolume && (
          <div className="mt-4">
            <h3 className="text-lg font-bold text-gray-900">{selectedVolume.name} — Key Issues</h3>
            <p className="text-xs text-gray-500">{selectedVolume.publisher} • Started {selectedVolume.startYear} • {selectedVolume.issueCount} total issues</p>
            {issuesLoading ? (
              <div className="mt-3 text-sm text-gray-500">Loading issues...</div>
            ) : (
              <div className="mt-3 space-y-2">
                {/* Key issues first */}
                {volumeIssues.filter(i => isKeyIssue(i)).length > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <h4 className="text-sm font-bold text-amber-900">🔑 Key Issues Found</h4>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                      {volumeIssues.filter(i => isKeyIssue(i)).map((issue) => (
                        <Link key={issue.comicVineId} href={`/issue/${issue.comicVineId}`}
                          className="flex flex-col overflow-hidden rounded-lg border border-amber-200 bg-white hover:shadow-md">
                          {issue.imageUrl ? (
                            <div className="aspect-[3/4] bg-gray-100"><img src={issue.imageUrl} alt="" className="h-full w-full object-contain" /></div>
                          ) : (
                            <div className="flex aspect-[3/4] items-center justify-center bg-amber-100"><span className="text-sm font-bold text-amber-700">#{issue.issueNumber}</span></div>
                          )}
                          <div className="p-1.5">
                            <p className="text-[10px] font-bold text-gray-900">#{issue.issueNumber}</p>
                            <p className="text-[9px] text-amber-700 font-medium">{isKeyIssue(issue)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* All issues grid */}
                <details className="rounded-lg border border-gray-200 bg-white">
                  <summary className="cursor-pointer p-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View all {volumeIssues.length} issues
                  </summary>
                  <div className="grid grid-cols-4 gap-1 p-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
                    {volumeIssues.map((issue) => {
                      const key = isKeyIssue(issue);
                      return (
                        <Link key={issue.comicVineId} href={`/issue/${issue.comicVineId}`}
                          className={`flex flex-col overflow-hidden rounded border bg-white hover:shadow ${key ? "border-amber-300" : "border-gray-200"}`}>
                          {issue.imageUrl ? (
                            <div className="aspect-[3/4] bg-gray-100"><img src={issue.imageUrl} alt="" className="h-full w-full object-contain" /></div>
                          ) : (
                            <div className="flex aspect-[3/4] items-center justify-center bg-gray-50"><span className="text-[10px] font-bold text-gray-500">#{issue.issueNumber}</span></div>
                          )}
                          <div className="p-0.5">
                            <p className="text-[9px] font-bold text-gray-900 truncate">#{issue.issueNumber}</p>
                            {key && <span className="text-[8px] font-bold text-red-600">🔑</span>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── CURATED STORY PATHS ── */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">📖 Curated Reading Orders</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STORY_PATHS.map((path) => (
            <button key={path.id} onClick={() => { setActivePath(path); setSelectedNode(null); setAiStory(null); }}
              className={`rounded-lg p-4 text-left transition-all ${activePath.id === path.id ? "ring-2 ring-indigo-500 bg-indigo-50" : "border border-gray-200 bg-white hover:bg-gray-50"}`}>
              <div className={`mb-2 h-2 w-12 rounded-full bg-gradient-to-r ${path.color}`} />
              <h3 className="font-bold text-gray-900">{path.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{path.description}</p>
              <p className="mt-2 text-xs font-medium text-indigo-600">{path.nodes.length} key issues</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Story */}
      <div className="flex items-center gap-3">
        <button onClick={handleGetStory} disabled={loadingStory}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-400">
          {loadingStory ? "🤖 Generating..." : "🤖 AI: Tell Me This Story"}
        </button>
        <span className="text-xs text-gray-500">Full narrative behind this reading order</span>
      </div>
      {aiStory && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="mb-2 font-bold text-purple-900">📖 {activePath.name} — The Story</h3>
          <p className="text-sm leading-relaxed text-purple-800 whitespace-pre-wrap">{aiStory}</p>
        </div>
      )}

      {/* Visual Flowchart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="mb-4 font-bold text-gray-900">📊 {activePath.name} — Reading Order</h2>
        <div className="overflow-x-auto">
          <div className="flex min-w-max items-start gap-4 pb-4">
            {activePath.nodes.map((node, idx) => {
              const realCover = node.comicVineIssueId ? coverCache[node.comicVineIssueId] : null;
              // Trigger cover fetch on first render
              if (node.comicVineIssueId && !coverCache[node.comicVineIssueId]) fetchNodeCover(node);
              return (
                <div key={node.id} className="flex items-center">
                  <button onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
                    className={`group relative flex flex-col items-center transition-transform hover:scale-105 ${selectedNode?.id === node.id ? "scale-105" : ""}`}>
                    <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white bg-gradient-to-r ${activePath.color}`}>{idx + 1}</div>
                    <div className={`relative h-32 w-22 overflow-hidden rounded-lg border-2 shadow-md transition-all ${selectedNode?.id === node.id ? "border-indigo-500 shadow-indigo-200" : "border-gray-200 group-hover:border-indigo-300"}`}>
                      {realCover || node.imageUrl ? (
                        <img src={realCover || node.imageUrl!} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className={`flex h-full flex-col items-center justify-center bg-gradient-to-b ${activePath.color} p-1`}>
                          <p className="text-center text-[9px] font-bold text-white leading-tight">{node.volumeName}</p>
                          <p className="mt-1 text-lg font-black text-white">#{node.issueNumber}</p>
                        </div>
                      )}
                      {node.significance >= 9 && <div className="absolute right-0.5 top-0.5 rounded bg-red-500/90 px-1 py-0.5"><span className="text-[8px] font-bold text-white">🔑 KEY</span></div>}
                    </div>
                    <div className="mt-1 w-20 text-center">
                      <p className="text-[10px] font-bold text-gray-900 leading-tight">{node.volumeName}</p>
                      <p className="text-[10px] text-gray-500">#{node.issueNumber}</p>
                      <span className={`mt-0.5 inline-block rounded-full border px-1 py-0.5 text-[8px] font-medium ${catColors[node.category] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                        {catLabel[node.category] || node.category}
                      </span>
                    </div>
                  </button>
                  {idx < activePath.nodes.length - 1 && (
                    <div className="mx-2 flex flex-col items-center"><div className="h-0.5 w-8 bg-gradient-to-r from-gray-300 to-gray-400" /><span className="text-gray-400 -mt-1">›</span></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Node Detail */}
      {selectedNode && (
        <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
          <div className="flex gap-4">
            {(coverCache[selectedNode.comicVineIssueId!] || selectedNode.imageUrl) ? (
              <img src={coverCache[selectedNode.comicVineIssueId!] || selectedNode.imageUrl!} alt="" className="h-36 w-24 flex-shrink-0 rounded-lg object-contain shadow-md" />
            ) : (
              <div className={`flex h-36 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-b ${activePath.color}`}><span className="text-xl font-black text-white">#{selectedNode.issueNumber}</span></div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">{selectedNode.volumeName} #{selectedNode.issueNumber}</h3>
              {selectedNode.coverDate && <p className="text-xs text-gray-500">{selectedNode.coverDate}</p>}
              <p className="text-sm text-gray-700">{selectedNode.reason}</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedNode.comicVineIssueId && <Link href={`/issue/${selectedNode.comicVineIssueId}`} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">🔍 Full Details</Link>}
                <button onClick={async () => {
                  await fetch("/api/want-list", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ volumeName: selectedNode.volumeName, issueNumber: selectedNode.issueNumber, maxPrice: null }) });
                  alert(`Added ${selectedNode.volumeName} #${selectedNode.issueNumber} to Want List!`);
                }} className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600">♡ Want List</button>
                <Link href={`/seller-tools?volume=${encodeURIComponent(selectedNode.volumeName)}&issue=${encodeURIComponent(selectedNode.issueNumber)}`}
                  className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700">💰 Price Check</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">Legend</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(catLabel).map(([key, label]) => <span key={key} className={`rounded-full border px-2 py-1 text-xs font-medium ${catColors[key]}`}>{label}</span>)}
          <span className="rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">🔑 KEY = significance 9-10</span>
        </div>
      </div>
    </div>
  );
}

export default function CuratePage() {
  return (
    <Suspense fallback={<div className="animate-pulse text-gray-400">Loading...</div>}>
      <CurateContent />
    </Suspense>
  );
}
