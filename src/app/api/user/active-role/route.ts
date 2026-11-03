import { NextResponse } from "next/server";
import { getCurrentUser, signSessionToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RoleType } from "@prisma/client";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const body = await request.json();
    const { activeRole } = body as { activeRole: RoleType };

    if (!activeRole) {
      return NextResponse.json({ error: "กรุณาระบุบทบาทที่ต้องการสลับ" }, { status: 400 });
    }

    // Verify user has this active approved role
    const activeRoles = user.roles
      .filter((r) => r.status === "ACTIVE")
      .map((r) => r.roleType);

    if (!activeRoles.includes(activeRole)) {
      return NextResponse.json(
        { error: `คุณยังไม่ได้รับอนุมัติให้ใช้งานบทบาท ${activeRole}` },
        { status: 403 }
      );
    }

    // Update in MySQL
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { activeRole },
    });

    // Update JWT Session Cookie
    const token = await signSessionToken({
      userId: updated.id,
      email: updated.email,
      phone: updated.phone,
      activeRole: updated.activeRole,
    });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: `สลับบทบาทเป็น ${activeRole} สำเร็จแล้ว`,
      activeRole: updated.activeRole,
      businessName: user.roles.find(r => r.roleType === activeRole && r.status === "ACTIVE")?.businessName || user.fullName,
    });
  } catch (error) {
    console.error("Active Role Update Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสลับบทบาท" },
      { status: 500 }
    );
  }
}

