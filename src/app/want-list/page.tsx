"use client";

import { useState } from "react";
import { useWantList } from "@/hooks/use-want-list";

export default function WantListPage() {
  const { items, loading, error, addItem, deleteItem, checkDeals, checking } = useWantList();
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dealCheckResult, setDealCheckResult] = useState<{ checkedItems: number; newMatches: number } | null>(null);
  const [newComic, setNewComic] = useState({ volumeName: "", issueNumber: "", maxPrice: "" });
  const [ebayAction, setEbayAction] = useState<{ itemId: string; action: string } | null>(null);

  const handleCheckDeals = async () => {
    const result = await checkDeals();
    if (result) { setDealCheckResult(result); setTimeout(() => setDealCheckResult(null), 5000); }
  };

  const handleAdd = async () => {
    if (!newComic.volumeName || !newComic.issueNumber) return;
    const maxPrice = newComic.maxPrice ? parseFloat(newComic.maxPrice) : 0;
    await addItem(newComic.volumeName, newComic.issueNumber, maxPrice);
    setNewComic({ volumeName: "", issueNumber: "", maxPrice: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Want List</h1>
          <p className="mt-1 text-sm text-gray-600">Track comics you&apos;re hunting for and check for deals on eBay</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckDeals} disabled={checking || items.length === 0}
            className="rounded-md border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:border-gray-300 disabled:text-gray-400">
            {checking ? "Checking..." : "Check for Deals"}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600">+ Add Comic</button>
        </div>
      </div>

      {dealCheckResult && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Checked {dealCheckResult.checkedItems} comics — {dealCheckResult.newMatches} new matches!</div>
      )}

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-gray-900">Add to Want List</h3>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Series name" value={newComic.volumeName} onChange={(e) => setNewComic({ ...newComic, volumeName: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input type="text" placeholder="Issue #" value={newComic.issueNumber} onChange={(e) => setNewComic({ ...newComic, issueNumber: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <input type="number" placeholder="Max price ($)" value={newComic.maxPrice} onChange={(e) => setNewComic({ ...newComic, maxPrice: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleAdd} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Add</button>
            <button onClick={() => setShowForm(false)} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-lg font-medium text-gray-900">No comics on your want list</p>
          <p className="mt-1 text-sm text-gray-500">Add comics to track deals on eBay</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 p-3">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="text-gray-400 hover:text-gray-600">
                  <svg className={`h-4 w-4 transition-transform ${expanded === item.id ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Cover placeholder */}
                <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-indigo-50 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-indigo-600">#{item.issueNumber}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.volumeName} #{item.issueNumber}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>Max: {item.targetMaxPrice ? `$${item.targetMaxPrice}` : "Any"}</span>
                    <span>Checked: {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleDateString() : "Never"}</span>
                    {item.matchCount > 0 && <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700 font-medium">{item.matchCount} matches</span>}
                  </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <a href={`/seller-tools?volume=${encodeURIComponent(item.volumeName)}&issue=${encodeURIComponent(item.issueNumber)}`}
                    className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200">💰 Price</a>
                  <button onClick={() => deleteItem(item.id)}
                    className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200">✕</button>
                </div>
              </div>

              {/* Expanded panel */}
              {expanded === item.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="font-bold text-gray-900">{item.volumeName} #{item.issueNumber}</p>
                      <p className="text-sm text-gray-600">Budget: <span className="font-medium">{item.targetMaxPrice ? `$${item.targetMaxPrice}` : "No limit"}</span></p>
                      {item.notes && <p className="text-sm text-gray-500">{item.notes}</p>}
                      <a href={`/seller-tools?volume=${encodeURIComponent(item.volumeName)}&issue=${encodeURIComponent(item.issueNumber)}`}
                        className="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-indigo-700">🤖 Open Seller Tools</a>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase text-gray-500">eBay Actions</p>
                      <div className="space-y-2">
                        {[
                          { action: "list", icon: "📋", label: "Create Listing", sub: "Generate AI listing + open eBay", color: "blue" },
                          { action: "price_drop", icon: "📉", label: "Lower Price", sub: "Compare to market & suggest drop", color: "orange" },
                          { action: "promote", icon: "🚀", label: "Promote Listing", sub: "eBay Promotions Manager", color: "purple" },
                          { action: "flash_sale", icon: "⚡", label: "Flash Sale (24hr)", sub: "Drop 15% to notify watchers", color: "red" },
                        ].map(({ action, icon, label, sub, color }) => (
                          <button key={action}
                            onClick={() => setEbayAction(ebayAction?.action === action && ebayAction?.itemId === item.id ? null : { itemId: item.id, action })}
                            className={`w-full rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors
                              ${color === "blue" ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100" : ""}
                              ${color === "orange" ? "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100" : ""}
                              ${color === "purple" ? "border-purple-200 bg-purple-50 text-purple-800 hover:bg-purple-100" : ""}
                              ${color === "red" ? "border-red-200 bg-red-50 text-red-800 hover:bg-red-100" : ""}
                            `}>
                            {icon} {label}
                            <span className={`block text-xs font-normal
                              ${color === "blue" ? "text-blue-600" : ""} ${color === "orange" ? "text-orange-600" : ""}
                              ${color === "purple" ? "text-purple-600" : ""} ${color === "red" ? "text-red-600" : ""}
                            `}>{sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {ebayAction?.itemId === item.id && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                      {ebayAction.action === "list" && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">📋 Create eBay Listing</p>
                          <p className="text-xs text-gray-600">Generate an AI listing, then paste into eBay.</p>
                          <div className="flex gap-2">
                            <a href={`/seller-tools?volume=${encodeURIComponent(item.volumeName)}&issue=${encodeURIComponent(item.issueNumber)}`} className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">Generate Listing →</a>
                            <a href="https://www.ebay.com/sell/listing" target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">Open eBay ↗</a>
                          </div>
                        </div>
                      )}
                      {ebayAction.action === "price_drop" && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">📉 Price Drop Assistant</p>
                          <p className="text-xs text-gray-600">Check current market, then update your eBay price.</p>
                          <div className="flex gap-2">
                            <a href={`/seller-tools?volume=${encodeURIComponent(item.volumeName)}&issue=${encodeURIComponent(item.issueNumber)}`} className="rounded-md bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600">Check Market Price →</a>
                            <a href="https://www.ebay.com/mys/active" target="_blank" rel="noopener noreferrer" className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">My eBay ↗</a>
                          </div>
                        </div>
                      )}
                      {ebayAction.action === "promote" && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">🚀 Promote on eBay</p>
                          <p className="text-xs text-gray-600">Boost visibility for ~2-3% of sale price.</p>
                          <a href="https://www.ebay.com/sh/mkt/promotions" target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700">Open Promotions ↗</a>
                        </div>
                      )}
                      {ebayAction.action === "flash_sale" && (
                        <div className="space-y-2">
                          <p className="text-sm font-semibold">⚡ Flash Sale Strategy</p>
                          <p className="text-xs text-gray-600">Drop 15% for 24 hours. Thursday 7-9pm EST is best.</p>
                          <div className="rounded bg-red-50 p-2 text-xs text-red-700">💡 eBay notifies watchers when you drop price by 5%+</div>
                          <a href="https://www.ebay.com/mys/active" target="_blank" rel="noopener noreferrer" className="inline-block rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Go to Listings ↗</a>
                        </div>
                      )}
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
