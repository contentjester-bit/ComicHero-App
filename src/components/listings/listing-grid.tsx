import type { Listing } from "@/types/listing";
import { ListingCard } from "./listing-card";

interface ListingGridProps {
  listings: Listing[];
  loading?: boolean;
  onAddToWantList?: (listing: Listing) => void;
}

export function ListingGrid({
  listings,
  loading,
  onAddToWantList,
}: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-gray-200 bg-white"
          >
            <div className="aspect-[3/4] bg-gray-200" />
            <div className="space-y-2 p-3">
              <div className="h-4 rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-6 w-1/3 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <p className="text-lg font-medium text-gray-600">No listings found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or increasing your max price
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {listings.map((listing) => (
        <ListingCard
          key={listing.itemId}
          listing={listing}
          onAddToWantList={onAddToWantList}
        />
      ))}
    </div>
  );
}
