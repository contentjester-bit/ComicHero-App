"use client";

import { useState } from "react";

interface WantListButtonProps {
  volumeName: string;
  issueNumber: string;
  size?: "sm" | "md";
}

export function WantListButton({
  volumeName,
  issueNumber,
  size = "sm",
}: WantListButtonProps) {
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");

  async function handleAdd() {
    if (!showPrice) {
      setShowPrice(true);
      return;
    }

    const price = parseFloat(maxPrice);
    if (isNaN(price) || price <= 0) return;

    setBusy(true);
    try {
      const res = await fetch("/api/want-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volumeName,
          issueNumber,
          targetMaxPrice: price,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAdded(true);
        setShowPrice(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const sizeClasses =
    size === "sm"
      ? "px-2 py-1 text-xs"
      : "px-3 py-1.5 text-sm";

  if (added) {
    return (
      <span
        className={`${sizeClasses} inline-flex items-center gap-1 rounded bg-amber-100 font-medium text-amber-700`}
      >
        <svg
          className="h-3.5 w-3.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Z"
            clipRule="evenodd"
          />
        </svg>
        On Want List
      </span>
    );
  }

  if (showPrice) {
    return (
      <div
        className="flex items-center gap-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <span className={`${sizeClasses} text-gray-500`}>$</span>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max"
          className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:border-amber-400 focus:outline-none"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
            if (e.key === "Escape") setShowPrice(false);
          }}
        />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAdd();
          }}
          disabled={busy}
          className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {busy ? "..." : "Add"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAdd();
      }}
      className={`${sizeClasses} inline-flex items-center gap-1 rounded font-medium transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100`}
      title="Add to want list"
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
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
      Want
    </button>
  );
}
