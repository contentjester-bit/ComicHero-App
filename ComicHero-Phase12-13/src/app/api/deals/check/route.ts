import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { searchByIssue } from "@/lib/ebay/search";
import type { ApiResponse } from "@/types/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const specificItemId = body?.wantListItemId;

    const items = await prisma.wantListItem.findMany({
      where: {
        isActive: true,
        ...(specificItemId ? { id: specificItemId } : {}),
      },
    });

    let totalNewMatches = 0;

    for (const item of items) {
      try {
        const result = await searchByIssue({
          volumeName: item.volumeName,
          issueNumber: item.issueNumber,
          maxPrice: item.targetMaxPrice,
          limit: 20,
        });

        for (const listing of result.listings) {
          try {
            await prisma.wantListMatch.upsert({
              where: {
                wantListItemId_ebayItemId: {
                  wantListItemId: item.id,
                  ebayItemId: listing.itemId,
                },
              },
              update: {
                price: listing.price,
                totalPrice: listing.totalPrice,
                title: listing.title,
              },
              create: {
                wantListItemId: item.id,
                ebayItemId: listing.itemId,
                title: listing.title,
                price: listing.price,
                totalPrice: listing.totalPrice,
                imageUrl: listing.imageUrl,
                itemUrl: listing.itemUrl,
                isNew: true,
              },
            });
            totalNewMatches++;
          } catch {
            // Skip individual listing errors
          }
        }

        await prisma.wantListItem.update({
          where: { id: item.id },
          data: { lastCheckedAt: new Date() },
        });
      } catch {
        // Skip items that fail to search, continue with others
      }
    }

    const response: ApiResponse<{ checkedItems: number; newMatches: number }> =
      {
        success: true,
        data: {
          checkedItems: items.length,
          newMatches: totalNewMatches,
        },
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
