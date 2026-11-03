import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { getCurrentUser, hashPassword, verifyPassword, clearSessionCookie, clearAdminSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Per-process throttle. Persistent shared throttling belongs in the deployment gateway.
const attempts = new Map<number, { count: number; until: number }>();
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const body = await request.json().catch(() => null);
    if (!body || typeof body.currentPassword !== "string" || !body.currentPassword || body.currentPassword.length > 1024 ||
        typeof body.newPassword !== "string" || body.newPassword.length < 8 || Buffer.byteLength(body.newPassword, "utf8") > 72) {
      return NextResponse.json({ error: "ระบุรหัสผ่านเดิม และรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร ไม่เกิน 72 ไบต์" }, { status: 400 });
    }
    const now = Date.now();
    for (const [id, value] of attempts) if (value.until <= now) attempts.delete(id);
    const previous = attempts.get(user.id) || { count: 0, until: now + 15 * 60 * 1000 };
    if (previous.count >= 5) return NextResponse.json({ error: "ลองหลายครั้งเกินไป กรุณารอแล้วลองใหม่" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((previous.until - now) / 1000)) } });
    attempts.set(user.id, { ...previous, count: previous.count + 1 });
    if (!await verifyPassword(body.currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
    }
    if (await verifyPassword(body.newPassword, user.passwordHash)) {
      return NextResponse.json({ error: "กรุณาใช้รหัสผ่านใหม่ที่ต่างจากรหัสเดิม" }, { status: 400 });
    }
    const passwordHash = await hashPassword(body.newPassword);
    const changed = await prisma.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash, status: "ACTIVE" }, data: { passwordHash } });
    if (changed.count !== 1) return NextResponse.json({ error: "ข้อมูลบัญชีเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่" }, { status: 409 });
    attempts.delete(user.id);
    await clearSessionCookie();
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
