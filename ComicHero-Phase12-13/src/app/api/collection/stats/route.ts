import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";
import type { CollectionStats } from "@/types/collection";

export async function GET() {
  try {
    const [totalIssues, volumeGroups, valueResult, recentItems] =
      await Promise.all([
        prisma.collectionItem.count(),
        prisma.collectionItem.groupBy({
          by: ["comicVineVolumeId"],
        }),
        prisma.collectionItem.aggregate({
          _sum: { pricePaid: true },
        }),
        prisma.collectionItem.findMany({
          orderBy: { addedAt: "desc" },
          take: 10,
        }),
      ]);

    const stats: CollectionStats = {
      totalIssues,
      totalVolumes: volumeGroups.length,
      totalValue: valueResult._sum.pricePaid || 0,
      recentlyAdded: recentItems.map((item) => ({
        ...item,
        addedAt: item.addedAt.toISOString(),
      })),
    };

    const response: ApiResponse<CollectionStats> = {
      success: true,
      data: stats,
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
