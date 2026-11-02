import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, otpCode, newPassword } = body;

    if (!userId || !otpCode || !newPassword) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อมูลให้ครบถ้วน (userId, รหัส OTP และรหัสผ่านใหม่)" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    // Verify OTP for RESET_PASSWORD
    await verifyOtp({
      userId: Number(userId),
      otpCode: otpCode.trim(),
      purpose: "RESET_PASSWORD",
    });

    // Hash new password and update user
    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        passwordHash,
        emailVerifiedAt: new Date(), // If reset via email OTP, their email is verified too
      },
    });

    return NextResponse.json({
      success: true,
      message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
    });
  } catch (error: unknown) {
    console.error("Reset Password Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
