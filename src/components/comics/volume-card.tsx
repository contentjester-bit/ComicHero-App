import Link from "next/link";
import type { ComicVolume } from "@/types/comic";

interface VolumeCardProps {
  volume: ComicVolume;
}

export function VolumeCard({ volume }: VolumeCardProps) {
  return (
    <Link
      href={`/volume/${volume.comicVineId}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        {volume.imageUrl ? (
          <img
            src={volume.imageUrl}
            alt={volume.name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="p-4 text-center">
            <p className="text-lg font-bold text-indigo-600">{volume.name}</p>
          </div>
        )}
        <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5">
          <span className="text-xs font-medium text-white">
            {volume.issueCount} issues
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
          {volume.name}
        </h3>

        <div className="flex flex-wrap gap-1">
          {volume.publisher && (
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-xs text-indigo-700">
              {volume.publisher}
            </span>
          )}
          {volume.startYear && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
              {volume.startYear}
            </span>
          )}
        </div>

        {volume.description && (
          <p className="line-clamp-2 text-xs text-gray-600">
            {volume.description}
          </p>
        )}

        <span className="mt-auto text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
          View all issues &rarr;
        </span>
      </div>
    </Link>
  );
}
