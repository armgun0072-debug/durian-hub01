import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, businessName, phone, province } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ error: "กรุณาระบุชื่อ-นามสกุล" }, { status: 400 });
    }

    // อัปเดตข้อมูลในตาราง users
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: fullName.trim(),
        phone: phone ? phone.trim() : user.phone,
      },
      include: {
        roles: true,
        location: true,
      },
    });

    // อัปเดตชื่อธุรกิจในตาราง user_roles หากมีการระบุ
    if (businessName && businessName.trim()) {
      const activeRoleRecord = updatedUser.roles.find(
        (r) => r.roleType === updatedUser.activeRole
      );
      if (activeRoleRecord) {
        await prisma.userRole.update({
          where: { id: activeRoleRecord.id },
          data: { businessName: businessName.trim() },
        });
      }
    }

    // อัปเดต Location หากมีการระบุจังหวัด
    if (province && province.trim()) {
      const provTrim = province.trim();
      const existingLoc = await prisma.location.findFirst({
        where: { province: provTrim },
      });
      if (existingLoc) {
        await prisma.user.update({
          where: { id: user.id },
          data: { locationId: existingLoc.id },
        });
      } else {
        const newLocation = await prisma.location.create({
          data: {
            province: provTrim,
            district: "เมือง",
            region: "ประเทศไทย",
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { locationId: newLocation.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว",
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
        businessName: businessName?.trim() || updatedUser.fullName,
        province: province?.trim() || updatedUser.location?.province || "จันทบุรี",
        activeRole: updatedUser.activeRole,
        trustScore: updatedUser.trustScore,
        rating: Number(updatedUser.ratingAvg),
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}
