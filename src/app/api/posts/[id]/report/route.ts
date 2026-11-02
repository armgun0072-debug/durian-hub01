import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportReason } from "@prisma/client";
import { positiveId } from "@/lib/input";

class ReportError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new ReportError("กรุณาเข้าสู่ระบบก่อนทำรายการ", 401);
    const postId = positiveId((await params).id);
    if (!postId) throw new ReportError("รหัสประกาศไม่ถูกต้อง", 400);
    let body;
    try { body = await request.json(); }
    catch { throw new ReportError("ข้อมูล JSON ไม่ถูกต้อง", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body) || !Object.values(ReportReason).includes(body.reason)) throw new ReportError("เหตุผลในการรายงานไม่ถูกต้อง", 400);
    if (body.detail != null && (typeof body.detail !== "string" || body.detail.length > 5000)) throw new ReportError("รายละเอียดต้องเป็นข้อความไม่เกิน 5,000 ตัวอักษร", 400);
    const detail: string | null = body.detail?.trim() || null;
    const report = await prisma.$transaction(async (tx) => {
      const post = await tx.marketplacePost.findUnique({ where: { id: postId } });
      if (!post || post.status === "HIDDEN_BY_ADMIN") throw new ReportError("ไม่พบประกาศนี้ในระบบ", 404);
      if (post.userId === user.id) throw new ReportError("ไม่สามารถรายงานประกาศของตัวเองได้", 400);
      // The count includes every report, regardless of its moderation status.
      // Lock the parent before inserting the child to avoid FK lock-upgrade deadlocks.
      await tx.marketplacePost.update({ where: { id: postId }, data: { reportCount: { increment: 1 } } });
      const created = await tx.postReport.create({ data: { postId, reporterId: user.id, reason: body.reason, detail, status: "PENDING" } });
      return created;
    });
    return NextResponse.json({ success: true, message: "แจ้งรายงานปัญหาไปยังผู้ดูแลระบบเรียบร้อยแล้ว", report });
  } catch (error) {
    if (error instanceof ReportError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Report Post Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการส่งรายงานปัญหา" }, { status: 500 });
  }
}
