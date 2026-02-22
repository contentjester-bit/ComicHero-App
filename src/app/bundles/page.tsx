"use client";

import { useState, useEffect, useCallback } from "react";
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

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBundle, setNewBundle] = useState({ name: "", description: "", theme: "" });
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState<string | null>(null);
  const { items: collection } = useCollection();

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
    const res = await fetch("/api/bundles", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBundle),
    });
    const data = await res.json();
    if (data.success) { setBundles(prev => [data.data, ...prev]); setShowCreate(false); setNewBundle({ name: "", description: "", theme: "" }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bundle?")) return;
    await fetch(`/api/bundles/${id}`, { method: "DELETE" });
    setBundles(prev => prev.filter(b => b.id !== id));
  };

  const handleAddItem = async (bundleId: string, item: { volumeName: string; issueNumber: string; comicVineIssueId?: number; imageUrl?: string | null }) => {
    const res = await fetch(`/api/bundles/${bundleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_item", ...item }),
    });
    const data = await res.json();
    if (data.success) fetchBundles();
    setShowCollectionPicker(null);
  };

  const handleRemoveItem = async (bundleId: string, itemId: string) => {
    await fetch(`/api/bundles/${bundleId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove_item", itemId }),
    });
    fetchBundles();
  };

  const handleStatusChange = async (bundleId: string, status: string) => {
    await fetch(`/api/bundles/${bundleId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchBundles();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white">
        <h1 className="text-3xl font-bold">📦 Curated Bundles</h1>
        <p className="mt-1 text-amber-100">Create themed comic bundles for selling or collecting</p>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">+ New Bundle</button>
        <Link href="/curate" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">← Back to Curate</Link>
      </div>

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
            <button onClick={handleCreate} className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">Create</button>
            <button onClick={() => setShowCreate(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-100" />)}</div>
      ) : bundles.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No bundles yet</p>
          <p className="mt-1 text-sm text-gray-500">Create bundles to group comics for selling or sharing</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bundles.map((bundle) => (
            <div key={bundle.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{bundle.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${bundle.status === "published" ? "bg-green-100 text-green-800" : bundle.status === "selling" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>{bundle.status}</span>
                    {bundle.theme && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">{bundle.theme}</span>}
                  </div>
                  {bundle.description && <p className="mt-1 text-sm text-gray-600">{bundle.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">{bundle.items.length} comics • Created {new Date(bundle.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setExpandedBundle(expandedBundle === bundle.id ? null : bundle.id)} className="rounded bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-200">
                    {expandedBundle === bundle.id ? "Close" : "Manage"}
                  </button>
                  <select value={bundle.status} onChange={(e) => handleStatusChange(bundle.id, e.target.value)} className="rounded border border-gray-200 px-1 py-1 text-xs">
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="selling">Selling</option>
                    <option value="sold">Sold</option>
                  </select>
                  <button onClick={() => handleDelete(bundle.id)} className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">✕</button>
                </div>
              </div>

              {/* Bundle items cover strip */}
              {bundle.items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2">
                  <div className="flex gap-1 overflow-x-auto">
                    {bundle.items.map((item) => (
                      <div key={item.id} className="flex-shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-16 w-11 rounded border border-gray-200 object-contain" />
                        ) : (
                          <div className="flex h-16 w-11 items-center justify-center rounded border border-gray-200 bg-gray-50"><span className="text-[8px] font-bold text-gray-500">#{item.issueNumber}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded management */}
              {expandedBundle === bundle.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="mb-3 flex gap-2">
                    <button onClick={() => setShowCollectionPicker(bundle.id)} className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200">+ Add from Collection</button>
                  </div>

                  {bundle.items.length === 0 ? (
                    <p className="text-sm text-gray-500">No comics in this bundle yet</p>
                  ) : (
                    <div className="space-y-2">
                      {bundle.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2">
                          <span className="w-5 text-center text-xs font-bold text-gray-400">{idx + 1}</span>
                          {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-12 w-8 rounded object-contain" /> : <div className="flex h-12 w-8 items-center justify-center rounded bg-gray-100"><span className="text-[8px] font-bold">#{item.issueNumber}</span></div>}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.volumeName} #{item.issueNumber}</p>
                            {item.reason && <p className="text-xs text-gray-500">{item.reason}</p>}
                          </div>
                          <div className="flex gap-1">
                            {item.comicVineIssueId && <Link href={`/issue/${item.comicVineIssueId}`} className="rounded bg-indigo-50 px-2 py-1 text-[10px] text-indigo-600 hover:bg-indigo-100">View</Link>}
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
                              const already = bundle.items.some(bi => bi.volumeName === item.volumeName && bi.issueNumber === item.issueNumber);
                              return (
                                <button key={item.comicVineIssueId} disabled={already}
                                  onClick={() => handleAddItem(bundle.id, { volumeName: item.volumeName, issueNumber: item.issueNumber, comicVineIssueId: item.comicVineIssueId, imageUrl: item.imageUrl })}
                                  className={`flex flex-col overflow-hidden rounded-lg border ${already ? "border-green-300 opacity-50" : "border-gray-200 hover:shadow-md"}`}>
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
