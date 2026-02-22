"use client";

import { useState, FormEvent } from "react";

interface CharacterSearchFormProps {
  onSearch: (characterName: string, maxPrice?: number, sort?: string) => void;
  loading?: boolean;
  ebayEnabled?: boolean;
}

export function CharacterSearchForm({
  onSearch,
  loading,
  ebayEnabled = false,
}: CharacterSearchFormProps) {
  const [characterName, setCharacterName] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("best_match");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!characterName.trim()) return;
    onSearch(
      characterName.trim(),
      maxPrice ? parseFloat(maxPrice) : undefined,
      sort
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="characterName"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Character Name
          </label>
          <input
            id="characterName"
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="e.g., Captain America, Spider-Man, Wolverine"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            required
          />
        </div>
        {ebayEnabled && (
          <>
            <div className="w-full sm:w-36">
              <label
                htmlFor="charMaxPrice"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Max Price ($)
              </label>
              <input
                id="charMaxPrice"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Optional"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="w-full sm:w-40">
              <label
                htmlFor="charSort"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Sort By
              </label>
              <select
                id="charSort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="best_match">Best Match</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="date_newest">Newest First</option>
              </select>
            </div>
          </>
        )}
      </div>
      <button
        type="submit"
        disabled={loading || !characterName.trim()}
        className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
