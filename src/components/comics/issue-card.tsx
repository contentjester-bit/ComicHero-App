import Link from "next/link";
import type { ComicIssue } from "@/types/comic";
import type { ReactNode } from "react";

interface IssueCardProps {
  issue: ComicIssue;
  owned?: boolean;
  actions?: ReactNode;
}

function isKeyIssue(issue: ComicIssue): { isKey: boolean; label: string } {
  if (issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0) {
    return { isKey: true, label: "1ST APP" };
  }
  if (issue.issueNumber === "1") {
    return { isKey: true, label: "#1" };
  }
  const desc = ((issue.description || "") + " " + (issue.name || "")).toLowerCase();
  if (desc.includes("first appearance")) return { isKey: true, label: "1ST APP" };
  if (desc.includes("death of") || desc.includes("dies")) return { isKey: true, label: "DEATH" };
  if (desc.includes("origin")) return { isKey: true, label: "ORIGIN" };
  const num = parseInt(issue.issueNumber, 10);
  if (num === 100 || num === 200 || num === 300 || num === 400 || num === 500) return { isKey: true, label: `#${num}` };
  return { isKey: false, label: "" };
}

export function IssueCard({ issue, owned, actions }: IssueCardProps) {
  const keyInfo = isKeyIssue(issue);

  return (
    <div className={`group flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md ${owned ? "border-green-300 ring-1 ring-green-200" : "border-gray-200"}`}>
      <Link href={`/issue/${issue.comicVineId}`}
        className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        {issue.imageUrl ? (
          <img src={issue.imageUrl} alt={`${issue.volumeName} #${issue.issueNumber}`}
            className="h-full w-full object-contain transition-transform group-hover:scale-105" />
        ) : (
          <div className="p-4 text-center"><p className="text-2xl font-bold text-indigo-600">#{issue.issueNumber}</p></div>
        )}
        {issue.coverDate && (
          <div className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5">
            <span className="text-xs font-medium text-white">{issue.coverDate}</span>
          </div>
        )}
        {owned && (
          <div className="absolute left-2 top-2 rounded bg-green-500 px-1.5 py-0.5">
            <span className="text-xs font-bold text-white">OWNED</span>
          </div>
        )}
        {keyInfo.isKey && (
          <div className="absolute left-2 bottom-2 rounded bg-red-500 px-1.5 py-0.5 shadow">
            <span className="text-[10px] font-bold text-white">🔑 {keyInfo.label}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={`/issue/${issue.comicVineId}`} className="flex items-baseline gap-1.5">
          <span className="text-sm font-bold text-gray-900">#{issue.issueNumber}</span>
          {issue.name && <span className="line-clamp-1 text-xs text-gray-600">{issue.name}</span>}
        </Link>

        {/* First appearances inline */}
        {issue.firstAppearanceCharacters && issue.firstAppearanceCharacters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {issue.firstAppearanceCharacters.slice(0, 2).map((c, i) => (
              <span key={i} className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-medium text-amber-800">⭐ {c}</span>
            ))}
            {issue.firstAppearanceCharacters.length > 2 && (
              <span className="text-[10px] text-amber-600">+{issue.firstAppearanceCharacters.length - 2} more</span>
            )}
          </div>
        )}

        {issue.description && !issue.firstAppearanceCharacters?.length && (
          <p className="line-clamp-2 text-xs text-gray-500">{issue.description}</p>
        )}

        {actions && <div className="mt-auto pt-1">{actions}</div>}
      </div>
    </div>
  );
}
