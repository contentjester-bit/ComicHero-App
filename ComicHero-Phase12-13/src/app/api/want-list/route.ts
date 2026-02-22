import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export async function GET() {
  try {
    const items = await prisma.wantListItem.findMany({
      include: {
        matches: {
          where: { isNew: true },
          orderBy: { foundAt: "desc" },
        },
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = items.map((item) => ({
      ...item,
      matchCount: item._count.matches,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      lastCheckedAt: item.lastCheckedAt?.toISOString() || null,
    }));

    const response: ApiResponse<typeof mapped> = {
      success: true,
      data: mapped,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { volumeName, issueNumber, targetMaxPrice, notes } = body;

    if (!volumeName || !issueNumber || !targetMaxPrice) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "volumeName, issueNumber, and targetMaxPrice are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const item = await prisma.wantListItem.create({
      data: {
        volumeName,
        issueNumber: String(issueNumber),
        targetMaxPrice: parseFloat(targetMaxPrice),
        notes: notes || null,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: "id is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const item = await prisma.wantListItem.update({
      where: { id },
      data: {
        ...(updates.volumeName && { volumeName: updates.volumeName }),
        ...(updates.issueNumber && {
          issueNumber: String(updates.issueNumber),
        }),
        ...(updates.targetMaxPrice && {
          targetMaxPrice: parseFloat(updates.targetMaxPrice),
        }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        ...(updates.isActive !== undefined && { isActive: updates.isActive }),
      },
    });

    const response: ApiResponse<typeof item> = {
      success: true,
      data: item,
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

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: "id query parameter required",
    };
    return NextResponse.json(response, { status: 400 });
  }

  try {
    await prisma.wantListItem.delete({ where: { id } });

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
