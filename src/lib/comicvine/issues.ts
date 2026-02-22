import { comicVineFetch } from "./client";
import type { CVApiResponse, CVIssue, CVVolume } from "./types";
import type { ComicIssue, ComicVolume } from "@/types/comic";
import { getFromCache, setInCache } from "@/lib/cache/cache";

function mapCVIssue(cv: CVIssue): ComicIssue {
  return {
    id: String(cv.id),
    comicVineId: cv.id,
    volumeId: String(cv.volume.id),
    volumeName: cv.volume.name,
    issueNumber: cv.issue_number,
    name: cv.name,
    coverDate: cv.cover_date,
    imageUrl: cv.image?.medium_url || null,
    description: cv.deck || cv.description || null,
    characterIds: cv.character_credits?.map((c) => c.id) || [],
    characters: cv.character_credits?.map((c) => c.name) || [],
    firstAppearanceCharacters: cv.first_appearance_characters?.map((c) => c.name) || [],
    creators: cv.person_credits?.map((p) => ({ name: p.name, role: p.role })) || [],
    teams: cv.team_credits?.map((t) => t.name) || [],
    locations: cv.location_credits?.map((l) => l.name) || [],
    concepts: cv.concept_credits?.map((c) => c.name) || [],
    storyArcs: cv.story_arc_credits?.map((s) => s.name) || [],
  };
}

function mapCVVolume(cv: CVVolume): ComicVolume {
  return {
    id: String(cv.id),
    comicVineId: cv.id,
    name: cv.name,
    startYear: cv.start_year ? parseInt(cv.start_year, 10) : null,
    publisher: cv.publisher?.name || null,
    issueCount: cv.count_of_issues || 0,
    imageUrl: cv.image?.medium_url || null,
    description: cv.deck,
  };
}

export async function searchVolumes(query: string): Promise<ComicVolume[]> {
  const cacheKey = `volume_search:${query.toLowerCase()}`;
  const cached = await getFromCache<ComicVolume[]>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVVolume[]>>("search", {
    query,
    resources: "volume",
    field_list: "id,name,start_year,publisher,count_of_issues,image,deck",
    limit: "10",
  });

  const volumes = data.results.map(mapCVVolume);
  await setInCache(cacheKey, "volume_search", volumes, 300, 7 * 24 * 60 * 60);
  return volumes;
}

export async function getVolumeDetail(volumeId: number): Promise<ComicVolume | null> {
  const cacheKey = `volume:${volumeId}`;
  const cached = await getFromCache<ComicVolume>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVVolume>>(
    `volume/4050-${volumeId}`,
    {
      field_list: "id,name,start_year,publisher,count_of_issues,image,deck",
    }
  );

  if (!data.results) return null;

  const volume = mapCVVolume(data.results);
  await setInCache(cacheKey, "volume", volume, 300, 7 * 24 * 60 * 60);
  return volume;
}

export async function getVolumeIssues(
  volumeId: number,
  offset = 0,
  limit = 100
): Promise<{ issues: ComicIssue[]; total: number }> {
  const cacheKey = `volume_issues:${volumeId}:${offset}:${limit}`;
  const cached = await getFromCache<{ issues: ComicIssue[]; total: number }>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVIssue[]>>("issues", {
    filter: `volume:${volumeId}`,
    field_list: "id,name,issue_number,volume,cover_date,image,deck",
    sort: "issue_number:asc",
    limit: String(limit),
    offset: String(offset),
  });

  const issues = data.results.map(mapCVIssue);
  const total = data.number_of_total_results;
  const result = { issues, total };
  await setInCache(cacheKey, "volume_issues", result, 300, 7 * 24 * 60 * 60);
  return result;
}

export async function getIssueDetail(issueId: number): Promise<ComicIssue | null> {
  const cacheKey = `issue:${issueId}`;
  const cached = await getFromCache<ComicIssue>(cacheKey);
  if (cached) return cached;

  const data = await comicVineFetch<CVApiResponse<CVIssue>>(
    `issue/4000-${issueId}`,
    {
      field_list:
        "id,name,issue_number,volume,cover_date,image,deck,description,character_credits,first_appearance_characters,person_credits,team_credits,location_credits,concept_credits,story_arc_credits",
    }
  );

  if (!data.results) return null;

  const issue = mapCVIssue(data.results);
  await setInCache(cacheKey, "issue", issue, 300, 30 * 24 * 60 * 60);
  return issue;
}
