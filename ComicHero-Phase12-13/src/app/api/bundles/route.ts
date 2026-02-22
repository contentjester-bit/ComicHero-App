import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bundles = await prisma.curatedBundle.findMany({
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: bundles, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed to load bundles" } as ApiResponse<null>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, theme, items } = body;
    if (!name) return NextResponse.json({ success: false, data: null, error: "Name required" } as ApiResponse<null>, { status: 400 });

    const bundle = await prisma.curatedBundle.create({
      data: {
        name,
        description: description || null,
        theme: theme || null,
        items: items?.length ? {
          create: items.map((item: { volumeName: string; issueNumber: string; comicVineIssueId?: number; imageUrl?: string; reason?: string }, idx: number) => ({
            volumeName: item.volumeName,
            issueNumber: item.issueNumber,
            comicVineIssueId: item.comicVineIssueId || null,
            imageUrl: item.imageUrl || null,
            reason: item.reason || null,
            sortOrder: idx,
          })),
        } : undefined,
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: bundle, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed to create bundle" } as ApiResponse<null>, { status: 500 });
  }
}
