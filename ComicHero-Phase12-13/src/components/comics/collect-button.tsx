"use client";

import { useState } from "react";

interface CollectButtonProps {
  issue: {
    comicVineIssueId: number;
    comicVineVolumeId: number;
    volumeName: string;
    issueNumber: string;
    name?: string | null;
    imageUrl?: string | null;
    coverDate?: string | null;
  };
  isOwned: boolean;
  onAdd: (issue: CollectButtonProps["issue"]) => Promise<boolean>;
  onRemove: (issueId: number) => Promise<boolean>;
  size?: "sm" | "md";
}

export function CollectButton({
  issue,
  isOwned,
  onAdd,
  onRemove,
  size = "sm",
}: CollectButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      if (isOwned) {
        await onRemove(issue.comicVineIssueId);
      } else {
        await onAdd(issue);
      }
    } finally {
      setBusy(false);
    }
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-1 text-xs"
      : "px-3 py-1.5 text-sm";

  if (isOwned) {
    return (
      <button
        onClick={handleClick}
        disabled={busy}
        className={`${sizeClasses} group/btn inline-flex items-center gap-1 rounded font-medium transition-colors bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 disabled:opacity-50`}
        title="Remove from collection"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
            clipRule="evenodd"
          />
        </svg>
        <span className="group-hover/btn:hidden">Owned</span>
        <span className="hidden group-hover/btn:inline">Remove</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={`${sizeClasses} inline-flex items-center gap-1 rounded font-medium transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50`}
      title="Add to collection"
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5v15m7.5-7.5h-15"
        />
      </svg>
      {busy ? "Adding..." : "Collect"}
    </button>
  );
}
