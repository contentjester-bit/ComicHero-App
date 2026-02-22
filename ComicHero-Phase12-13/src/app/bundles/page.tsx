"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCollection } from "@/hooks/use-collection";

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
  createdAt: string;
  items: BundleItem[];
}

// ── Bundle Image Generator: fan-out layout ──
function BundleImagePreview({ items, bundleName, onExport }: { items: BundleItem[]; bundleName: string; onExport: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generated, setGenerated] = useState(false);

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 1200;
    const H = 800;
    canvas.width = W;
    canvas.height = H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1a1a2e");
    grad.addColorStop(1, "#16213e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Title
    ctx.fillStyle = "#f0c040";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(bundleName, W / 2, 50);

    ctx.fillStyle = "#8888aa";
    ctx.font = "16px sans-serif";
    ctx.fillText(`${items.length} Comics Bundle`, W / 2, 78);

    // Load images
    const loadImg = (url: string): Promise<HTMLImageElement | null> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    const images = await Promise.all(
      items.map((item) => (item.imageUrl ? loadImg(item.imageUrl) : Promise.resolve(null)))
    );

    // Fan-out layout: each comic overlaps the previous, tilted
    const count = items.length;
    const cardW = Math.min(220, (W - 200) / Math.max(count * 0.6, 1));
    const cardH = cardW * 1.5;
    const totalSpread = Math.min(W - 200, count * cardW * 0.65);
    const startX = (W - totalSpread) / 2;
    const baseY = H / 2 - cardH * 0.3;

    // Draw from back to front (first = back, last = top/most valuable)
    for (let i = 0; i < count; i++) {
      const x = startX + (totalSpread / count) * i;
      const angle = ((i - count / 2) * 4 * Math.PI) / 180;
      const y = baseY - Math.abs(i - count / 2) * 8;

      ctx.save();
      ctx.translate(x + cardW / 2, y + cardH / 2);
      ctx.rotate(angle);

      // Shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      // Card border
      ctx.fillStyle = i === count - 1 ? "#f0c040" : "#ffffff";
      ctx.fillRect(-cardW / 2 - 3, -cardH / 2 - 3, cardW + 6, cardH + 6);

      ctx.shadowColor = "transparent";

      const img = images[i];
      if (img) {
        ctx.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH);
      } else {
        ctx.fillStyle = "#2a2a4e";
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        ctx.fillStyle = "#6666aa";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`#${items[i].issueNumber}`, 0, 0);
      }

      // Top book badge
      if (i === count - 1) {
        ctx.fillStyle = "#f0c040";
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, 20);
        ctx.fillStyle = "#1a1a2e";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("★ TOP BOOK", 0, -cardH / 2 + 14);
      }

      ctx.restore();
    }

    // Bottom label
    ctx.fillStyle = "#ffffff";
    ctx.font = "14px sans-serif";
    ctx.textAlign = "center";
    const labels = items.map((i) => `${i.volumeName} #${i.issueNumber}`).join("  ·  ");
    const truncLabel = labels.length > 120 ? labels.slice(0, 117) + "..." : labels;
    ctx.fillText(truncLabel, W / 2, H - 30);

    // Watermark
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("ComicHero", W - 20, H - 12);

    setGenerated(true);
  }, [items, bundleName]);

  useEffect(() => {
    if (items.length > 0) generateImage();
  }, [items, generateImage]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onExport(dataUrl);
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} className="w-full rounded-lg border border-gray-300" style={{ maxHeight: 400 }} />
      {generated && (
        <div className="flex gap-2">
          <button onClick={handleExport} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            💾 Download PNG
          </button>
          <button onClick={generateImage} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
            🔄 Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

// ── Bundle Pricing Panel ──
function BundlePricingPanel({ items }: { items: BundleItem[] }) {
  const [prices, setPrices] = useState<Record<string, { individual: string; ebayAvg: string }>>({});
  const [suggestedBundle, setSuggestedBundle] = useState<number | null>(null);
  const [discount, setDiscount] = useState(15);

  // Calculate totals
  const totalIndividual = Object.values(prices).reduce((s, p) => s + (parseFloat(p.individual) || 0), 0);

  useEffect(() => {
    if (totalIndividual > 0) {
      setSuggestedBundle(Math.round(totalIndividual * (1 - discount / 100) * 100) / 100);
    }
  }, [totalIndividual, discount]);

  const updatePrice = (itemId: string, field: "individual" | "ebayAvg", value: string) => {
    setPrices((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <h4 className="font-bold text-green-900 mb-3">💰 Bundle Pricing</h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded bg-white p-2 border border-green-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{item.volumeName} #{item.issueNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <label className="text-[9px] text-gray-500 block">Your Price</label>
                <input
                  type="number"
                  value={prices[item.id]?.individual || ""}
                  onChange={(e) => updatePrice(item.id, "individual", e.target.value)}
                  placeholder="$0"
                  min="0"
                  step="0.01"
                  className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="text-[9px] text-gray-500 block">eBay Avg</label>
                <input
                  type="number"
                  value={prices[item.id]?.ebayAvg || ""}
                  onChange={(e) => updatePrice(item.id, "ebayAvg", e.target.value)}
                  placeholder="$0"
                  min="0"
                  step="0.01"
                  className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="mt-4 rounded-lg bg-white border border-green-200 p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Individual Total:</span>
          <span className="font-bold text-gray-900">${totalIndividual.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Bundle Discount:</span>
            <select value={discount} onChange={(e) => setDiscount(parseInt(e.target.value))} className="rounded border border-gray-200 px-2 py-1 text-xs">
              <option value="10">10%</option>
              <option value="15">15%</option>
              <option value="20">20%</option>
              <option value="25">25%</option>
              <option value="30">30%</option>
            </select>
          </div>
          <span className="text-lg font-bold text-green-700">
            ${suggestedBundle?.toFixed(2) ?? "—"}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-gray-400">Suggested bundle price with {discount}% discount</p>
      </div>
    </div>
  );
}

export default function BundlesPage() {
  const searchParams = useSearchParams();
  const fromCollection = searchParams.get("fromCollection") === "true";

  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBundle, setNewBundle] = useState({ name: "", description: "", theme: "" });
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState<string | null>(null);
  const [showImageGen, setShowImageGen] = useState<string | null>(null);
  const [showPricing, setShowPricing] = useState<string | null>(null);
  const { items: collection } = useCollection();

  // Import from collection via sessionStorage
  const [importItems, setImportItems] = useState<{ volumeName: string; issueNumber: string; comicVineIssueId?: number; imageUrl?: string | null }[]>([]);

  useEffect(() => {
    if (fromCollection) {
      try {
        const raw = sessionStorage.getItem("bundleFromCollection");
        if (raw) {
          const data = JSON.parse(raw);
          setImportItems(data);
          setShowCreate(true);
          setNewBundle((prev) => ({
            ...prev,
            name: data.length > 0 ? `${data[0].volumeName} Bundle` : "New Bundle",
          }));
          sessionStorage.removeItem("bundleFromCollection");
        }
      } catch { /* */ }
    }
  }, [fromCollection]);

  const fetchBundles = useCallback(async () => {
    try {
      const res = await fetch("/api/bundles");
      const data = await res.json();
      if (data.success) setBundles(data.data);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const handleCreate = async () => {
    if (!newBundle.name) return;
    const payload: Record<string, unknown> = { ...newBundle };
    if (importItems.length > 0) {
      payload.items = importItems.map((item) => ({
        volumeName: item.volumeName,
        issueNumber: item.issueNumber,
        comicVineIssueId: item.comicVineIssueId,
        imageUrl: item.imageUrl,
      }));
    }
    const res = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      setBundles((prev) => [data.data, ...prev]);
      setShowCreate(false);
      setNewBundle({ name: "", description: "", theme: "" });
      setImportItems([]);
      setExpandedBundle(data.data.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    setBundles((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddItem = async (bundleId: string, item: { volumeName: string; issueNumber: string; comicVineIssueId?: number; imageUrl?: string | null }) => {
    const res = await fetch(`/api/bundles/${bundleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_item", ...item }),
    });
    const data = await res.json();
    if (data.success) fetchBundles();
    setShowCollectionPicker(null);
  };

  const handleRemoveItem = async (bundleId: string, itemId: string) => {
    await fetch(`/api/bundles/${bundleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_item", itemId }),
    });
    fetchBundles();
  };

  const handleStatusChange = async (bundleId: string, status: string) => {
    await fetch(`/api/bundles/${bundleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchBundles();
  };

  const handleImageExport = (dataUrl: string) => {
    const link = document.createElement("a");
    link.download = "bundle-image.png";
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
        <h1 className="text-3xl font-bold">📦 Curated Bundles</h1>
        <p className="mt-1 text-amber-100">Create themed comic bundles — price, image, and sell</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
          + New Bundle
        </button>
      </div>

      {/* Import notification */}
      {importItems.length > 0 && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-sm font-medium text-green-800">
            📋 {importItems.length} comics ready to import from your collection
          </p>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {importItems.map((item, i) => (
              <div key={i} className="flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-12 w-8 rounded border border-green-200 object-contain" />
                ) : (
                  <div className="flex h-12 w-8 items-center justify-center rounded border border-green-200 bg-green-100 text-[8px] font-bold">#{item.issueNumber}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">Create New Bundle</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input type="text" placeholder="Bundle name (e.g. 'Spider-Man Key Run')" value={newBundle.name} onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input type="text" placeholder="Description" value={newBundle.description} onChange={(e) => setNewBundle({ ...newBundle, description: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <select value={newBundle.theme} onChange={(e) => setNewBundle({ ...newBundle, theme: e.target.value })} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
              <option value="">Theme (optional)</option>
              <option value="key-run">Key Issue Run</option>
              <option value="first-appearances">First Appearances</option>
              <option value="story-arc">Story Arc</option>
              <option value="investment">Investment Grade</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleCreate} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">
              {importItems.length > 0 ? `Create with ${importItems.length} Comics` : "Create"}
            </button>
            <button onClick={() => { setShowCreate(false); setImportItems([]); }} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}</div>
      ) : bundles.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No bundles yet</p>
          <p className="mt-1 text-sm text-gray-500">Create bundles to group comics for selling. You can also select comics in Collection → Create Bundle.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      bundle.status === "published" ? "bg-green-100 text-green-800"
                        : bundle.status === "selling" ? "bg-blue-100 text-blue-800"
                        : bundle.status === "sold" ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-600"
                    }`}>{bundle.status}</span>
                    {bundle.theme && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{bundle.theme}</span>}
                  </div>
                  {bundle.description && <p className="mt-1 text-sm text-gray-600">{bundle.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">{bundle.items.length} comics · {new Date(bundle.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setExpandedBundle(expandedBundle === bundle.id ? null : bundle.id)} className="rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200">
                    {expandedBundle === bundle.id ? "Close" : "Manage"}
                  </button>
                  {bundle.items.length >= 2 && (
                    <button onClick={() => setShowImageGen(showImageGen === bundle.id ? null : bundle.id)} className="rounded bg-pink-100 px-2 py-1 text-xs font-medium text-pink-700 hover:bg-pink-200">
                      🖼️ Image
                    </button>
                  )}
                  {bundle.items.length >= 1 && (
                    <button onClick={() => setShowPricing(showPricing === bundle.id ? null : bundle.id)} className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200">
                      💰 Price
                    </button>
                  )}
                  <select value={bundle.status} onChange={(e) => handleStatusChange(bundle.id, e.target.value)} className="rounded border border-gray-200 px-1 py-1 text-xs">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="selling">Selling</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button onClick={() => handleDelete(bundle.id)} className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">✕</button>
                </div>
              </div>

              {/* Cover strip */}
              {bundle.items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                  <div className="flex gap-1 overflow-x-auto">
                    {bundle.items.map((item) => (
                      <div key={item.id} className="flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-16 w-11 rounded border border-gray-200 object-contain" />
                        ) : (
                          <div className="flex h-16 w-11 items-center justify-center rounded border border-gray-200 bg-gray-50">
                            <span className="text-[8px] font-bold text-gray-500">#{item.issueNumber}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bundle Image Generator */}
              {showImageGen === bundle.id && (
                <div className="border-t border-pink-100 bg-pink-50 p-4">
                  <h4 className="font-bold text-pink-900 mb-2">🖼️ Bundle Image — Fanned Layout</h4>
                  <p className="text-xs text-pink-700 mb-3">Most valuable/rare book appears on top. Export as PNG for listings.</p>
                  <BundleImagePreview items={bundle.items} bundleName={bundle.name} onExport={handleImageExport} />
                </div>
              )}

              {/* Bundle Pricing */}
              {showPricing === bundle.id && (
                <div className="border-t border-green-100 p-4">
                  <BundlePricingPanel items={bundle.items} />
                </div>
              )}

              {/* Expanded management */}
              {expandedBundle === bundle.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="mb-3 flex gap-2">
                    <button onClick={() => setShowCollectionPicker(bundle.id)} className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200">
                      + Add from Collection
                    </button>
                    <Link href={`/whatnot?bundleId=${bundle.id}`} className="rounded bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200">
                      🎯 Send to Auctions
                    </Link>
                  </div>

                  {bundle.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No comics in this bundle yet</p>
                  ) : (
                    <div className="space-y-2">
                      {bundle.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
                          <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt="" className="h-12 w-8 rounded object-contain" />
                          ) : (
                            <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-100">
                              <span className="text-[8px] font-bold">#{item.issueNumber}</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.volumeName} #{item.issueNumber}</p>
                            {item.reason && <p className="text-xs text-gray-500">{item.reason}</p>}
                          </div>
                          <div className="flex gap-1">
                            {item.comicVineIssueId && (
                              <Link href={`/issue/${item.comicVineIssueId}`} className="rounded bg-indigo-50 px-2 py-1 text-[10px] text-indigo-600 hover:bg-indigo-100">View</Link>
                            )}
                            <Link href={`/seller-tools?volume=${encodeURIComponent(item.volumeName)}&issue=${encodeURIComponent(item.issueNumber)}`} className="rounded bg-green-50 px-2 py-1 text-[10px] text-green-600 hover:bg-green-100">💰</Link>
                            <button onClick={() => handleRemoveItem(bundle.id, item.id)} className="rounded bg-red-50 px-2 py-1 text-[10px] text-red-600 hover:bg-red-100">✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Collection picker modal */}
                  {showCollectionPicker === bundle.id && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                      <div className="max-h-[70vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <h3 className="font-bold text-gray-900">Add Comics to &quot;{bundle.name}&quot;</h3>
                          <button onClick={() => setShowCollectionPicker(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        {collection.length === 0 ? (
                          <p className="text-gray-500">No comics in collection. Add some first.</p>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {collection.map((item) => {
                              const already = bundle.items.some((bi) => bi.volumeName === item.volumeName && bi.issueNumber === item.issueNumber);
                              return (
                                <button key={item.comicVineIssueId} disabled={already}
                                  onClick={() => handleAddItem(bundle.id, { volumeName: item.volumeName, issueNumber: item.issueNumber, comicVineIssueId: item.comicVineIssueId, imageUrl: item.imageUrl })}
                                  className={`flex flex-col overflow-hidden rounded-lg border ${already ? "border-green-300 opacity-50" : "border-gray-200 hover:shadow-md"}`}
                                >
                                  {item.imageUrl && <div className="aspect-[3/4] bg-gray-100"><img src={item.imageUrl} alt="" className="h-full w-full object-contain" /></div>}
                                  <div className="p-1">
                                    <p className="text-[10px] font-bold truncate">{item.volumeName}</p>
                                    <p className="text-[10px] text-gray-500">#{item.issueNumber} {already ? "✓" : ""}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
