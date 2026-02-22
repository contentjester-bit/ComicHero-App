import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const bundle = await prisma.curatedBundle.findUnique({ where: { id }, include: { items: { orderBy: { sortOrder: "asc" } } } });
    if (!bundle) return NextResponse.json({ success: false, data: null, error: "Bundle not found" } as ApiResponse<null>, { status: 404 });
    return NextResponse.json({ success: true, data: bundle, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed" } as ApiResponse<null>, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, description, theme, status } = body;
    const bundle = await prisma.curatedBundle.update({
      where: { id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(theme !== undefined && { theme }), ...(status && { status }) },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json({ success: true, data: bundle, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed" } as ApiResponse<null>, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.curatedBundle.delete({ where: { id } });
    return NextResponse.json({ success: true, data: { deleted: true }, error: null });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed" } as ApiResponse<null>, { status: 500 });
  }
}

// Add item to bundle
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { action, volumeName, issueNumber, comicVineIssueId, imageUrl, reason, itemId } = body;

    if (action === "add_item") {
      const count = await prisma.curatedBundleItem.count({ where: { bundleId: id } });
      const item = await prisma.curatedBundleItem.create({
        data: { bundleId: id, volumeName, issueNumber, comicVineIssueId: comicVineIssueId || null, imageUrl: imageUrl || null, reason: reason || null, sortOrder: count },
      });
      return NextResponse.json({ success: true, data: item, error: null });
    }

    if (action === "remove_item" && itemId) {
      await prisma.curatedBundleItem.delete({ where: { id: itemId } });
      return NextResponse.json({ success: true, data: { deleted: true }, error: null });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" } as ApiResponse<null>, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, data: null, error: error instanceof Error ? error.message : "Failed" } as ApiResponse<null>, { status: 500 });
  }
}
