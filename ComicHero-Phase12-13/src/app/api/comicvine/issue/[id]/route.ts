import { NextRequest, NextResponse } from "next/server";
import { getIssueDetail } from "@/lib/comicvine/issues";
import type { ApiResponse } from "@/types/api";
import type { ComicIssue } from "@/types/comic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issueId = parseInt(id, 10);

  if (isNaN(issueId)) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Invalid issue ID",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const issue = await getIssueDetail(issueId);

    if (!issue) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Issue not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<ComicIssue> = {
      success: true,
      data: issue,
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
