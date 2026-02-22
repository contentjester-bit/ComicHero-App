import type { Listing } from "@/types/listing";
import { DealBadge } from "./deal-badge";

interface ListingCardProps {
  listing: Listing;
  onAddToWantList?: (listing: Listing) => void;
}

export function ListingCard({ listing, onAddToWantList }: ListingCardProps) {
  const { parsed } = listing;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        {listing.imageUrl ? (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5"
              />
            </svg>
          </div>
        )}
        {/* Buying options badge */}
        {listing.buyingOptions.includes("AUCTION") && (
          <span className="absolute left-2 top-2 rounded bg-orange-500 px-1.5 py-0.5 text-xs font-medium text-white">
            Auction
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3
          className="line-clamp-2 text-sm font-medium text-gray-900"
          title={listing.title}
        >
          {listing.title}
        </h3>

        {/* Parsed metadata badges */}
        <div className="flex flex-wrap gap-1">
          {parsed.seriesName && (
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
              {parsed.seriesName}
            </span>
          )}
          {parsed.issueNumber && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
              #{parsed.issueNumber}
            </span>
          )}
          {parsed.gradingCompany && parsed.grade && (
            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
              {parsed.gradingCompany} {parsed.grade}
            </span>
          )}
          {parsed.isVariant && (
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs text-amber-700">
              {parsed.variant || "Variant"}
            </span>
          )}
        </div>

        {/* Deal badge */}
        {listing.dealScore && <DealBadge dealScore={listing.dealScore} />}

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-1">
          <span className="text-lg font-bold text-gray-900">
            ${listing.price.toFixed(2)}
          </span>
          {listing.shippingCost !== null && listing.shippingCost > 0 && (
            <span className="text-xs text-gray-500">
              +${listing.shippingCost.toFixed(2)} ship
            </span>
          )}
          {listing.shippingCost === 0 && (
            <span className="text-xs text-green-600">Free shipping</span>
          )}
        </div>

        {/* Condition */}
        {listing.condition && (
          <p className="text-xs text-gray-500">{listing.condition}</p>
        )}

        {/* Actions */}
        <div className="mt-1 flex gap-2">
          <a
            href={listing.itemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md bg-indigo-600 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-indigo-700"
          >
            View on eBay
          </a>
          {onAddToWantList && (
            <button
              onClick={() => onAddToWantList(listing)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
              title="Add to Want List"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
