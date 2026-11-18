import { completeRegistration, registrationError } from "@/lib/pending-registration";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { signSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, otpCode } = body;

    let user;
    if (body.registrationId) {
      try { user = await completeRegistration(body.registrationId, String(otpCode ?? "").trim()); }
      catch (error) { return registrationError(error); }
    } else {
      // Existing registrations created before temporary requests were introduced.
      if (!userId || !otpCode) return NextResponse.json({ error: "กรุณาระบุรหัส OTP" }, { status: 400 });
      const eligible = { id: Number(userId), status: "ACTIVE" as const, emailVerifiedAt: null,
        activeRole: { not: "ADMIN" as const }, roles: { none: { roleType: "ADMIN" as const } } };
      if (!await prisma.user.findFirst({ where: eligible }))
        return NextResponse.json({ error: "ไม่พบบัญชีผู้สมัครที่รอยืนยัน" }, { status: 400 });
      await verifyOtp({ userId: Number(userId), otpCode: otpCode.trim(), purpose: "VERIFY_EMAIL" });
      user = await prisma.user.update({ where: eligible, data: { emailVerifiedAt: new Date() },
        include: { roles: true, location: true } });
    }
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
        province: user.location?.province || "",
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
