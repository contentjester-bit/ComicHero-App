import { metronFetch } from "./client";
import type { MetronPaginatedResponse, MetronIssue, MetronIssueInfo } from "./types";

/**
 * Search Metron for issues by series name and issue number.
 */
export async function searchMetronIssue(
  seriesName: string,
  issueNumber: string
): Promise<MetronIssueInfo[]> {
  const params = new URLSearchParams({
    series_name: seriesName,
    number: issueNumber,
  });

  const data = await metronFetch<MetronPaginatedResponse<MetronIssue>>(
    `/issue/?${params.toString()}`
  );

  if (!data || !data.results || data.results.length === 0) return [];

  return data.results.map((issue) => ({
    metronId: issue.id,
    comicVineId: issue.cv_id,
    seriesName: issue.series.name,
    seriesVolume: issue.series.volume,
    issueNumber: issue.number,
    publisher: issue.publisher.name,
    coverDate: issue.cover_date,
    storeDate: issue.store_date,
    price: issue.price,
    pageCount: issue.page_count,
    description: issue.desc,
    imageUrl: issue.image,
    storyArcs: issue.arcs.map((a) => a.name),
    characters: issue.characters.map((c) => c.name),
    teams: issue.teams.map((t) => t.name),
    credits: issue.credits.map((c) => ({
      creator: c.creator,
      roles: c.role.map((r) => r.name),
    })),
    variants: issue.variants.map((v) => ({
      name: v.name,
      imageUrl: v.image,
    })),
  }));
}

/**
 * Search Metron for a specific issue by Comic Vine ID.
 * Useful for cross-referencing when we already have CV data.
 */
export async function getMetronIssueByComicVineId(
  cvId: number
): Promise<MetronIssueInfo | null> {
  const data = await metronFetch<MetronPaginatedResponse<MetronIssue>>(
    `/issue/?cv_id=${cvId}`
  );

  if (!data || !data.results || data.results.length === 0) return null;

  const issue = data.results[0];
  return {
    metronId: issue.id,
    comicVineId: issue.cv_id,
    seriesName: issue.series.name,
    seriesVolume: issue.series.volume,
    issueNumber: issue.number,
    publisher: issue.publisher.name,
    coverDate: issue.cover_date,
    storeDate: issue.store_date,
    price: issue.price,
    pageCount: issue.page_count,
    description: issue.desc,
    imageUrl: issue.image,
    storyArcs: issue.arcs.map((a) => a.name),
    characters: issue.characters.map((c) => c.name),
    teams: issue.teams.map((t) => t.name),
    credits: issue.credits.map((c) => ({
      creator: c.creator,
      roles: c.role.map((r) => r.name),
    })),
    variants: issue.variants.map((v) => ({
      name: v.name,
      imageUrl: v.image,
    })),
  };
}
