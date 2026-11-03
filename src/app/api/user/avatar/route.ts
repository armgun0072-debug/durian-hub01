import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { cwd } from "node:process";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    let finalAvatarUrl = "";

    if (file && typeof file !== "string" && !formData.has("preset")) {
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (!file.size || file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "ขนาดไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });
      }

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const detectedType = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ? "image/jpeg" :
        buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "image/png" :
        buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" ? "image/webp" : null;
      if (detectedType !== file.type) return NextResponse.json({ error: "เนื้อหาไฟล์ไม่ตรงกับชนิดรูปภาพ" }, { status: 400 });
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const filename = `avatar_${user.id}_${randomUUID()}.${ext}`;
      const uploadDir = path.join(cwd(), "public", "uploads", "avatars");

      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);

      finalAvatarUrl = `/uploads/avatars/${filename}`;
    } else {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 });
    }

    // บันทึกลงฐานข้อมูล MySQL
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: finalAvatarUrl },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: updatedUser.avatarUrl,
      message: "อัปเดตรูปโปรไฟล์สำเร็จแล้ว",
    });
  } catch (error) {
    console.error("Avatar Upload Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    // Clear the reference only; never delete a caller-supplied filesystem path.
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
    return NextResponse.json({ success: true, avatarUrl: null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "ลบรูปไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
