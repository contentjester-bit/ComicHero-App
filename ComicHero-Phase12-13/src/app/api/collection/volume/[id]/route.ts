import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { VolumeCollectionStatus } from "@/types/collection";

export async function GET(
  _request: Request,
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

  try {
    const items = await prisma.collectionItem.findMany({
      where: { comicVineVolumeId: volumeId },
      select: { comicVineIssueId: true },
    });

    const status: VolumeCollectionStatus = {
      volumeId,
      ownedIssueIds: items.map((i) => i.comicVineIssueId),
      ownedCount: items.length,
    };

    const response: ApiResponse<VolumeCollectionStatus> = {
      success: true,
      data: status,
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
