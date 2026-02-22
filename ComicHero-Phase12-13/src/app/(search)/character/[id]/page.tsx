"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { KeyIssueCard } from "@/components/comics/key-issue-card";
import type { Character, KeyIssue } from "@/types/comic";
import type { ApiResponse } from "@/types/api";

export default function CharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [character, setCharacter] = useState<Character | null>(null);
  const [keyIssues, setKeyIssues] = useState<KeyIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCharacter() {
      setLoading(true);
      try {
        const [charRes, keyRes] = await Promise.all([
          fetch(`/api/comicvine/character/${id}`),
          fetch(`/api/comicvine/key-issues?characterId=${id}`),
        ]);
        const charData: ApiResponse<Character> = await charRes.json();
        const keyData: ApiResponse<KeyIssue[]> = await keyRes.json();

        if (charData.success && charData.data) {
          setCharacter(charData.data);
        } else {
          setError(charData.error || "Character not found");
        }
        if (keyData.success && keyData.data) {
          setKeyIssues(keyData.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchCharacter();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="flex gap-6">
          <div className="h-64 w-44 animate-pulse rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-3">
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
            <div className="h-16 w-full animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href="/character"
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          &larr; Back to search
        </Link>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!character) return null;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/character"
        className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5 8.25 12l7.5-7.5"
          />
        </svg>
        Back to search
      </Link>

      {/* Character header */}
      <div className="flex flex-col gap-6 sm:flex-row">
        {character.imageUrl && (
          <div className="shrink-0">
            <img
              src={character.imageUrl}
              alt={character.name}
              className="w-56 rounded-lg shadow-md"
            />
          </div>
        )}

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {character.name}
          </h1>

          <div className="flex flex-wrap gap-2">
            {character.publisher && (
              <span className="rounded bg-purple-50 px-2 py-0.5 text-sm text-purple-700">
                {character.publisher}
              </span>
            )}
            {character.realName && (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-sm text-gray-700">
                {character.realName}
              </span>
            )}
            {character.issueCount > 0 && (
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-sm text-indigo-700">
                {character.issueCount.toLocaleString()} appearances
              </span>
            )}
          </div>

          {character.description && (
            <p className="max-w-2xl text-sm text-gray-600">
              {character.description}
            </p>
          )}
        </div>
      </div>

      {/* Key issues for this character */}
      {keyIssues.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Key Issues
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {keyIssues.map((ki) => (
              <KeyIssueCard key={ki.id} keyIssue={ki} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
