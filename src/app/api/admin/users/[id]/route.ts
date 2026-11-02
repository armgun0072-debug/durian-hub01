import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";
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
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "รหัสผู้ใช้ไม่ถูกต้อง" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้นี้ในระบบ" }, { status: 404 });
    }

    const body = await request.json();
    const { action, roleType, businessName, delta, reason } = body as {
      action: "SUSPEND" | "ACTIVATE" | "GRANT_ROLE" | "ADJUST_TRUST" | "RESET_TRUST";
      roleType?: RoleType;
      businessName?: string;
      delta?: number;
      reason?: string;
    };

    if (action === "SUSPEND") {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const updated = await applyUserPenalty({
        userId,
        trustScore: targetUser.trustScore,
        status: "SUSPENDED",
        suspendedUntil: until,
        suspensionReason: reason || "ระงับการใช้งานชั่วคราวโดยผู้ดูแลระบบ (7 วัน)",
      });
      return NextResponse.json({
        success: true,
        message: `ระงับการใช้งานบัญชี ${targetUser.fullName} ชั่วคราว 7 วัน เรียบร้อยแล้ว`,
        user: updated,
      });
    } else if (action === "ACTIVATE") {
      const newScore = targetUser.trustScore < 80 ? 100 : targetUser.trustScore;
      const updated = await applyUserPenalty({
        userId,
        trustScore: newScore,
        status: "ACTIVE",
        suspendedUntil: null,
        suspensionReason: null,
      });
      return NextResponse.json({
        success: true,
        message: `ปลดระงับและเปิดใช้งานบัญชี ${targetUser.fullName} เรียบร้อยแล้ว`,
        user: updated,
      });
    } else if (action === "GRANT_ROLE") {
      if (!roleType) {
        return NextResponse.json({ error: "กรุณาระบุบทบาทที่ต้องการมอบให้" }, { status: 400 });
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleType: {
            userId,
            roleType,
          },
        },
        update: {
          status: "ACTIVE",
          isVerified: true,
          businessName: businessName?.trim() || targetUser.fullName,
        },
        create: {
          userId,
          roleType,
          isPrimaryRole: false,
          businessName: businessName?.trim() || targetUser.fullName,
          status: "ACTIVE",
          isVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `มอบสิทธิ์บทบาท ${roleType} ให้แก่ ${targetUser.fullName} สำเร็จแล้ว`,
      });
    } else if (action === "ADJUST_TRUST") {
      const amount = Number(delta) || 0;
      const newRawScore = targetUser.trustScore + amount;
      const penalty = evaluatePenaltyFromScore(
        newRawScore,
        reason || (amount < 0 ? `ผู้ดูแลระบบหักคะแนน ${amount} คะแนน` : undefined)
      );

      const updated = await applyUserPenalty({
        userId,
        trustScore: penalty.clampedScore,
        status: penalty.status,
        suspendedUntil: penalty.suspendedUntil,
        suspensionReason: penalty.suspensionReason,
      });

      return NextResponse.json({
        success: true,
        message: `ปรับคะแนนของ ${targetUser.fullName} เรียบร้อยแล้ว (${penalty.penaltySummary})`,
        user: updated,
      });
    } else if (action === "RESET_TRUST") {
      const updated = await applyUserPenalty({
        userId,
        trustScore: 100,
        status: "ACTIVE",
        suspendedUntil: null,
        suspensionReason: null,
      });
      return NextResponse.json({
        success: true,
        message: `รีเซ็ตคะแนนของ ${targetUser.fullName} เป็น 100/100 และปลดล็อกบัญชีเรียบร้อยแล้ว`,
        user: updated,
      });
    } else {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin User Action Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการจัดการผู้ใช้" },
      { status: 500 }
    );
  }
}

