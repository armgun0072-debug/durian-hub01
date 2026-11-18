import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { OtpPurpose } from "@prisma/client";
import { registrationError, resendRegistration } from "@/lib/pending-registration";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.registrationId) {
      try { return await resendRegistration(body.registrationId); }
      catch (error) { return registrationError(error); }
    }
    const { userId, purpose = "VERIFY_EMAIL" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาระบุ userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: { roles: true },
    });

    if (!user || (purpose === "VERIFY_EMAIL" && (user.emailVerifiedAt || user.status !== "ACTIVE" ||
        user.activeRole === "ADMIN" || user.roles.some(role => role.roleType === "ADMIN")))) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้งาน" },
        { status: 404 }
      );
    }

    if (purpose === "VERIFY_EMAIL" && await prisma.pendingRegistration.findFirst({
      where: { legacyUserId: user.id, expiresAt: { gt: new Date() } }, select: { revision: true },
    })) {
      return NextResponse.json({ error: "มีคำขอแก้ข้อมูลอยู่ กรุณากลับไปที่แบบฟอร์มสมัครและใช้รหัสผ่านเดิม" }, { status: 409 });
    }
    await createAndSendOtp({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      purpose: purpose as OtpPurpose,
    });

    return NextResponse.json({
      success: true,
      message: `ส่งรหัส OTP ใหม่ไปยัง ${user.email} เรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม`,
    });
  } catch (error: unknown) {
    console.error("Resend OTP Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งรหัส OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
