"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCollection } from "@/hooks/use-collection";

interface AuctionListing {
  id: string;
  platform: "whatnot" | "ebay" | "facebook";
  title: string;
  price: number;
  buyNow: number | null;
  description: string;
  status: "draft" | "listed" | "active" | "sold" | "ended";
  createdAt: string;
  sourceType: "single" | "bundle";
  sourceId?: string;
  imageUrl?: string;
  volumeName: string;
  issueNumber: string;
}

interface BundleItem {
  id: string;
  volumeName: string;
  issueNumber: string;
  comicVineIssueId: number | null;
  imageUrl: string | null;
  reason: string | null;
  sortOrder: number;
}

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  status: string;
  items: BundleItem[];
}

type Platform = "whatnot" | "ebay" | "facebook";

// Platform config
const PLATFORMS: Record<Platform, { label: string; icon: string; color: string; bgColor: string; borderColor: string; link?: string }> = {
  whatnot: { label: "Whatnot", icon: "🎙️", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", link: "https://www.whatnot.com/user/norridradd2026" },
  ebay: { label: "eBay", icon: "🛒", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" },
  facebook: { label: "FB Marketplace", icon: "📘", color: "text-indigo-700", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", link: "https://www.facebook.com/marketplace" },
};

export default function AuctionsPage() {
  const searchParams = useSearchParams();
  const bundleIdParam = searchParams.get("bundleId");

  const [activePlatform, setActivePlatform] = useState<Platform>("ebay");
  const { items: collection, loading: collectionLoading } = useCollection();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundlesLoading, setBundlesLoading] = useState(true);

  // Selection
  const [sourceMode, setSourceMode] = useState<"collection" | "bundle">("collection");
  const [selectedComics, setSelectedComics] = useState<Set<number>>(new Set());
  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(bundleIdParam);
  const [showPicker, setShowPicker] = useState(false);

  // Listings
  const [listings, setListings] = useState<AuctionListing[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Platform-specific settings
  const [streamType, setStreamType] = useState<"auction" | "buy-now">("auction");
  const [startingPrice, setStartingPrice] = useState("1");
  const [shippingCost, setShippingCost] = useState("5");

  // Sales tracking (in-memory for now)
  const [salesLog, setSalesLog] = useState<AuctionListing[]>([]);

  // Fetch bundles
  useEffect(() => {
    fetch("/api/bundles")
      .then((r) => r.json())
      .then((d) => { if (d.success) setBundles(d.data); })
      .catch(() => {})
      .finally(() => setBundlesLoading(false));
  }, []);

  // Auto-select bundle if passed via URL
  useEffect(() => {
    if (bundleIdParam) {
      setSourceMode("bundle");
      setSelectedBundleId(bundleIdParam);
    }
  }, [bundleIdParam]);

  const selectedItems = collection.filter((c) => selectedComics.has(c.comicVineIssueId));
  const selectedBundle = bundles.find((b) => b.id === selectedBundleId);

  const toggleComic = (id: number) => {
    setSelectedComics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Generate listings for selected items
  const handleGenerate = async () => {
    const items = sourceMode === "collection"
      ? selectedItems.map((i) => ({ volumeName: i.volumeName, issueNumber: i.issueNumber, condition: i.condition, coverDate: i.coverDate, imageUrl: i.imageUrl }))
      : selectedBundle
        ? selectedBundle.items.map((i) => ({ volumeName: i.volumeName, issueNumber: i.issueNumber, condition: null, coverDate: null, imageUrl: i.imageUrl }))
        : [];

    if (items.length === 0) return;
    setGenerating(true);
    setListings([]);

    const generated: AuctionListing[] = [];

    for (const item of items) {
      try {
        const res = await fetch("/api/ai/generate-listing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            volumeName: item.volumeName,
            issueNumber: item.issueNumber,
            condition: item.condition || "VF",
            coverDate: item.coverDate,
            platform: activePlatform,
          }),
        });
        const data = await res.json();
        const desc = data.success && data.data?.description
          ? data.data.description.substring(0, activePlatform === "whatnot" ? 500 : 2000)
          : `${item.volumeName} #${item.issueNumber} in ${item.condition || "VF"} condition.`;

        const price = parseFloat(startingPrice) || 1;

        generated.push({
          id: `${Date.now()}-${generated.length}`,
          platform: activePlatform,
          title: `${item.volumeName} #${item.issueNumber} ${item.condition || "VF"} ${item.coverDate || ""}`.trim(),
          price,
          buyNow: streamType === "buy-now" ? price * 3 : null,
          description: desc,
          status: "draft",
          createdAt: new Date().toISOString(),
          sourceType: sourceMode === "bundle" ? "bundle" : "single",
          sourceId: selectedBundleId || undefined,
          imageUrl: item.imageUrl || undefined,
          volumeName: item.volumeName,
          issueNumber: item.issueNumber,
        });
      } catch {
        const price = parseFloat(startingPrice) || 1;
        generated.push({
          id: `${Date.now()}-${generated.length}`,
          platform: activePlatform,
          title: `${item.volumeName} #${item.issueNumber}`,
          price,
          buyNow: null,
          description: `${item.volumeName} #${item.issueNumber}`,
          status: "draft",
          createdAt: new Date().toISOString(),
          sourceType: "single",
          imageUrl: item.imageUrl || undefined,
          volumeName: item.volumeName,
          issueNumber: item.issueNumber,
        });
      }
    }

    setListings(generated);
    setGenerating(false);
  };

  const copyListing = (idx: number) => {
    const l = listings[idx];
    const platformLabels: Record<Platform, string> = {
      whatnot: `${l.title}\n\nStarting Bid: $${l.price}${l.buyNow ? `\nBuy Now: $${l.buyNow}` : ""}\n\n${l.description}\n\nShips in gemini mailer with board & bag. Combined shipping available.`,
      ebay: `${l.title}\n\nPrice: $${l.price}\nShipping: $${shippingCost}\n\n${l.description}\n\nCondition: See photos. Ships securely in gemini mailer with bag & board.`,
      facebook: `${l.title}\n\n$${l.price} + $${shippingCost} shipping\n\n${l.description}\n\nShips next business day. PayPal/Venmo accepted.`,
    };
    navigator.clipboard.writeText(platformLabels[l.platform]);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const markAsSold = (idx: number) => {
    const listing = { ...listings[idx], status: "sold" as const };
    setSalesLog((prev) => [...prev, listing]);
    setListings((prev) => prev.filter((_, i) => i !== idx));
  };

  const totalRevenue = salesLog.reduce((s, l) => s + l.price, 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 p-6 text-white">
        <h1 className="text-3xl font-bold">🎯 Auctions</h1>
        <p className="mt-1 text-blue-100">Manage listings across Whatnot, eBay, and Facebook Marketplace</p>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
        {(Object.keys(PLATFORMS) as Platform[]).map((platform) => {
          const p = PLATFORMS[platform];
          return (
            <button
              key={platform}
              onClick={() => setActivePlatform(platform)}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                activePlatform === platform
                  ? `bg-white shadow-sm ${p.color}`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p.icon} {p.label}
            </button>
          );
        })}
      </div>

      {/* Sales Tracking Dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs text-gray-500 uppercase">Draft</p>
          <p className="text-2xl font-bold text-gray-700">{listings.filter((l) => l.platform === activePlatform && l.status === "draft").length}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-xs text-blue-600 uppercase">Listed</p>
          <p className="text-2xl font-bold text-blue-700">{listings.filter((l) => l.platform === activePlatform && l.status === "listed").length}</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-xs text-green-600 uppercase">Sold</p>
          <p className="text-2xl font-bold text-green-700">{salesLog.filter((l) => l.platform === activePlatform).length}</p>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
          <p className="text-xs text-purple-600 uppercase">Revenue</p>
          <p className="text-2xl font-bold text-purple-700">
            ${salesLog.filter((l) => l.platform === activePlatform).reduce((s, l) => s + l.price, 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Platform-Specific Settings */}
      <div className={`rounded-lg border ${PLATFORMS[activePlatform].borderColor} ${PLATFORMS[activePlatform].bgColor} p-4`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">
            {PLATFORMS[activePlatform].icon} {PLATFORMS[activePlatform].label} Settings
          </h2>
          {PLATFORMS[activePlatform].link && (
            <a href={PLATFORMS[activePlatform].link} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700">
              Open {PLATFORMS[activePlatform].label} ↗
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {activePlatform === "whatnot" && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Stream Type</label>
              <select value={streamType} onChange={(e) => setStreamType(e.target.value as "auction" | "buy-now")} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
                <option value="auction">Auction (Starting Bid)</option>
                <option value="buy-now">Buy Now + Auction</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              {activePlatform === "whatnot" ? "Starting Bid ($)" : "Listing Price ($)"}
            </label>
            <input type="number" value={startingPrice} onChange={(e) => setStartingPrice(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Shipping ($)</label>
            <input type="number" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          {activePlatform === "whatnot" && (
            <div>
              <label className="block text-xs font-medium text-gray-700">Account</label>
              <div className="mt-1 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
                <span className="text-blue-600 font-medium">@norridradd2026</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Source Selection */}
      <div className="rounded-lg border-2 border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Select Comics to List</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSourceMode("collection")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${sourceMode === "collection" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              📋 From Collection
            </button>
            <button
              onClick={() => setSourceMode("bundle")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${sourceMode === "bundle" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              📦 From Bundles
            </button>
          </div>
        </div>

        {sourceMode === "collection" ? (
          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{selectedComics.size} comics selected</p>
              <button onClick={() => setShowPicker(true)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                📚 Pick from Collection
              </button>
            </div>
            {selectedItems.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {selectedItems.map((item) => (
                  <div key={item.comicVineIssueId} className="relative flex-shrink-0">
                    <div className="h-24 w-16 overflow-hidden rounded border border-gray-200">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-contain" /> : <div className="flex h-full items-center justify-center bg-gray-100 text-[8px] font-bold">#{item.issueNumber}</div>}
                    </div>
                    <button onClick={() => toggleComic(item.comicVineIssueId)} className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">✕</button>
                    <p className="mt-0.5 w-16 truncate text-[9px] font-medium">{item.volumeName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {bundlesLoading ? (
              <p className="text-sm text-gray-500">Loading bundles...</p>
            ) : bundles.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No bundles yet.</p>
                <Link href="/bundles" className="mt-2 inline-block text-xs text-indigo-600 hover:text-indigo-700">Create a bundle first →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => (
                  <button
                    key={bundle.id}
                    onClick={() => setSelectedBundleId(selectedBundleId === bundle.id ? null : bundle.id)}
                    className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all ${
                      selectedBundleId === bundle.id ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <div className="flex -space-x-2">
                      {bundle.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="h-10 w-7 overflow-hidden rounded border border-white bg-gray-100">
                          {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{bundle.name}</p>
                      <p className="text-xs text-gray-500">{bundle.items.length} comics · {bundle.status}</p>
                    </div>
                    {selectedBundleId === bundle.id && (
                      <span className="text-orange-600 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate button */}
        <div className="mt-4 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || (sourceMode === "collection" ? selectedItems.length === 0 : !selectedBundle)}
            className="rounded-md bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {generating ? "Generating..." : `🤖 Generate ${PLATFORMS[activePlatform].label} Listings`}
          </button>
        </div>
      </div>

      {/* Collection Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Select Comics for {PLATFORMS[activePlatform].label}</h3>
              <div className="flex gap-2">
                <span className="text-sm text-gray-500">{selectedComics.size} selected</span>
                <button onClick={() => setShowPicker(false)} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Done</button>
              </div>
            </div>
            {collectionLoading ? <p>Loading...</p> : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {collection.map((item) => {
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {PLATFORMS[activePlatform].icon} Generated Listings ({listings.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const allText = listings.map((l, i) => {
                    return `--- Listing ${i + 1} ---\n${l.title}\nPrice: $${l.price}${l.buyNow ? ` / Buy Now: $${l.buyNow}` : ""}\n\n${l.description}`;
                  }).join("\n\n");
                  navigator.clipboard.writeText(allText);
                }}
                className="rounded bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                📋 Copy All
              </button>
            </div>
          </div>

          <div className={`rounded-lg ${PLATFORMS[activePlatform].bgColor} p-3 text-sm ${PLATFORMS[activePlatform].color}`}>
            {activePlatform === "whatnot" && "💡 Copy each listing and paste into Whatnot when setting up your stream lots"}
            {activePlatform === "ebay" && "💡 Copy listings to create eBay fixed-price or auction listings"}
            {activePlatform === "facebook" && "💡 Copy listings and create posts on Facebook Marketplace"}
          </div>

          {listings.map((listing, idx) => (
            <div key={listing.id} className={`rounded-lg border ${PLATFORMS[listing.platform].borderColor} bg-white p-4`}>
              <div className="flex items-start gap-4">
                {listing.imageUrl && (
                  <img src={listing.imageUrl} alt="" className="h-20 w-14 shrink-0 rounded object-contain border border-gray-200" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{listing.title}</h3>
                  <div className="mt-1 flex gap-3 text-sm">
                    <span className="text-green-600 font-medium">
                      {activePlatform === "whatnot" ? `Start: $${listing.price}` : `Price: $${listing.price}`}
                    </span>
                    {listing.buyNow && <span className="text-blue-600 font-medium">Buy Now: ${listing.buyNow}</span>}
                    <span className="text-gray-400">+ ${shippingCost} shipping</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{listing.description}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => copyListing(idx)} className="rounded bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
                    {copiedIdx === idx ? "✅ Copied!" : "📋 Copy"}
                  </button>
                  <button onClick={() => markAsSold(idx)} className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200">
                    💰 Mark Sold
                  </button>
                  <button onClick={() => setListings((prev) => prev.filter((_, i) => i !== idx))} className="rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Platform links */}
          <div className="flex gap-3">
            {activePlatform === "whatnot" && (
              <a href="https://www.whatnot.com/user/norridradd2026" target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700">
                Open Whatnot Dashboard ↗
              </a>
            )}
            {activePlatform === "ebay" && (
              <a href="https://www.ebay.com/sh/ovw" target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700">
                Open eBay Seller Hub ↗
              </a>
            )}
            {activePlatform === "facebook" && (
              <a href="https://www.facebook.com/marketplace/create/item" target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700">
                Create FB Marketplace Listing ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* Sales Log */}
      {salesLog.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">📊 Sales History</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{salesLog.length} sold</span>
              <span className="text-lg font-bold text-green-600">${totalRevenue.toFixed(2)} total</span>
            </div>
          </div>
          <div className="space-y-2">
            {salesLog.map((sale) => (
              <div key={sale.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
                <span className="text-sm">{PLATFORMS[sale.platform].icon}</span>
                {sale.imageUrl && <img src={sale.imageUrl} alt="" className="h-10 w-7 rounded object-contain" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{sale.title}</p>
                  <p className="text-[10px] text-gray-500">{PLATFORMS[sale.platform].label}</p>
                </div>
                <span className="text-sm font-bold text-green-600">${sale.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Tips */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">💡 {PLATFORMS[activePlatform].label} Tips</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm text-gray-700">
          {activePlatform === "whatnot" && (
            <>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📸 Photo Setup</p>
                <p className="text-xs text-gray-500">Good lighting, clean background. Show front/back.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">⏰ Best Times</p>
                <p className="text-xs text-gray-500">Thu-Sun evenings (7-10pm EST) get the most viewers.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">💰 Starting Bids</p>
                <p className="text-xs text-gray-500">$1 for hot books creates bidding wars. Use Buy Now for keys.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📦 Shipping</p>
                <p className="text-xs text-gray-500">$4-5 flat rate in gemini mailers. Combine for multi-buys.</p>
              </div>
            </>
          )}
          {activePlatform === "ebay" && (
            <>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📸 Photos</p>
                <p className="text-xs text-gray-500">12 photos max. Front, back, spine, any defects.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">💰 Pricing</p>
                <p className="text-xs text-gray-500">Check sold comps. Fixed price sells 3x more than auctions.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📝 Keywords</p>
                <p className="text-xs text-gray-500">Include character names, key issue notes, and grade in title.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📦 Shipping</p>
                <p className="text-xs text-gray-500">Offer free shipping (build into price). USPS Media Mail for lots.</p>
              </div>
            </>
          )}
          {activePlatform === "facebook" && (
            <>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">📸 Photos</p>
                <p className="text-xs text-gray-500">Bright, clear photos. First image is most important.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">💰 Pricing</p>
                <p className="text-xs text-gray-500">Price 10-20% below eBay. Local pickup saves shipping.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">💬 Communication</p>
                <p className="text-xs text-gray-500">Respond quickly. Offer bundle deals for multiple items.</p>
              </div>
              <div className="rounded bg-white p-3 border border-gray-100">
                <p className="font-medium">⚠️ Safety</p>
                <p className="text-xs text-gray-500">Meet in public for local. Ship only with tracking + PayPal G&S.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
