import { NextRequest, NextResponse } from "next/server";
import { getItemDetail } from "@/lib/ebay/search";
import type { ApiResponse } from "@/types/api";
import type { Listing } from "@/types/listing";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;

  try {
    const listing = await getItemDetail(itemId);

    if (!listing) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Item not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Listing> = {
      success: true,
      data: listing,
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
