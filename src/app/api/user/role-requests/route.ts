import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { RoleType, VerificationDocType } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const requests = await prisma.roleVerificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Fetch Role Requests Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const formData = await request.formData();
    const requestedRole = formData.get("requestedRole") as RoleType;
    const businessName = (formData.get("businessName") as string)?.trim();
    const licenseNumber = (formData.get("licenseNumber") as string)?.trim() || null;
    const documentType = formData.get("documentType") as VerificationDocType;
    const note = (formData.get("note") as string)?.trim() || null;
    const file = formData.get("file") as File | null;

    if (!requestedRole || !businessName || !documentType) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วน (บทบาท, ชื่อแปลง/กิจการ, ประเภทเอกสาร)" },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: "กรุณาแนบไฟล์รูปภาพเอกสารหรือหลักฐานประกอบ" },
        { status: 400 }
      );
    }

    // 1. Check if user already holds this role actively
    const alreadyHolds = user.roles.some(
      (r) => r.roleType === requestedRole && r.status === "ACTIVE"
    );
    if (alreadyHolds) {
      return NextResponse.json(
        { error: `คุณมีบทบาท ${requestedRole} ที่เปิดใช้งานอยู่แล้ว` },
        { status: 400 }
      );
    }

    // 2. Check if user has a PENDING request for this role
    const existingPending = await prisma.roleVerificationRequest.findFirst({
      where: {
        userId: user.id,
        requestedRole,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: `คุณได้ยื่นคำขอเพิ่มบทบาท ${requestedRole} ไว้แล้ว กำลังรอแอดมินตรวจสอบ` },
        { status: 400 }
      );
    }

    // 3. File validation (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "ขนาดไฟล์ต้องไม่เกิน 10MB" }, { status: 400 });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP) หรือไฟล์ PDF เท่านั้น" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "application/pdf" ? "pdf" : "jpg");
    const filename = `doc_${user.id}_${requestedRole}_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "role-docs");

    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const documentUrl = `/uploads/role-docs/${filename}`;

    // 4. Save to Database
    const newRequest = await prisma.roleVerificationRequest.create({
      data: {
        userId: user.id,
        requestedRole,
        businessName,
        licenseNumber,
        documentType,
        documentUrl,
        note,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "ยื่นคำขอเพิ่มบทบาทสำเร็จแล้ว! แอดมินจะตรวจสอบเอกสารและอนุมัติให้โดยเร็ว",
      request: newRequest,
    });
  } catch (error) {
    console.error("Submit Role Request Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยื่นคำขอเพิ่มบทบาท" },
      { status: 500 }
    );
  }
}

