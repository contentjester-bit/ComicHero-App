"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Listing } from "@/types/listing";
import type { ApiResponse } from "@/types/api";

export default function ListingDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/ebay/item/${itemId}`);
        const data: ApiResponse<Listing> = await res.json();
        if (data.success && data.data) {
          setListing(data.data);
        } else {
          setError(data.error || "Failed to load listing");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [itemId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-2/3 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="aspect-[3/4] rounded-lg bg-gray-200" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center">
        <p className="text-lg font-medium text-red-700">{error || "Listing not found"}</p>
      </div>
    );
  }

  const { parsed } = listing;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          {listing.imageUrl ? (
            <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-contain" />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center bg-gray-100 text-gray-400">
              No image available
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">${listing.price.toFixed(2)}</span>
              <span className="text-sm text-gray-500">{listing.currency}</span>
            </div>
            {listing.shippingCost !== null && (
              <p className="mt-1 text-sm text-gray-600">
                {listing.shippingCost === 0
                  ? "Free shipping"
                  : `+$${listing.shippingCost.toFixed(2)} shipping`}
              </p>
            )}
            <p className="mt-1 text-sm font-medium text-gray-900">
              Total: ${listing.totalPrice.toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Parsed Details</h2>
            <dl className="space-y-2 text-sm">
              {parsed.seriesName && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Series</dt>
                  <dd className="font-medium text-gray-900">{parsed.seriesName}</dd>
                </div>
              )}
              {parsed.issueNumber && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Issue</dt>
                  <dd className="font-medium text-gray-900">#{parsed.issueNumber}</dd>
                </div>
              )}
              {parsed.gradingCompany && parsed.grade && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Grade</dt>
                  <dd className="font-medium text-gray-900">{parsed.gradingCompany} {parsed.grade}</dd>
                </div>
              )}
              {parsed.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {parsed.keywords.map((kw, i) => (
                    <span key={i} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{kw}</span>
                  ))}
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Seller</h2>
            <p className="text-sm text-gray-900">{listing.seller}</p>
            {listing.sellerFeedbackPercentage && (
              <p className="text-xs text-gray-500">
                {listing.sellerFeedbackPercentage}% positive feedback
              </p>
            )}
          </div>

          {listing.condition && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-1 text-sm font-semibold text-gray-900">Condition</h2>
              <p className="text-sm text-gray-600">{listing.condition}</p>
            </div>
          )}

          <a
            href={listing.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-md bg-indigo-600 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            View on eBay
          </a>
        </div>
      </div>
    </div>
  );
}
