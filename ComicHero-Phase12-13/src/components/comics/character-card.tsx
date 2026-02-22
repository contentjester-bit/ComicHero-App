import Link from "next/link";
import type { Character } from "@/types/comic";

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  return (
    <Link
      href={`/character/${character.comicVineId}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
        {character.imageUrl ? (
          <img
            src={character.imageUrl}
            alt={character.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="p-4 text-center">
            <svg
              className="mx-auto mb-2 h-12 w-12 text-purple-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"
              />
            </svg>
            <p className="text-sm font-bold text-purple-600">
              {character.name}
            </p>
          </div>
        )}
        {character.issueCount > 0 && (
          <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5">
            <span className="text-xs font-medium text-white">
              {character.issueCount.toLocaleString()} appearances
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {character.name}
        </h3>

        <div className="flex flex-wrap gap-1">
          {character.publisher && (
            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
              {character.publisher}
            </span>
          )}
          {character.realName && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
              {character.realName}
            </span>
          )}
        </div>

        {character.description && (
          <p className="line-clamp-2 text-xs text-gray-600">
            {character.description}
          </p>
        )}

        <span className="mt-auto text-xs font-medium text-indigo-600 group-hover:text-indigo-700">
          View details &rarr;
        </span>
      </div>
    </Link>
  );
}
