import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, otpCode } = body;

    if (!userId || !otpCode) {
      return NextResponse.json(
        { error: "กรุณาระบุข้อมูล userId และรหัส OTP ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // Verify OTP
    await verifyOtp({
      userId: Number(userId),
      otpCode: otpCode.trim(),
      purpose: "VERIFY_EMAIL",
    });

    // Mark email as verified
    const user = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        emailVerifiedAt: new Date(),
      },
      include: {
        roles: true,
        location: true,
      },
    });

    // Create session token and set cookie
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      activeRole: user.activeRole,
    });

    await setSessionCookie(token);

    const primaryRoleObj = user.roles.find((r) => r.isPrimaryRole) || user.roles[0];

    return NextResponse.json({
      success: true,
      message: "ยืนยันอีเมลสำเร็จ และเข้าสู่ระบบเรียบร้อยแล้ว",
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
        phone: user.phone,
        businessName: primaryRoleObj?.businessName || user.fullName,
        province: user.location?.province || "จันทบุรี",
        primaryRole: user.activeRole,
        approvedRoles: user.roles.map((r) => r.roleType),
        activeRole: user.activeRole,
        trustScore: user.trustScore,
        rating: Number(user.ratingAvg),
        isEmailVerified: true,
      },
    });
  } catch (error: unknown) {
    console.error("Verify Email Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการยืนยันรหัส OTP";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
