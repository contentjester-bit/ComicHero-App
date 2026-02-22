import { NextRequest, NextResponse } from "next/server";
import { searchMetronIssue, getMetronIssueByComicVineId } from "@/lib/metron/search";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const series = searchParams.get("series");
  const issue = searchParams.get("issue");
  const cvId = searchParams.get("cv_id");

  // Cross-reference by Comic Vine ID (preferred)
  if (cvId) {
    try {
      const result = await getMetronIssueByComicVineId(parseInt(cvId, 10));
      return NextResponse.json({ success: true, data: result ? [result] : [], error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Metron lookup failed";
      return NextResponse.json(
        { success: false, data: [], error: message } as ApiResponse<never[]>,
        { status: 500 }
      );
    }
  }

  if (!series || !issue) {
    return NextResponse.json(
      { success: false, data: null, error: "series+issue or cv_id parameter required" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const results = await searchMetronIssue(series, issue);
    return NextResponse.json({ success: true, data: results, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Metron search failed";
    return NextResponse.json(
      { success: false, data: [], error: message } as ApiResponse<never[]>,
      { status: 500 }
    );
  }
}
