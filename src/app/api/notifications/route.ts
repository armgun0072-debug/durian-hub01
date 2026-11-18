import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const [roleReqs, recentDeals, recentReviews] = await Promise.all([
      prisma.roleVerificationRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          requestedRole: true,
          businessName: true,
          status: true,
          adminRemark: true,
          reviewedAt: true,
          createdAt: true,
        },
      }),
      prisma.deal.findMany({
        where: { OR: [{ initiatorId: user.id }, { receiverId: user.id }] },
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: {
          post: { select: { title: true } },
          initiator: { select: { id: true, fullName: true } },
          receiver: { select: { id: true, fullName: true } },
        },
      }),
      prisma.userReview.findMany({
        where: { revieweeId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          reviewer: { select: { fullName: true } },
          deal: { select: { post: { select: { title: true } } } },
        },
      }),
    ]);

    const items: Array<{
      id: string;
      kind: "ROLE" | "DEAL" | "REVIEW";
      titleTh: string;
      titleEn: string;
      detailTh: string;
      detailEn: string;
      createdAt: string;
    }> = [];

    for (const r of roleReqs) {
      if (r.status === "PENDING") continue;
      const roleTh =
        r.requestedRole === "SELLER"
          ? "ชาวสวนผู้ขาย"
          : r.requestedRole === "BUYER"
          ? "ล้งรับซื้อ"
          : "ทีมตัดทุเรียน";
      items.push({
        id: `role-${r.id}-${r.status}`,
        kind: "ROLE",
        titleTh:
          r.status === "APPROVED"
            ? `อนุมัติบทบาท "${roleTh}" แล้ว`
            : `คำขอบทบาท "${roleTh}" ไม่ผ่านการอนุมัติ`,
        titleEn:
          r.status === "APPROVED"
            ? `Role "${r.requestedRole}" approved`
            : `Role "${r.requestedRole}" rejected`,
        detailTh: r.adminRemark
          ? `${r.businessName} • หมายเหตุ: ${r.adminRemark}`
          : r.businessName,
        detailEn: r.adminRemark
          ? `${r.businessName} • Note: ${r.adminRemark}`
          : r.businessName,
        createdAt: (r.reviewedAt || r.createdAt).toISOString(),
      });
    }

    for (const d of recentDeals) {
      const partner = d.initiatorId === user.id ? d.receiver.fullName : d.initiator.fullName;
      items.push({
        id: `deal-${d.id}-${d.status}`,
        kind: "DEAL",
        titleTh:
          d.status === "COMPLETED"
            ? `ส่งมอบดีล #${d.id} เสร็จสมบูรณ์`
            : `บันทึกสัญญาดีล #${d.id} สำเร็จ`,
        titleEn:
          d.status === "COMPLETED"
            ? `Deal #${d.id} marked completed`
            : `Deal #${d.id} contract confirmed`,
        detailTh: `${d.post.title} • คู่ค้า: ${partner} (฿${Number(d.agreedPrice).toLocaleString()})`,
        detailEn: `${d.post.title} • Partner: ${partner} (฿${Number(d.agreedPrice).toLocaleString()})`,
        createdAt: d.updatedAt.toISOString(),
      });
    }

    for (const rv of recentReviews) {
      items.push({
        id: `review-${rv.id}`,
        kind: "REVIEW",
        titleTh: `ได้รับรีวิว ★ ${rv.rating}/5 จาก ${rv.reviewer.fullName}`,
        titleEn: `Received ★ ${rv.rating}/5 review from ${rv.reviewer.fullName}`,
        detailTh: rv.comment ? `"${rv.comment}" • ${rv.deal.post.title}` : rv.deal.post.title,
        detailEn: rv.comment ? `"${rv.comment}" • ${rv.deal.post.title}` : rv.deal.post.title,
        createdAt: rv.createdAt.toISOString(),
      });
    }

    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json(
      { success: true, notifications: items.slice(0, 15) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET Notifications Error:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดการแจ้งเตือนได้" }, { status: 500 });
  }
}
