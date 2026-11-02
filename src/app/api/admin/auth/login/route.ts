import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signSessionToken, setAdminSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมล/เบอร์โทรศัพท์ และรหัสผ่านแอดมิน" },
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
        { error: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ" },
        { status: 401 }
      );
    }

    // STRICT ADMIN CHECK: must have ADMIN role
    const hasAdminRole =
      user.activeRole === "ADMIN" ||
      user.roles.some((r) => r.roleType === "ADMIN" && r.status === "ACTIVE");

    if (!hasAdminRole) {
      return NextResponse.json(
        {
          error: "สิทธิ์ไม่เพียงพอ: บัญชีนี้ไม่ใช่ผู้ดูแลระบบ (Admin Access Only)",
        },
        { status: 403 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "บัญชีผู้ดูแลระบบนี้ถูกระงับการใช้งาน" },
        { status: 403 }
      );
    }

    // Verify Password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "ข้อมูลเข้าสู่ระบบไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ" },
        { status: 401 }
      );
    }

    // Sign session token specifically as ADMIN
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      activeRole: "ADMIN",
    });

    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: "ยินดีต้อนรับสู่ระบบบริหารจัดการ Durian Hub (Admin Console)",
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        activeRole: "ADMIN",
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบผู้ดูแลระบบ" },
      { status: 500 }
    );
  }
}

