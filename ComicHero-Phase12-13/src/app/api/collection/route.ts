import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const volumeId = searchParams.get("volumeId");
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    const where = volumeId
      ? { comicVineVolumeId: parseInt(volumeId, 10) }
      : {};

    const [items, total] = await Promise.all([
      prisma.collectionItem.findMany({
        where,
        orderBy: volumeId
          ? { issueNumber: "asc" }
          : { addedAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.collectionItem.count({ where }),
    ]);

    const mapped = items.map((item) => ({
      ...item,
      addedAt: item.addedAt.toISOString(),
    }));

    const response: ApiResponse<typeof mapped> = {
      success: true,
      data: mapped,
      error: null,
      meta: { total, offset, limit, cached: false },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      comicVineIssueId,
      comicVineVolumeId,
      volumeName,
      issueNumber,
      name,
      imageUrl,
      coverDate,
      condition,
      notes,
      pricePaid,
    } = body;

    if (!comicVineIssueId || !comicVineVolumeId || !volumeName || !issueNumber) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error:
          "comicVineIssueId, comicVineVolumeId, volumeName, and issueNumber are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const item = await prisma.collectionItem.upsert({
      where: { comicVineIssueId: parseInt(String(comicVineIssueId), 10) },
      create: {
        comicVineIssueId: parseInt(String(comicVineIssueId), 10),
        comicVineVolumeId: parseInt(String(comicVineVolumeId), 10),
        volumeName,
        issueNumber: String(issueNumber),
        name: name || null,
        imageUrl: imageUrl || null,
        coverDate: coverDate || null,
        condition: condition || null,
        notes: notes || null,
        pricePaid: pricePaid ? parseFloat(pricePaid) : null,
      },
      update: {
        condition: condition || undefined,
        notes: notes || undefined,
        pricePaid: pricePaid ? parseFloat(pricePaid) : undefined,
      },
    });

    const response: ApiResponse<typeof item> = {
      success: true,
      data: item,
      error: null,
    };
    return NextResponse.json(response, { status: 201 });
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

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const issueId = request.nextUrl.searchParams.get("issueId");

  if (!id && !issueId) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "id or issueId query parameter required",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    if (id) {
      await prisma.collectionItem.delete({ where: { id } });
    } else {
      await prisma.collectionItem.delete({
        where: { comicVineIssueId: parseInt(issueId!, 10) },
      });
    }

    const response: ApiResponse<{ deleted: true }> = {
      success: true,
      data: { deleted: true },
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
