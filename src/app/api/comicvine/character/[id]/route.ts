import { NextRequest, NextResponse } from "next/server";
import { getCharacterDetail } from "@/lib/comicvine/characters";
import type { ApiResponse } from "@/types/api";
import type { Character } from "@/types/comic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const characterId = parseInt(id, 10);

  if (isNaN(characterId)) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "Invalid character ID",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    const character = await getCharacterDetail(characterId);

    if (!character) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "Character not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Character> = {
      success: true,
      data: character,
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
