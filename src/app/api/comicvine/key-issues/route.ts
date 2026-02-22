import { NextRequest, NextResponse } from "next/server";
import { getSeededKeyIssues, getKeyIssuesForCharacter } from "@/lib/comicvine/key-issues";
import { getIssueDetail } from "@/lib/comicvine/issues";
import type { ApiResponse } from "@/types/api";
import type { KeyIssue, KeyIssueCategory } from "@/types/comic";

async function enrichWithImages(issues: KeyIssue[]): Promise<KeyIssue[]> {
  const needsImage = issues.filter((k) => !k.imageUrl && k.comicVineIssueId);
  // Fetch in parallel batches of 5 to stay under Comic Vine rate limits
  const batchSize = 5;
  for (let i = 0; i < needsImage.length; i += batchSize) {
    const batch = needsImage.slice(i, i + batchSize);
    const details = await Promise.allSettled(
      batch.map((k) => getIssueDetail(k.comicVineIssueId!))
    );
    for (let j = 0; j < batch.length; j++) {
      const result = details[j];
      if (result.status === "fulfilled" && result.value?.imageUrl) {
        batch[j].imageUrl = result.value.imageUrl;
      }
    }
  }
  return issues;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || undefined;
  const category = searchParams.get("category") as KeyIssueCategory | null;
  const characterId = searchParams.get("characterId");
  const withImages = searchParams.get("images") !== "false";

  try {
    let results: KeyIssue[];

    if (characterId) {
      results = await getKeyIssuesForCharacter(parseInt(characterId, 10));
    } else {
      results = getSeededKeyIssues({
        query,
        category: category || undefined,
      });
    }

    // Enrich with Comic Vine cover images (cached after first fetch)
    if (withImages && process.env.COMIC_VINE_API_KEY) {
      results = await enrichWithImages(results);
    }

    const response: ApiResponse<KeyIssue[]> = {
      success: true,
      data: results,
      error: null,
      meta: {
        total: results.length,
        offset: 0,
        limit: results.length,
        cached: false,
      },
    };
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: message,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
