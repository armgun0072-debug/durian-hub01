import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAndSendOtp } from "@/lib/otp";
import { OtpPurpose } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, purpose = "VERIFY_EMAIL" } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "กรุณาระบุ userId" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!user) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลผู้ใช้งาน" },
        { status: 404 }
      );
    }

    await createAndSendOtp({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      purpose: purpose as OtpPurpose,
    });

    return NextResponse.json({
      success: true,
      message: `ส่งรหัส OTP ใหม่ไปยัง ${user.email} เรียบร้อยแล้ว (เปิดดูได้ที่ Mailpit)`,
    });
  } catch (error: unknown) {
    console.error("Resend OTP Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการส่งรหัส OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
