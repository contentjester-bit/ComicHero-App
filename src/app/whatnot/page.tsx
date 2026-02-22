"use client";

import { useState } from "react";
import { useCollection } from "@/hooks/use-collection";
import Link from "next/link";

interface WhatnotListing {
  title: string;
  startingBid: number;
  buyNow: number | null;
  description: string;
  shippingNote: string;
}

export default function WhatnotPage() {
  const { items: collection, loading: collectionLoading } = useCollection();
  const [selectedComics, setSelectedComics] = useState<Set<number>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [listings, setListings] = useState<WhatnotListing[]>([]);
  const [generating, setGenerating] = useState(false);
  const [streamType, setStreamType] = useState<"auction" | "buy-now">("auction");
  const [startingBid, setStartingBid] = useState("1");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const selectedItems = collection.filter(c => selectedComics.has(c.comicVineIssueId));

  const toggleComic = (id: number) => {
    setSelectedComics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (selectedItems.length === 0) return;
    setGenerating(true);
    setListings([]);

    const generated: WhatnotListing[] = [];

    for (const item of selectedItems) {
      try {
        const res = await fetch("/api/ai/generate-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeName: item.volumeName,
            issueNumber: item.issueNumber,
            condition: item.condition || "VF",
            coverDate: item.coverDate,
          }),
        });
        const data = await res.json();
        if (data.success && data.data) {
          const bid = parseFloat(startingBid) || 1;
          generated.push({
            title: `${item.volumeName} #${item.issueNumber} ${item.condition || "VF"} ${item.coverDate || ""}`.trim(),
            startingBid: bid,
            buyNow: streamType === "buy-now" ? bid * 3 : null,
            description: data.data.description.substring(0, 500),
            shippingNote: "Ships in gemini mailer with board & bag. Combined shipping available.",
          });
        } else {
          generated.push({
            title: `${item.volumeName} #${item.issueNumber} ${item.condition || "VF"}`,
            startingBid: parseFloat(startingBid) || 1,
            buyNow: null,
            description: `${item.volumeName} issue #${item.issueNumber} in ${item.condition || "VF"} condition.`,
            shippingNote: "Ships in gemini mailer with board & bag.",
          });
        }
      } catch {
        generated.push({
          title: `${item.volumeName} #${item.issueNumber}`,
          startingBid: parseFloat(startingBid) || 1,
          buyNow: null,
          description: `${item.volumeName} #${item.issueNumber}`,
          shippingNote: "Ships protected.",
        });
      }
    }

    setListings(generated);
    setGenerating(false);
  };

  const copyListing = (idx: number) => {
    const l = listings[idx];
    const text = `${l.title}\n\nStarting Bid: $${l.startingBid}${l.buyNow ? `\nBuy Now: $${l.buyNow}` : ""}\n\n${l.description}\n\n${l.shippingNote}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
        <h1 className="text-3xl font-bold">🎙️ Whatnot Stream Prep</h1>
        <p className="mt-1 text-blue-100">Prepare your Whatnot live stream listings from your collection</p>
      </div>

      {/* Stream Settings */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">Stream Settings</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Stream Type</label>
            <select value={streamType} onChange={(e) => setStreamType(e.target.value as "auction" | "buy-now")} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="auction">Auction (Starting Bid)</option>
              <option value="buy-now">Buy Now + Auction</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Starting Bid ($)</label>
            <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Account</label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700">
              <span className="text-blue-600 font-medium">@norridradd2026</span>
              <a href="https://www.whatnot.com/user/norridradd2026" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600">↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Select Comics */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Select Comics for Stream</h2>
            <p className="text-sm text-gray-600">{selectedComics.size} comics selected</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPicker(true)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">📚 Pick from Collection</button>
            {selectedItems.length > 0 && (
              <button onClick={handleGenerate} disabled={generating} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400">
                {generating ? "Generating..." : `🤖 Generate ${selectedItems.length} Listings`}
              </button>
            )}
          </div>
        </div>

        {selectedItems.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {selectedItems.map(item => (
              <div key={item.comicVineIssueId} className="relative flex-shrink-0">
                <div className="h-24 w-16 overflow-hidden rounded border border-blue-200">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center bg-blue-100 text-[8px] font-bold text-blue-700">#{item.issueNumber}</div>}
                </div>
                <button onClick={() => toggleComic(item.comicVineIssueId)} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">✕</button>
                <p className="mt-0.5 w-16 truncate text-[9px] font-medium">{item.volumeName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Select Comics for Whatnot</h3>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">{selectedComics.size} selected</span>
                <button onClick={() => setShowPicker(false)} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">Done</button>
              </div>
            </div>
            {collectionLoading ? <p>Loading...</p> : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {collection.map(item => {
                  const selected = selectedComics.has(item.comicVineIssueId);
                  return (
                    <button key={item.comicVineIssueId} onClick={() => toggleComic(item.comicVineIssueId)}
                      className={`flex flex-col overflow-hidden rounded-lg border-2 transition-all ${selected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                      {item.imageUrl && <div className="aspect-[3/4] bg-gray-100"><img src={item.imageUrl} alt="" className="h-full w-full object-contain" /></div>}
                      <div className="p-1">
                        <p className="text-[10px] font-bold truncate">{item.volumeName}</p>
                        <p className="text-[10px] text-gray-500">#{item.issueNumber} {selected ? "✓" : ""}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Listings */}
      {listings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">📋 Generated Whatnot Listings ({listings.length})</h2>
          <div className="rounded bg-green-50 p-3 text-sm text-green-700">
            💡 Copy each listing and paste into Whatnot when setting up your stream lots
          </div>
          {listings.map((listing, idx) => (
            <div key={idx} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{listing.title}</h3>
                  <div className="mt-1 flex gap-3 text-sm">
                    <span className="text-green-600 font-medium">Start: ${listing.startingBid}</span>
                    {listing.buyNow && <span className="text-blue-600 font-medium">Buy Now: ${listing.buyNow}</span>}
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{listing.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{listing.shippingNote}</p>
                </div>
                <button onClick={() => copyListing(idx)} className="flex-shrink-0 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
                  {copiedIdx === idx ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>
          ))}
          <a href="https://www.whatnot.com/user/norridradd2026" target="_blank" rel="noopener noreferrer"
            className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
            Open Whatnot Dashboard ↗
          </a>
        </div>
      )}

      {/* Tips */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">💡 Whatnot Streaming Tips</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-gray-700">
          <div className="rounded bg-white p-3 border border-gray-100">
            <p className="font-medium">📸 Photo Setup</p>
            <p className="text-xs text-gray-500">Good lighting, clean background. Show front/back of each comic.</p>
          </div>
          <div className="rounded bg-white p-3 border border-gray-100">
            <p className="font-medium">⏰ Best Times</p>
            <p className="text-xs text-gray-500">Thursday-Sunday evenings (7-10pm EST) get the most viewers.</p>
          </div>
          <div className="rounded bg-white p-3 border border-gray-100">
            <p className="font-medium">💰 Starting Bids</p>
            <p className="text-xs text-gray-500">Start $1 for hot books. Creates bidding wars. Use Buy Now for key issues.</p>
          </div>
          <div className="rounded bg-white p-3 border border-gray-100">
            <p className="font-medium">📦 Shipping</p>
            <p className="text-xs text-gray-500">$4-5 flat rate in gemini mailers. Combine shipping for multi-buys.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
