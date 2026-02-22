"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { CollectButton } from "@/components/comics/collect-button";
import { WantListButton } from "@/components/comics/want-list-button";
import { useCollection } from "@/hooks/use-collection";
import type { ComicIssue } from "@/types/comic";
import type { ApiResponse } from "@/types/api";

// Key issue detection patterns
function detectKeyIssue(issue: ComicIssue): { isKey: boolean; reasons: string[]; score: number } {
  const reasons: string[] = [];
  let score = 0;

  // First appearances
  if (issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0) {
    reasons.push(`First appearance of ${issue.firstAppearanceCharacters.join(", ")}`);
    score += 10;
  }

  // Issue #1
  if (issue.issueNumber === "1") {
    reasons.push("First issue of series");
    score += 7;
  }

  // Description-based detection
  const desc = (issue.description || "").toLowerCase() + " " + (issue.name || "").toLowerCase();
  if (desc.includes("first appearance")) { if (!reasons.some(r => r.startsWith("First appearance"))) { reasons.push("Contains first appearance"); score += 8; } }
  if (desc.includes("death of") || desc.includes("dies")) { reasons.push("Character death issue"); score += 7; }
  if (desc.includes("origin") || desc.includes("origin story")) { reasons.push("Origin story"); score += 6; }
  if (desc.includes("new costume") || desc.includes("black costume") || desc.includes("symbiote")) { reasons.push("Costume change / symbiote"); score += 5; }
  if (desc.includes("wedding") || desc.includes("married")) { reasons.push("Wedding / marriage issue"); score += 4; }
  if (desc.includes("crossover")) { reasons.push("Major crossover event"); score += 5; }

  // Notable issue numbers
  const num = parseInt(issue.issueNumber, 10);
  if (num === 100 || num === 200 || num === 300 || num === 400 || num === 500) { reasons.push(`Milestone issue #${num}`); score += 4; }
  if (num === 0) { reasons.push("Issue #0 — often a special origin issue"); score += 5; }

  return { isKey: score >= 5, reasons, score };
}

