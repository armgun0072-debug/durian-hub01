import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const preset = formData.get("preset") as string | null;

    let finalAvatarUrl = "";

    if (preset) {
      // ใช้ Avatar สำเร็จรูปที่ผู้ใช้เลือก
      finalAvatarUrl = preset;
    } else if (file) {
      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: "ขนาดไฟล์ต้องไม่เกิน 5MB" }, { status: 400 });
      }

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF)" }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `avatar_${user.id}_${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(filePath, buffer);

      finalAvatarUrl = `/uploads/avatars/${filename}`;
    } else {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพหรือเลือก Avatar" }, { status: 400 });
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
