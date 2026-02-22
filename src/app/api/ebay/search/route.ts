import { NextRequest, NextResponse } from "next/server";
import { searchByIssue, searchByCharacter } from "@/lib/ebay/search";
import type { ApiResponse } from "@/types/api";
import type { Listing } from "@/types/listing";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const volumeName = searchParams.get("volumeName");
  const issueNumber = searchParams.get("issueNumber");
  const characterName = searchParams.get("characterName");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") as
    | "price_asc"
    | "price_desc"
    | "date_newest"
    | "best_match"
    | null;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    let result: { listings: Listing[]; total: number };

    if (characterName) {
      result = await searchByCharacter({
        characterName,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort: sort || undefined,
        limit,
        offset,
      });
    } else if (volumeName && issueNumber) {
      result = await searchByIssue({
        volumeName,
        issueNumber,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        sort: sort || undefined,
        limit,
        offset,
      });
    } else {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Provide volumeName+issueNumber or characterName",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const response: ApiResponse<Listing[]> = {
      success: true,
      data: result.listings,
      error: null,
      meta: {
        total: result.total,
        offset,
        limit,
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
