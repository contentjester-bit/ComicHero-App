import { NextRequest, NextResponse } from "next/server";
import { comicVineFetch } from "@/lib/comicvine/client";
import type { CVApiResponse, CVIssue, CVVolume } from "@/lib/comicvine/types";
import type { ComicIssue, ComicVolume } from "@/types/comic";
import type { ApiResponse } from "@/types/api";
import { getFromCache, setInCache } from "@/lib/cache/cache";

function mapIssue(cv: CVIssue): ComicIssue {
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

function mapVolume(cv: CVVolume): ComicVolume {
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const issueNumber = searchParams.get("issueNumber");
  const year = searchParams.get("year");

  if (!query || !issueNumber) {
    return NextResponse.json({
      success: false,
      data: null,
      error: "query and issueNumber are required",
    } as ApiResponse<null>, { status: 400 });
  }

  const cacheKey = `search_issue:${query.toLowerCase()}:${issueNumber}:${year || ""}`;
  const cached = await getFromCache<{ issues: ComicIssue[]; volume: ComicVolume | null }>(cacheKey);
  if (cached) {
    return NextResponse.json({
      success: true,
      data: cached,
      error: null,
    } as ApiResponse<typeof cached>);
  }

  try {
    // Step 1: Search for matching volumes
    const volData = await comicVineFetch<CVApiResponse<CVVolume[]>>("search", {
      query,
      resources: "volume",
      field_list: "id,name,start_year,publisher,count_of_issues,image,deck",
      limit: "10",
    });

    let matchedVolumes = volData.results || [];
    
    // Filter by year if provided
    if (year) {
      const y = parseInt(year, 10);
      const yearFiltered = matchedVolumes.filter(
        (v) => v.start_year && Math.abs(parseInt(v.start_year, 10) - y) <= 2
      );
      if (yearFiltered.length > 0) matchedVolumes = yearFiltered;
    }

    // Try to find the best matching volume (exact name match preferred)
    const lowerQuery = query.toLowerCase().trim();
    const sorted = [...matchedVolumes].sort((a, b) => {
      const aExact = a.name.toLowerCase().trim() === lowerQuery ? 0 : 1;
      const bExact = b.name.toLowerCase().trim() === lowerQuery ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      // Prefer volumes with more issues (more likely to be main series)
      return (b.count_of_issues || 0) - (a.count_of_issues || 0);
    });

    const issues: ComicIssue[] = [];
    let matchedVolume: ComicVolume | null = null;

    // Step 2: For top matching volumes, search for the specific issue
    for (const vol of sorted.slice(0, 3)) {
      try {
        const issueData = await comicVineFetch<CVApiResponse<CVIssue[]>>("issues", {
          filter: `volume:${vol.id},issue_number:${issueNumber}`,
          field_list: "id,name,issue_number,volume,cover_date,image,deck,description,character_credits,first_appearance_characters,person_credits,team_credits,location_credits,concept_credits,story_arc_credits",
          limit: "5",
        });

        if (issueData.results && issueData.results.length > 0) {
          for (const cvIssue of issueData.results) {
            issues.push(mapIssue(cvIssue));
          }
          if (!matchedVolume) matchedVolume = mapVolume(vol);
        }
      } catch {
        // Continue to next volume
      }
    }

    const result = { issues, volume: matchedVolume };
    if (issues.length > 0) {
      await setInCache(cacheKey, "search_issue", result, 300, 7 * 24 * 60 * 60);
    }

    return NextResponse.json({
      success: true,
      data: result,
      error: null,
    } as ApiResponse<typeof result>);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      success: false,
      data: null,
      error: message,
    } as ApiResponse<null>, { status: 500 });
  }
}
