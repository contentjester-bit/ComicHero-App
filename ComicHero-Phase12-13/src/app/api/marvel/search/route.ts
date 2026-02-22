import { NextRequest, NextResponse } from "next/server";
import { searchMarvelComic, searchMarvelCharacter } from "@/lib/marvel/search";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
  const issue = searchParams.get("issue");
  const character = searchParams.get("character");
  const type = searchParams.get("type") || "comics";

  // Character search mode
  if (type === "characters" && character) {
    try {
      const results = await searchMarvelCharacter(character);
      return NextResponse.json({ success: true, data: results, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Marvel character search failed";
      return NextResponse.json(
        { success: false, data: [], error: message } as ApiResponse<never[]>,
        { status: 500 }
      );
    }
  }

  // Comic search mode
  if (!title) {
    return NextResponse.json(
      { success: false, data: null, error: "title parameter required" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const results = await searchMarvelComic(title, issue || undefined);
    return NextResponse.json({ success: true, data: results, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Marvel search failed";
    return NextResponse.json(
      { success: false, data: [], error: message } as ApiResponse<never[]>,
      { status: 500 }
    );
  }
}
