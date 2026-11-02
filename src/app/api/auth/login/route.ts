import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password, roleSelect } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล/เบอร์โทรศัพท์ และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim().toLowerCase();

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: trimmed },
          { phone: identifier.trim() },
        ],
      },
      include: {
        roles: true,
        location: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "อีเมล/เบอร์โทรศัพท์ หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (user.status === "BANNED") {
      return NextResponse.json(
        {
          error: `⛔ บัญชีนี้ถูกระงับการใช้งานถาวร (คะแนนความประพฤติ 0/100) ${user.suspensionReason ? `สาเหตุ: ${user.suspensionReason}` : ""}`,
        },
        { status: 403 }
      );
    }

    if (user.status === "SUSPENDED") {
      const now = new Date();
      if (user.suspendedUntil && now > new Date(user.suspendedUntil)) {
        // ครบกำหนดวันระงับชั่วคราวแล้ว ปลดล็อกอัตโนมัติ
        await prisma.user.update({
          where: { id: user.id },
          data: {
            status: "ACTIVE",
            suspendedUntil: null,
            suspensionReason: null,
          },
        });
      } else {
        const untilStr = user.suspendedUntil
          ? new Date(user.suspendedUntil).toLocaleString("th-TH")
          : "ไม่มีกำหนด";
        return NextResponse.json(
          {
            error: `🟠 บัญชีถูกระงับการใช้งานชั่วคราว (คะแนนคงเหลือ ${user.trustScore}/100) ถึงวันที่ ${untilStr} ${user.suspensionReason ? `• สาเหตุ: ${user.suspensionReason}` : ""}`,
          },
          { status: 403 }
        );
      }
    }

    // Check password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "อีเมล/เบอร์โทรศัพท์ หรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    // Check email verification
    if (!user.emailVerifiedAt) {
      return NextResponse.json(
        {
          requireEmailVerification: true,
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          error: "บัญชีของคุณยังไม่ได้ยืนยันอีเมล กรุณากรอกรหัส OTP ที่ระบบส่งให้",
        },
        { status: 403 }
      );
    }

    // Check if account is exclusively an Admin account
    const isExclusivelyAdmin =
      user.activeRole === "ADMIN" &&
      user.roles.every((r) => r.roleType === "ADMIN");

    if (isExclusivelyAdmin) {
      return NextResponse.json(
        {
          error: "บัญชีผู้ดูแลระบบ กรุณาเข้าสู่ระบบผ่านช่องทางเจ้าหน้าที่ (/admin) เท่านั้น",
        },
        { status: 403 }
      );
    }

    // Determine target active role
    const approvedRoleTypes = user.roles
      .filter((r) => r.status === "ACTIVE")
      .map((r) => r.roleType);

    let activeRoleToSet = user.activeRole;
    if (roleSelect && approvedRoleTypes.includes(roleSelect)) {
      activeRoleToSet = roleSelect;
    } else if (approvedRoleTypes.length > 0 && !approvedRoleTypes.includes(activeRoleToSet)) {
      activeRoleToSet = approvedRoleTypes[0];
    }

    // Sign session token and set cookie
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      activeRole: activeRoleToSet,
    });

    await setSessionCookie(token);

    const activeRoleObj =
      user.roles.find((r) => r.roleType === activeRoleToSet) ||
      user.roles[0];

    const roleRequests = await prisma.roleVerificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      message: "เข้าสู่ระบบสำเร็จ",
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
        phone: user.phone,
        businessName: activeRoleObj?.businessName || user.fullName,
        province: user.location?.province || "จันทบุรี",
        primaryRole: user.activeRole,
        approvedRoles: approvedRoleTypes,
        activeRole: activeRoleToSet,
        trustScore: user.trustScore,
        rating: Number(user.ratingAvg),
        ratingCount: user.ratingCount,
        isEmailVerified: true,
        roleRequests,
      },
    });
  } catch (error: unknown) {
    console.error("Login Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
