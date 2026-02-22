import { NextRequest, NextResponse } from "next/server";
import { getVolumeDetail, getVolumeIssues } from "@/lib/comicvine/issues";
import type { ApiResponse } from "@/types/api";
import type { ComicVolume, ComicIssue } from "@/types/comic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const volumeId = parseInt(id, 10);

  if (isNaN(volumeId)) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Invalid volume ID",
    };
    return NextResponse.json(response, { status: 400 });
  }

  const searchParams = request.nextUrl.searchParams;
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  try {
    const [volume, issuesResult] = await Promise.all([
      getVolumeDetail(volumeId),
      getVolumeIssues(volumeId, offset, limit),
    ]);

    if (!volume) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Volume not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<{ volume: ComicVolume; issues: ComicIssue[] }> = {
      success: true,
      data: { volume, issues: issuesResult.issues },
      error: null,
      meta: {
        total: issuesResult.total,
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
