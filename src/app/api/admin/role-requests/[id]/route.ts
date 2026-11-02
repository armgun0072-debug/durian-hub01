import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const requestId = parseInt(id, 10);
    if (isNaN(requestId)) {
      return NextResponse.json({ error: "รหัสคำขอไม่ถูกต้อง" }, { status: 400 });
    }

    const roleRequest = await prisma.roleVerificationRequest.findUnique({
      where: { id: requestId },
      include: { user: true },
    });

    if (!roleRequest) {
      return NextResponse.json({ error: "ไม่พบคำขอเพิ่มบทบาทนี้" }, { status: 404 });
    }

    const body = await request.json();
    const { action, adminRemark } = body as {
      action: "APPROVE" | "REJECT";
      adminRemark?: string;
    };

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { error: "คำสั่งไม่ถูกต้อง (รองรับเฉพาะ APPROVE หรือ REJECT)" },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      // 1. Update verification request status
      const updatedRequest = await prisma.roleVerificationRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          reviewedByAdminId: admin.id,
          reviewedAt: new Date(),
          adminRemark: adminRemark?.trim() || "อนุมัติเอกสารเรียบร้อยแล้ว",
        },
      });

      // 2. Grant the role in UserRole
      await prisma.userRole.upsert({
        where: {
          userId_roleType: {
            userId: roleRequest.userId,
            roleType: roleRequest.requestedRole,
          },
        },
        update: {
          status: "ACTIVE",
          isVerified: true,
          businessName: roleRequest.businessName,
          licenseNumber: roleRequest.licenseNumber,
        },
        create: {
          userId: roleRequest.userId,
          roleType: roleRequest.requestedRole,
          isPrimaryRole: false,
          businessName: roleRequest.businessName,
          licenseNumber: roleRequest.licenseNumber,
          status: "ACTIVE",
          isVerified: true,
        },
      });

      // 3. Mark user as KYC verified (คะแนนความประพฤติสูงสุดคงที่ 100 คะแนน)
      await prisma.user.update({
        where: { id: roleRequest.userId },
        data: {
          isKycVerified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: `อนุมัติคำขอเพิ่มบทบาท ${roleRequest.requestedRole} เรียบร้อยแล้ว`,
        request: updatedRequest,
      });
    } else {
      // REJECT
      const updatedRequest = await prisma.roleVerificationRequest.update({
        where: { id: requestId },
        data: {
          status: "REJECTED",
          reviewedByAdminId: admin.id,
          reviewedAt: new Date(),
          adminRemark:
            adminRemark?.trim() || "เอกสารไม่ชัดเจนหรือไม่ตรงตามหลักเกณฑ์ กรุณาแนบใหม่",
        },
      });

      return NextResponse.json({
        success: true,
        message: `ปฏิเสธคำขอเพิ่มบทบาท ${roleRequest.requestedRole} เรียบร้อยแล้ว`,
        request: updatedRequest,
      });
    }
  } catch (error) {
    console.error("Admin Role Request Action Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดำเนินการคำขอ" },
      { status: 500 }
    );
  }
}

