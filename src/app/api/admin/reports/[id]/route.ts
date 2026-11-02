import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluatePenaltyFromScore } from "@/lib/trust";
import { applyUserPenalty } from "@/lib/user-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: บัญชีนี้ไม่ใช่ผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "รหัสรายงานไม่ถูกต้อง" }, { status: 400 });
    }

    const report = await prisma.postReport.findUnique({
      where: { id: reportId },
      include: { post: { include: { user: true } } },
    });

    if (!report) {
      return NextResponse.json({ error: "ไม่พบรายการแจ้งปัญหานี้" }, { status: 404 });
    }

    const body = await request.json();
    const { action, deductScore } = body as {
      action: "HIDE_POST_AND_RESOLVE" | "DISMISS";
      deductScore?: number;
    };

    if (action === "HIDE_POST_AND_RESOLVE") {
      // 1. Mark report as resolved / approved
      await prisma.postReport.update({
        where: { id: reportId },
        data: { status: "APPROVED" },
      });

      // 2. Hide the offending post from public marketplace
      await prisma.marketplacePost.update({
        where: { id: report.postId },
        data: { status: "HIDDEN_BY_ADMIN" },
      });

      // 3. Determine score deduction based on admin input or default by reason
      const defaultDeductions: Record<string, number> = {
        WRONG_INFO: 10,
        SPAM: 20,
        FAKE_PRICE: 30,
        SCAM: 100,
      };
      const deduction =
        typeof deductScore === "number" && deductScore > 0
          ? deductScore
          : defaultDeductions[report.reason] || 15;

      const currentScore = report.post.user.trustScore;
      const newRawScore = currentScore - deduction;

      const reasonMap: Record<string, string> = {
        WRONG_INFO: "ลงข้อมูลสายพันธุ์หรือพื้นที่ผิดพลาด",
        SPAM: "โพสต์สแปมหรือก่อกวนระบบ",
        FAKE_PRICE: "จงใจปั่นราคากลางหรือลงราคาเท็จ",
        SCAM: "ตรวจพบพฤติกรรมหลอกลวง/มิจฉาชีพ",
      };

      const penalty = evaluatePenaltyFromScore(
        newRawScore,
        `ถูกหักคะแนน -${deduction} คะแนน เนื่องจาก: ${reasonMap[report.reason] || report.reason}`
      );

      await applyUserPenalty({
        userId: report.post.userId,
        trustScore: penalty.clampedScore,
        status: penalty.status,
        suspendedUntil: penalty.suspendedUntil,
        suspensionReason: penalty.suspensionReason,
      });

      return NextResponse.json({
        success: true,
        message: `ซ่อนประกาศและหักคะแนน -${deduction} คะแนนเรียบร้อยแล้ว (${penalty.penaltySummary})`,
      });
    } else if (action === "DISMISS") {
      // Dismiss report
      await prisma.postReport.update({
        where: { id: reportId },
        data: { status: "REJECTED" },
      });

      return NextResponse.json({
        success: true,
        message: "ยกเลิกการรายงานเรียบร้อยแล้ว (ไม่พบความผิดปกติในประกาศ)",
      });
    } else {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Admin Report Action Error:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการจัดการรายงานปัญหา" },
      { status: 500 }
    );
  }
}

