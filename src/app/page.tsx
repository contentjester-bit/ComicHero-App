"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { CollectionStats } from "@/types/collection";

interface WantListDeal {
  id: string;
  volumeName: string;
  issueNumber: string;
  targetMaxPrice: number;
  match?: {
    title: string;
    price: number;
    itemUrl: string;
    percentBelow: number;
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [wantCount, setWantCount] = useState(0);
  const [wantDeals, setWantDeals] = useState<WantListDeal[]>([]);
  const [bundleCount, setBundleCount] = useState(0);
  const [ebayEnabled, setEbayEnabled] = useState(false);
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good morning");
    else if (h < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    fetch("/api/collection/stats")
      .then((r) => r.json())
      .then((d) => { if (d.success) setStats(d.data); })
      .catch(() => {});

    fetch("/api/want-list")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setWantCount(d.data.length);
          const deals: WantListDeal[] = d.data
            .filter((w: { matches?: { price: number; percentBelow: number; title: string; itemUrl: string }[] }) => w.matches && w.matches.length > 0)
            .map((w: { id: string; volumeName: string; issueNumber: string; targetMaxPrice: number; matches: { title: string; price: number; itemUrl: string; percentBelow: number }[] }) => ({
              id: w.id,
              volumeName: w.volumeName,
              issueNumber: w.issueNumber,
              targetMaxPrice: w.targetMaxPrice,
              match: w.matches[0],
            }))
            .slice(0, 5);
          setWantDeals(deals);
        }
      })
      .catch(() => {});

    fetch("/api/bundles")
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setBundleCount(d.data.length); })
      .catch(() => {});

    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => { if (d.ebayEnabled) setEbayEnabled(true); })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero — Command Center */}
      <div className="rounded-2xl bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-300">{greeting}</p>
            <h1 className="text-3xl font-bold">Command Center</h1>
            <p className="mt-1 text-indigo-200">Your comic selling hub — search, collect, list, sell</p>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/issue" className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
              🔍 Search Issues
            </Link>
            <Link href="/character" className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
              🦸 Characters
            </Link>
            <Link href="/seller-tools" className="rounded-lg bg-green-500/80 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-500 transition-colors">
              🤖 Sell
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ STATS BAR ═══ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Link href="/collection" className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:border-indigo-200">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Collection</p>
          <p className="mt-1 text-3xl font-bold text-indigo-600">{stats?.totalIssues ?? "—"}</p>
          <p className="text-xs text-gray-500">{stats?.totalVolumes ?? 0} series</p>
        </Link>
        <Link href="/want-list" className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:border-amber-200">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Want List</p>
          <p className="mt-1 text-3xl font-bold text-amber-600">{wantCount}</p>
          <p className="text-xs text-gray-500">
            {wantDeals.length > 0 ? (
              <span className="text-green-600 font-medium">{wantDeals.length} deals found!</span>
            ) : "tracking"}
          </p>
        </Link>
        <Link href="/bundles" className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md hover:border-orange-200">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Bundles</p>
          <p className="mt-1 text-3xl font-bold text-orange-600">{bundleCount}</p>
          <p className="text-xs text-gray-500">curated sets</p>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Invested</p>
          <p className="mt-1 text-3xl font-bold text-green-600">
            ${stats?.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? "—"}
          </p>
          <p className="text-xs text-gray-500">total tracked</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Avg / Book</p>
          <p className="mt-1 text-3xl font-bold text-purple-600">
            ${stats && stats.totalIssues > 0 ? (stats.totalValue / stats.totalIssues).toFixed(2) : "—"}
          </p>
          <p className="text-xs text-gray-500">per issue</p>
        </div>
      </div>

      {/* ═══ THREE-COLUMN: DEALS + AUCTIONS + QUICK ACTIONS ═══ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Want List Deals Alert */}
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">🔔 Want List Alerts</h2>
            <Link href="/want-list" className="text-xs font-medium text-amber-600 hover:text-amber-700">View all →</Link>
          </div>
          {wantDeals.length > 0 ? (
            <div className="mt-3 space-y-2">
              {wantDeals.map((deal) => (
                <a
                  key={deal.id}
                  href={deal.match?.itemUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 transition-shadow hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {deal.volumeName} #{deal.issueNumber}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{deal.match?.title}</p>
                  </div>
                  <div className="ml-3 text-right shrink-0">
                    <p className="text-sm font-bold text-green-600">${deal.match?.price.toFixed(2)}</p>
                    {deal.match?.percentBelow && (
                      <p className="text-[10px] font-medium text-green-700">
                        {deal.match.percentBelow.toFixed(0)}% below target
                      </p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>No deals found yet.</p>
              <p className="mt-1 text-xs text-gray-400">Add items to your want list with target prices</p>
            </div>
          )}
        </div>

        {/* Auction / eBay Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900">🎯 Auction Center</h2>
            <Link href="/whatnot" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">Manage →</Link>
          </div>
          <div className="mt-3 space-y-3">
            {/* eBay */}
            <div className={`rounded-lg border p-3 ${ebayEnabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">eBay</span>
                {ebayEnabled ? (
                  <span className="rounded bg-green-200 px-2 py-0.5 text-[10px] font-bold text-green-800">Connected</span>
                ) : (
                  <Link href="/settings" className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200">
                    Configure →
                  </Link>
                )}
              </div>
              {ebayEnabled && (
                <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded bg-white p-1.5">
                    <p className="text-sm font-bold text-gray-700">—</p>
                    <p className="text-[9px] text-gray-500">Active</p>
                  </div>
                  <div className="rounded bg-white p-1.5">
                    <p className="text-sm font-bold text-gray-700">—</p>
                    <p className="text-[9px] text-gray-500">Sold</p>
                  </div>
                  <div className="rounded bg-white p-1.5">
                    <p className="text-sm font-bold text-gray-700">$—</p>
                    <p className="text-[9px] text-gray-500">Revenue</p>
                  </div>
                </div>
              )}
            </div>

            {/* Whatnot */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">Whatnot</span>
                <span className="rounded bg-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-800">Ready</span>
              </div>
              <p className="mt-1 text-[10px] text-purple-600">Stream prep tools available in Auctions tab</p>
            </div>

            {/* Facebook Marketplace */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">FB Marketplace</span>
                <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">Coming</span>
              </div>
              <p className="mt-1 text-[10px] text-blue-600">Manual listing support planned</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-bold text-gray-900 mb-3">⚡ Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/issue" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-sm">🔍</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Search Issues</p>
                <p className="text-[10px] text-gray-500">Find comics by title + issue number</p>
              </div>
            </Link>
            <Link href="/character" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-sm">🦸</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Character Search</p>
                <p className="text-[10px] text-gray-500">Key issues by hero/villain</p>
              </div>
            </Link>
            <Link href="/collection" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-sm">📋</span>
              <div>
                <p className="text-sm font-medium text-gray-900">My Collection</p>
                <p className="text-[10px] text-gray-500">Select → Bundle or Cover Art</p>
              </div>
            </Link>
            <Link href="/seller-tools" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-sm">🤖</span>
              <div>
                <p className="text-sm font-medium text-gray-900">AI Seller Tools</p>
                <p className="text-[10px] text-gray-500">Price check, grade, generate listing</p>
              </div>
            </Link>
            <Link href="/art-creator" className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-50 text-sm">🎨</span>
              <div>
                <p className="text-sm font-medium text-gray-900">Cover Art Creator</p>
                <p className="text-[10px] text-gray-500">comicscoverart.com products</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ RECENTLY ADDED STRIP ═══ */}
      {stats?.recentlyAdded && stats.recentlyAdded.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">📚 Recently Added</h2>
            <Link href="/collection" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">View all →</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stats.recentlyAdded.slice(0, 12).map((item) => (
              <Link key={item.id} href={`/issue/${item.comicVineIssueId}`} className="flex-shrink-0 group">
                <div className="h-28 w-20 overflow-hidden rounded-lg border border-gray-200 transition-all group-hover:shadow-md group-hover:border-indigo-300">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-indigo-50">
                      <span className="text-[10px] font-bold text-indigo-600">#{item.issueNumber}</span>
                    </div>
                  )}
                </div>
                <p className="mt-1 w-20 truncate text-[10px] font-medium text-gray-900">{item.volumeName}</p>
                <p className="w-20 text-[9px] text-gray-500">#{item.issueNumber}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══ WORKFLOW CARDS ═══ */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link href="/curate" className="group rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 transition-shadow hover:shadow-lg">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-xl">📚</div>
          <h2 className="font-bold text-gray-900">Curate</h2>
          <p className="mt-1 text-sm text-gray-600">Explore series, discover key issues, build reading orders</p>
          <p className="mt-2 text-xs font-medium text-purple-600 group-hover:text-purple-700">Explore →</p>
        </Link>
        <Link href="/bundles" className="group rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-5 transition-shadow hover:shadow-lg">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-xl">📦</div>
          <h2 className="font-bold text-gray-900">Bundles</h2>
          <p className="mt-1 text-sm text-gray-600">Group comics for selling, auto-price bundles</p>
          <p className="mt-2 text-xs font-medium text-orange-600 group-hover:text-orange-700">Create →</p>
        </Link>
        <Link href="/whatnot" className="group rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 transition-shadow hover:shadow-lg">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-xl">🎯</div>
          <h2 className="font-bold text-gray-900">Auctions</h2>
          <p className="mt-1 text-sm text-gray-600">eBay, Whatnot, Facebook — manage all listings</p>
          <p className="mt-2 text-xs font-medium text-green-600 group-hover:text-green-700">Manage →</p>
        </Link>
      </div>

      {/* Data Sources */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
        <p className="text-center text-[10px] text-gray-400">
          Data from Comic Vine · Grand Comics Database · Metron · Marvel · eBay
        </p>
      </div>
    </div>
  );
}
