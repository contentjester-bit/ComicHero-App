import { NextRequest, NextResponse } from "next/server";
import { searchGCDIssue } from "@/lib/gcd/search";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const series = searchParams.get("series");
  const issue = searchParams.get("issue");

  if (!series || !issue) {
    return NextResponse.json(
      { success: false, data: null, error: "series and issue parameters required" } as ApiResponse<null>,
      { status: 400 }
    );
  }

  try {
    const results = await searchGCDIssue(series, issue);
    return NextResponse.json({ success: true, data: results, error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GCD search failed";
    return NextResponse.json(
      { success: false, data: null, error: message } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
