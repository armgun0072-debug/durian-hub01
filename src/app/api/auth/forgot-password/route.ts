import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุอีเมล" }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    // If user exists, create and send OTP for RESET_PASSWORD
    if (user && user.status === "ACTIVE") {
      try {
        await createAndSendOtp({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          purpose: "RESET_PASSWORD",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "ไม่สามารถส่งรหัสได้";
        return NextResponse.json({ error: msg }, { status: 429 });
      }

      return NextResponse.json({
        success: true,
        userId: user.id,
        email: user.email,
        message: `ระบบได้ส่งรหัส OTP สำหรับตั้งรหัสผ่านใหม่ไปยัง ${user.email} แล้ว (เปิดดูได้ที่ Mailpit http://localhost:8025)`,
      });
    }

    // Security practice: don't reveal if email doesn't exist, but indicate check
    return NextResponse.json({
      success: true,
      userId: null,
      message: "หากมีอีเมลนี้ในระบบ เราได้จัดส่งรหัส OTP สำหรับตั้งรหัสผ่านใหม่ไปเรียบร้อยแล้ว",
    });
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
