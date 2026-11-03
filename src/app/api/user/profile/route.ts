import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const privateHeaders = { "Cache-Control": "private, no-store" };
function profile(user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>) {
  return {
    id: user.id, fullName: user.fullName, avatarUrl: user.avatarUrl,
    email: user.email, phone: user.phone, isEmailVerified: Boolean(user.emailVerifiedAt),
    activeRole: user.activeRole, province: user.location?.province || "",
    businessName: user.roles.find(r => r.roleType === user.activeRole)?.businessName || user.fullName,
    rating: Number(user.ratingAvg), ratingCount: user.ratingCount, trustScore: user.trustScore,
    roles: user.roles.map(r => ({ roleType: r.roleType, businessName: r.businessName || "",
      description: r.description || "", status: r.status, isVerified: r.isVerified })),
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const [locations, requests] = await Promise.all([
      prisma.location.findMany({ select: { province: true }, distinct: ["province"], orderBy: { province: "asc" } }),
      prisma.roleVerificationRequest.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" },
        select: { id: true, requestedRole: true, status: true, adminRemark: true } }),
    ]);
    return NextResponse.json({ user: profile(user), provinces: locations.map(l => l.province), requests }, { headers: privateHeaders });
  } catch {
    return NextResponse.json({ error: "โหลดข้อมูลบัญชีไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) ||
        Object.keys(body).some(k => !["section", "fullName", "province", "roleType", "businessName", "description"].includes(k))) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง ไม่สามารถเปลี่ยนอีเมลหรือเบอร์โทรผ่านฟอร์มนี้" }, { status: 400 });
    }
    if (body.section === "personal") {
      if (typeof body.fullName !== "string" || !body.fullName.trim() || body.fullName.trim().length > 100 ||
          typeof body.province !== "string" || body.province.length > 100 ||
          ["roleType", "businessName", "description"].some(k => k in body)) {
        return NextResponse.json({ error: "กรุณาระบุชื่อไม่เกิน 100 ตัวอักษร และเลือกจังหวัด" }, { status: 400 });
      }
      const province = body.province.trim();
      // Preserve the existing district when the account province has not changed.
      const location = province === (user.location?.province || "") ? user.location :
        await prisma.location.findFirst({ where: { province }, orderBy: { id: "asc" } });
      if (!location && province) return NextResponse.json({ error: "กรุณาเลือกจังหวัดที่มีในระบบ" }, { status: 400 });
      const updated = await prisma.user.update({ where: { id: user.id },
        data: { fullName: body.fullName.trim(), locationId: location?.id ?? null }, include: { roles: true, location: true } });
      return NextResponse.json({ success: true, user: profile(updated) }, { headers: privateHeaders });
    }
    if (body.section === "business") {
      const role = user.roles.find(r => r.roleType === body.roleType && r.status === "ACTIVE");
      if (!role) return NextResponse.json({ error: "แก้ไขได้เฉพาะบทบาทของคุณที่ได้รับอนุมัติ" }, { status: 403 });
      if (typeof body.businessName !== "string" || !body.businessName.trim() || body.businessName.trim().length > 200 ||
          typeof body.description !== "string" || body.description.length > 2000 || "fullName" in body || "province" in body) {
        return NextResponse.json({ error: "ชื่อกิจการต้องมี 1–200 ตัวอักษร และรายละเอียดไม่เกิน 2,000 ตัวอักษร" }, { status: 400 });
      }
      const updated = await prisma.$transaction(async tx => {
        const result = await tx.userRole.updateMany({ where: { id: role.id, userId: user.id, status: "ACTIVE" },
          data: { businessName: body.businessName.trim(), description: body.description.trim() } });
        if (result.count !== 1) return null;
        return tx.user.findUnique({ where: { id: user.id }, include: { roles: true, location: true } });
      });
      if (!updated) return NextResponse.json({ error: "บทบาทเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่" }, { status: 409 });
      return NextResponse.json({ success: true, user: profile(updated) }, { headers: privateHeaders });
    }
    return NextResponse.json({ error: "ส่วนข้อมูลไม่ถูกต้อง" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "บันทึกไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
