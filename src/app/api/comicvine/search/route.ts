import { NextRequest, NextResponse } from "next/server";
import { searchCharacters } from "@/lib/comicvine/characters";
import { searchVolumes } from "@/lib/comicvine/issues";
import type { ApiResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query");
  const resources = searchParams.get("resources") || "character,volume";

  if (!query) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Query parameter required",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const results: Record<string, unknown[]> = {};

    if (resources.includes("character")) {
      results.characters = await searchCharacters(query);
    }
    if (resources.includes("volume")) {
      results.volumes = await searchVolumes(query);
    }

    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
      error: null,
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
