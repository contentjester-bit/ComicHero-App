import Link from "next/link";
import type { KeyIssue } from "@/types/comic";

interface KeyIssueCardProps {
  keyIssue: KeyIssue;
}

const categoryLabels: Record<string, string> = {
  first_appearance: "First Appearance",
  first_cover: "First Cover",
  death: "Death",
  origin: "Origin",
  major_storyline: "Major Storyline",
  key_crossover: "Key Crossover",
  last_issue: "Last Issue",
  other: "Notable",
};

const categoryColors: Record<string, string> = {
  first_appearance: "bg-blue-100 text-blue-800",
  death: "bg-red-100 text-red-800",
  origin: "bg-purple-100 text-purple-800",
  major_storyline: "bg-amber-100 text-amber-800",
  key_crossover: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
};

export function KeyIssueCard({ keyIssue }: KeyIssueCardProps) {
  const searchUrl = `/issue?volumeName=${encodeURIComponent(keyIssue.volumeName)}&issueNumber=${encodeURIComponent(keyIssue.issueNumber)}`;

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
      {/* Image or placeholder */}
      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        {keyIssue.imageUrl ? (
          <img
            src={keyIssue.imageUrl}
            alt={`${keyIssue.volumeName} #${keyIssue.issueNumber}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="text-center p-4">
            <p className="text-lg font-bold text-indigo-600">
              {keyIssue.volumeName}
            </p>
            <p className="text-3xl font-bold text-indigo-800">
              #{keyIssue.issueNumber}
            </p>
          </div>
        )}
        {/* Significance stars */}
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5">
          <svg
            className="h-3.5 w-3.5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-medium text-white">
            {keyIssue.significance}/10
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {keyIssue.volumeName} #{keyIssue.issueNumber}
          </h3>
          {keyIssue.coverDate && (
            <span className="shrink-0 text-xs text-gray-500">
              {keyIssue.coverDate}
            </span>
          )}
        </div>

        <span
          className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            categoryColors[keyIssue.category] || categoryColors.other
          }`}
        >
          {categoryLabels[keyIssue.category] || keyIssue.category}
        </span>

        <p className="text-sm text-gray-600">{keyIssue.reason}</p>

        <Link
          href={searchUrl}
          className="mt-auto rounded-md bg-indigo-600 px-3 py-1.5 text-center text-xs font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Look Up
        </Link>
      </div>
    </div>
  );
}