export default function IssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [issue, setIssue] = useState<ComicIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [owned, setOwned] = useState(false);
  const [aiPitch, setAiPitch] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [gcdData, setGcdData] = useState<Array<{ seriesName: string; issueDescriptor: string; publicationDate: string; coverPrice: string | null; pageCount: number | null; variants: Array<{ descriptor: string; coverArtist: string; price: string | null }>; isVariant: boolean }>>([]);
  const [gcdLoading, setGcdLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [metronData, setMetronData] = useState<any[]>([]);
  const [metronLoading, setMetronLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [marvelData, setMarvelData] = useState<any[]>([]);
  const [marvelLoading, setMarvelLoading] = useState(false);

  const { addToCollection, removeFromCollection } = useCollection();

  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      try {
        const issueRes = await fetch(`/api/comicvine/issue/${id}`);
        const data: ApiResponse<ComicIssue> = await issueRes.json();
        if (data.success && data.data) {
          setIssue(data.data);
          // Fetch GCD data in parallel
          setGcdLoading(true);
          fetch(`/api/gcd/search?series=${encodeURIComponent(data.data.volumeName)}&issue=${encodeURIComponent(data.data.issueNumber)}`)
            .then(r => r.json())
            .then(gcd => { if (gcd.success && gcd.data) setGcdData(gcd.data); })
            .catch(() => {})
            .finally(() => setGcdLoading(false));
          // Fetch Metron data (cross-reference by Comic Vine ID)
          setMetronLoading(true);
          fetch(`/api/metron/search?cv_id=${data.data.comicVineId}`)
            .then(r => r.json())
            .then(mt => { if (mt.success && mt.data) setMetronData(mt.data); })
            .catch(() => {})
            .finally(() => setMetronLoading(false));
          // Fetch Marvel data (only for Marvel comics)
          setMarvelLoading(true);
          fetch(`/api/marvel/search?title=${encodeURIComponent(data.data.volumeName)}&issue=${encodeURIComponent(data.data.issueNumber)}`)
            .then(r => r.json())
            .then(mv => { if (mv.success && mv.data) setMarvelData(mv.data); })
            .catch(() => {})
            .finally(() => setMarvelLoading(false));
          try {
            const checkRes = await fetch(`/api/collection/volume/${data.data.volumeId}`);
            const checkData = await checkRes.json();
            if (checkData.success && checkData.data) {
              setOwned(checkData.data.ownedIssueIds.includes(data.data.comicVineId));
            }
          } catch { /* collection check failed, not critical */ }
        } else {
          setError(data.error || "Issue not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchIssue();
  }, [id]);

  const handleAiPitch = async () => {
    if (!issue) return;
    setAiLoading(true);
    setAiError(null);
    setAiPitch(null);
    try {
      const res = await fetch("/api/ai/generate-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeName: issue.volumeName,
          issueNumber: issue.issueNumber,
          condition: "VF",
          coverDate: issue.coverDate,
          creators: issue.creators,
          firstAppearances: issue.firstAppearanceCharacters,
          description: issue.description?.replace(/<[^>]+>/g, " ").trim(),
          mode: "story",
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiPitch(data.data.description);
      } else {
        setAiError(data.error || "AI generation failed. Make sure OPENAI_API_KEY is set in Vercel environment variables.");
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate. Check your OpenAI API key.");
    } finally {
      setAiLoading(false);
    }
  };

  async function handleAdd(issueData: Parameters<typeof addToCollection>[0]) {
    const ok = await addToCollection(issueData);
    if (ok) setOwned(true);
    return ok;
  }

  async function handleRemove(issueId: number) {
    const ok = await removeFromCollection(issueId);
    if (ok) setOwned(false);
    return ok;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-6"><div className="h-64 w-44 animate-pulse rounded-lg bg-gray-200" /><div className="flex-1 space-y-3"><div className="h-8 w-72 animate-pulse rounded bg-gray-200" /><div className="h-4 w-48 animate-pulse rounded bg-gray-200" /><div className="h-20 w-full animate-pulse rounded bg-gray-200" /></div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/issue" className="text-sm text-indigo-600 hover:text-indigo-700">&larr; Back to search</Link>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!issue) return null;

  const keyInfo = detectKeyIssue(issue);

  return (
    <div className="space-y-6">
      <Link href={`/volume/${issue.volumeId}`} className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to {issue.volumeName}
      </Link>

      <div className="flex flex-col gap-6 sm:flex-row">
        {issue.imageUrl && (
          <div className="shrink-0">
            <img src={issue.imageUrl} alt={`${issue.volumeName} #${issue.issueNumber}`} className="w-56 rounded-lg shadow-md" />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{issue.volumeName} #{issue.issueNumber}</h1>
              {keyInfo.isKey && (
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${keyInfo.score >= 8 ? "bg-red-500" : keyInfo.score >= 6 ? "bg-orange-500" : "bg-yellow-500"}`}>
                  🔑 KEY ISSUE
                </span>
              )}
            </div>
            {issue.name && <p className="mt-1 text-lg text-gray-700">&ldquo;{issue.name}&rdquo;</p>}
          </div>

          {/* Key Issue Details */}
          {keyInfo.isKey && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h2 className="text-sm font-bold text-amber-900">🔑 Why This Is a Key Issue</h2>
              <ul className="mt-2 space-y-1">
                {keyInfo.reasons.map((reason, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-amber-800">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-[10px] font-bold text-amber-900">{i + 1}</span>
                    {reason}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-amber-700">Significance Score: {keyInfo.score}/10</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {issue.coverDate && <span className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-700">{issue.coverDate}</span>}
            {/* GCD cover price & page count */}
            {gcdData.length > 0 && gcdData[0].coverPrice && (
              <span className="rounded bg-green-100 px-2 py-0.5 text-sm text-green-700">💲 Cover: {gcdData[0].coverPrice}</span>
            )}
            {gcdData.length > 0 && gcdData[0].pageCount && (
              <span className="rounded bg-blue-100 px-2 py-0.5 text-sm text-blue-700">📄 {gcdData[0].pageCount} pages</span>
            )}
            <Link href={`/volume/${issue.volumeId}`} className="rounded bg-indigo-50 px-2 py-0.5 text-sm text-indigo-700 hover:bg-indigo-100">{issue.volumeName} (all issues)</Link>
          </div>

          {/* GCD Variant Covers */}
          {gcdData.length > 0 && gcdData.some(g => g.variants.length > 0) && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">🎨 Variant Covers ({gcdData.reduce((sum, g) => sum + g.variants.length, 0)})</h2>
              <p className="mb-2 text-xs text-gray-500">Data from Grand Comics Database</p>
              <div className="space-y-1.5">
                {gcdData.flatMap(g => g.variants).slice(0, 12).map((v, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border border-gray-100 bg-white px-3 py-1.5">
                    <span className="text-xs font-medium text-gray-900">{v.descriptor}</span>
                    {v.coverArtist && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] text-purple-700">🖊️ {v.coverArtist}</span>}
                    {v.price && <span className="ml-auto text-xs text-green-700">{v.price}</span>}
                  </div>
                ))}
                {gcdData.reduce((sum, g) => sum + g.variants.length, 0) > 12 && (
                  <p className="text-xs text-gray-400">+ {gcdData.reduce((sum, g) => sum + g.variants.length, 0) - 12} more variants</p>
                )}
              </div>
            </div>
          )}
          {gcdLoading && <p className="text-xs text-gray-400">Loading variant data from GCD...</p>}

          {/* GCD Series Editions */}
          {gcdData.length > 1 && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">🌍 Editions ({gcdData.length})</h2>
              <div className="space-y-1">
                {gcdData.slice(0, 8).map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                    <span className="font-medium">{g.seriesName}</span>
                    <span className="text-gray-400">{g.publicationDate}</span>
                    {g.coverPrice && <span className="text-green-600">{g.coverPrice}</span>}
                    {g.variants.length > 0 && <span className="rounded bg-amber-50 px-1 py-0.5 text-[10px] text-amber-700">{g.variants.length} variants</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metron Enhanced Data */}
          {metronData.length > 0 && (
            <div className="max-w-2xl rounded-lg border border-cyan-200 bg-cyan-50 p-4">
              <h2 className="mb-2 text-sm font-bold text-cyan-900">📊 Metron Database</h2>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {metronData[0].publisher && (
                  <div><span className="text-cyan-600">Publisher:</span> <span className="font-medium text-cyan-900">{metronData[0].publisher}</span></div>
                )}
                {metronData[0].storeDate && (
                  <div><span className="text-cyan-600">Store Date:</span> <span className="font-medium text-cyan-900">{metronData[0].storeDate}</span></div>
                )}
                {metronData[0].price && (
                  <div><span className="text-cyan-600">Cover Price:</span> <span className="font-medium text-cyan-900">${metronData[0].price}</span></div>
                )}
                {metronData[0].pageCount && (
                  <div><span className="text-cyan-600">Pages:</span> <span className="font-medium text-cyan-900">{metronData[0].pageCount}</span></div>
                )}
              </div>
              {/* Metron story arcs */}
              {metronData[0].storyArcs && metronData[0].storyArcs.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-cyan-600">Story Arcs: </span>
                  {metronData[0].storyArcs.map((arc: string, i: number) => (
                    <span key={i} className="mr-1 rounded bg-cyan-100 px-1.5 py-0.5 text-[10px] font-medium text-cyan-800">{arc}</span>
                  ))}
                </div>
              )}
              {/* Metron characters */}
              {metronData[0].characters && metronData[0].characters.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-cyan-600">Characters: </span>
                  <span className="text-xs text-cyan-800">{metronData[0].characters.slice(0, 15).join(", ")}{metronData[0].characters.length > 15 ? ` +${metronData[0].characters.length - 15} more` : ""}</span>
                </div>
              )}
              {/* Metron credits */}
              {metronData[0].credits && metronData[0].credits.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-cyan-600">Credits: </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {metronData[0].credits.slice(0, 8).map((c: { creator: string; roles: string[] }, i: number) => (
                      <span key={i} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-cyan-700">
                        <span className="font-medium">{c.creator}</span> ({c.roles.join(", ")})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Metron variants */}
              {metronData[0].variants && metronData[0].variants.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-cyan-600">Variants ({metronData[0].variants.length}): </span>
                  <div className="mt-1 space-y-1">
                    {metronData[0].variants.slice(0, 6).map((v: { name: string; imageUrl: string | null }, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        {v.imageUrl && <img src={v.imageUrl} alt={v.name} className="h-10 w-7 rounded object-cover" />}
                        <span className="text-[10px] text-cyan-800">{v.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {metronLoading && <p className="text-xs text-gray-400">Loading Metron data...</p>}

          {/* Marvel Official Data */}
          {marvelData.length > 0 && (
            <div className="max-w-2xl rounded-lg border border-red-200 bg-red-50 p-4">
              <h2 className="mb-2 text-sm font-bold text-red-900">🦸 Marvel Official</h2>
              <div className="flex gap-3">
                {marvelData[0].coverUrl && !marvelData[0].coverUrl.includes("image_not_available") && (
                  <img src={marvelData[0].coverUrl} alt={marvelData[0].title} className="h-28 rounded shadow" />
                )}
                <div className="space-y-1.5 text-xs">
                  <p className="font-medium text-red-900">{marvelData[0].title}</p>
                  {marvelData[0].coverPrice && (
                    <p className="text-red-700">Cover: ${marvelData[0].coverPrice}</p>
                  )}
                  {marvelData[0].pageCount > 0 && (
                    <p className="text-red-700">{marvelData[0].pageCount} pages</p>
                  )}
                  {marvelData[0].upc && (
                    <p className="text-red-600 font-mono text-[10px]">UPC: {marvelData[0].upc}</p>
                  )}
                  {marvelData[0].characters && marvelData[0].characters.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {marvelData[0].characters.map((c: string, i: number) => (
                        <span key={i} className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] text-red-700">{c}</span>
                      ))}
                    </div>
                  )}
                  {marvelData[0].events && marvelData[0].events.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {marvelData[0].events.map((e: string, i: number) => (
                        <span key={i} className="rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-medium text-red-800">⚡ {e}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Marvel additional cover images */}
              {marvelData[0].additionalImages && marvelData[0].additionalImages.length > 1 && (
                <div className="mt-2">
                  <p className="text-[10px] text-red-600 mb-1">Additional Covers:</p>
                  <div className="flex gap-1.5 overflow-x-auto">
                    {marvelData[0].additionalImages.slice(0, 6).map((img: string, i: number) => (
                      !img.includes("image_not_available") && <img key={i} src={img} alt={`Cover ${i + 1}`} className="h-20 rounded shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
              {/* Marvel variant editions */}
              {marvelData.length > 1 && (
                <div className="mt-2">
                  <p className="text-[10px] text-red-600 mb-1">Variant Editions ({marvelData.length - 1}):</p>
                  <div className="space-y-1">
                    {marvelData.slice(1, 5).map((v: { title: string; variantDescription: string; coverUrl: string }, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        {v.coverUrl && !v.coverUrl.includes("image_not_available") && (
                          <img src={v.coverUrl} alt={v.title} className="h-10 w-7 rounded object-cover" />
                        )}
                        <span className="text-[10px] text-red-800">{v.variantDescription || v.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-[9px] text-red-400">Data provided by Marvel. © Marvel</p>
            </div>
          )}
          {marvelLoading && <p className="text-xs text-gray-400">Loading Marvel data...</p>}

          {/* Data Sources Summary */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400">
              <span>Data sources:</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5">Comic Vine ✓</span>
              {gcdData.length > 0 && <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-600">GCD ✓</span>}
              {metronData.length > 0 && <span className="rounded bg-cyan-100 px-1.5 py-0.5 text-cyan-600">Metron ✓</span>}
              {marvelData.length > 0 && <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-600">Marvel ✓</span>}
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-600">eBay ✓</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <CollectButton
              issue={{ comicVineIssueId: issue.comicVineId, comicVineVolumeId: parseInt(issue.volumeId, 10), volumeName: issue.volumeName, issueNumber: issue.issueNumber, name: issue.name, imageUrl: issue.imageUrl, coverDate: issue.coverDate }}
              isOwned={owned} onAdd={handleAdd} onRemove={handleRemove} size="md"
            />
            {!owned && <WantListButton volumeName={issue.volumeName} issueNumber={issue.issueNumber} size="md" />}
          </div>

          {/* Summary */}
          {issue.description && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Summary</h2>
              <div className="text-sm leading-relaxed text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: issue.description.replace(/<table[\s\S]*?<\/table>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() }} />
            </div>
          )}

          {/* AI Sell Pitch */}
          <div className="max-w-2xl rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-indigo-900">🤖 AI Sell Pitch</h2>
                <p className="text-xs text-indigo-700">Generate a compelling story about why this comic is collectible</p>
              </div>
              <button onClick={handleAiPitch} disabled={aiLoading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:bg-gray-400">
                {aiLoading ? "Generating..." : "✨ Generate"}
              </button>
            </div>
            {aiPitch && (
              <div className="mt-3 rounded bg-white p-3 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{aiPitch}</div>
            )}
            {aiError && (
              <div className="mt-3 rounded bg-red-100 p-3 text-xs text-red-700">{aiError}</div>
            )}
          </div>

          {/* Seller Tools Links */}
          <div className="max-w-2xl">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">💰 Seller Tools</h2>
            <div className="flex flex-wrap gap-2">
              <Link href={`/seller-tools?volume=${encodeURIComponent(issue.volumeName)}&issue=${encodeURIComponent(issue.issueNumber)}`} className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700">💰 Check eBay Price</Link>
              <Link href={`/seller-tools?volume=${encodeURIComponent(issue.volumeName)}&issue=${encodeURIComponent(issue.issueNumber)}`} className="rounded-md bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700">✍️ Generate Listing</Link>
              <Link href={`/seller-tools?volume=${encodeURIComponent(issue.volumeName)}&issue=${encodeURIComponent(issue.issueNumber)}`} className="rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-700">📸 Grade Condition</Link>
            </div>
          </div>

          {/* Creators */}
          {issue.creators && issue.creators.length > 0 && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Creators</h2>
              <div className="flex flex-wrap gap-2">
                {issue.creators.map((c, i) => (
                  <span key={i} className="rounded-full bg-purple-50 px-3 py-1 text-xs text-purple-700">
                    <span className="font-medium">{c.name}</span>
                    {c.role && <span className="ml-1 text-purple-600">({c.role})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* First Appearances */}
          {issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0 && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">First Appearances</h2>
              <div className="flex flex-wrap gap-2">
                {issue.firstAppearanceCharacters.map((c, i) => <span key={i} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">⭐ {c}</span>)}
              </div>
            </div>
          )}

          {/* Story Arcs */}
          {issue.storyArcs && issue.storyArcs.length > 0 && (
            <div className="max-w-2xl">
              <h2 className="mb-2 text-sm font-semibold text-gray-900">Story Arcs</h2>
              <div className="flex flex-wrap gap-2">
                {issue.storyArcs.map((a, i) => <span key={i} className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">{a}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
