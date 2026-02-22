"use client";

import { useState } from "react";

interface WantListItem {
  id: string;
  volumeName: string;
  issueNumber: string;
  targetMaxPrice: number;
  notes: string | null;
  isActive: boolean;
  lastCheckedAt: string | null;
  matchCount: number;
  matches: Array<{
    id: string;
    title: string;
    price: number;
    totalPrice: number;
    imageUrl: string | null;
    itemUrl: string;
    isNew: boolean;
    foundAt: string;
  }>;
}

interface WantListTableProps {
  items: WantListItem[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function WantListTable({
  items,
  onDelete,
  onToggleActive,
}: WantListTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
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
            d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          />
        </svg>
        <p className="text-lg font-medium text-gray-600">
          Your want list is empty
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Add comics you&apos;re hunting for to track them
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Comic
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Max Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Matches
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Last Checked
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((item) => (
            <WantListRow
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              onDelete={() => onDelete(item.id)}
              onToggleActive={() =>
                onToggleActive(item.id, !item.isActive)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WantListRow({
  item,
  expanded,
  onToggleExpand,
  onDelete,
  onToggleActive,
}: {
  item: WantListItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <>
      <tr
        className={`cursor-pointer transition-colors hover:bg-gray-50 ${
          !item.isActive ? "opacity-50" : ""
        }`}
        onClick={onToggleExpand}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-900">
                {item.volumeName} #{item.issueNumber}
              </p>
              {item.notes && (
                <p className="text-xs text-gray-500">{item.notes}</p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-gray-900">
          ${item.targetMaxPrice.toFixed(2)}
        </td>
        <td className="px-4 py-3">
          {item.matchCount > 0 ? (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {item.matchCount} found
            </span>
          ) : (
            <span className="text-sm text-gray-500">None yet</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {item.lastCheckedAt
            ? new Date(item.lastCheckedAt).toLocaleDateString()
            : "Never"}
        </td>
        <td className="px-4 py-3 text-right">
          <div
            className="flex items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onToggleActive}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {item.isActive ? "Pause" : "Resume"}
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
      {expanded && item.matches.length > 0 && (
        <tr>
          <td colSpan={5} className="bg-gray-50 px-4 py-3">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-gray-500">
                Matched Listings
              </p>
              {item.matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center gap-3 rounded-md bg-white p-2 shadow-sm"
                >
                  {match.imageUrl && (
                    <img
                      src={match.imageUrl}
                      alt=""
                      className="h-12 w-10 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-gray-900">
                      {match.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Found {new Date(match.foundAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      ${match.totalPrice.toFixed(2)}
                    </p>
                    {match.isNew && (
                      <span className="text-xs font-medium text-indigo-600">
                        New
                      </span>
                    )}
                  </div>
                  <a
                    href={match.itemUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-indigo-600 px-2 py-1 text-xs text-white hover:bg-indigo-700"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
