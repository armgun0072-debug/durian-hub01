import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { positiveId } from "@/lib/input";

// Counts detail opens, not unique people. Hidden posts cannot receive views.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const postId = positiveId((await params).id);
  if (!postId) return NextResponse.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
  try {
    const result = await prisma.marketplacePost.updateMany({
      where: { id: postId, status: { in: ["OPEN", "CLOSED"] } },
      data: { viewCount: { increment: 1 } },
    });
    if (!result.count) return NextResponse.json({ error: "ไม่พบประกาศ" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST View Error:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกการเข้าชมได้" }, { status: 500 });
  }
}
