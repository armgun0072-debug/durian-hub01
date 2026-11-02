import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createAndSendOtp } from "@/lib/otp";
import { RoleType } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      businessName,
      province,
      primaryRole,
    } = body;

    // Validation
    if (!fullName || !email || !phone || !password || !businessName || !primaryRole) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง" },
        { status: 400 }
      );
    }

    const emailTrimmed = email.trim().toLowerCase();
    const phoneTrimmed = phone.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return NextResponse.json(
        { error: "รูปแบบอีเมลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้วในระบบ กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ" },
        { status: 400 }
      );
    }

    // Check duplicate phone
    const existingPhone = await prisma.user.findUnique({
      where: { phone: phoneTrimmed },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: "เบอร์โทรศัพท์นี้ถูกใช้งานแล้วในระบบ" },
        { status: 400 }
      );
    }

    // Find or create default Location
    const deepSouthProvinces = ["ยะลา", "ปัตตานี", "นราธิวาส"];
    const southProvinces = ["ชุมพร", "สุราษฎร์ธานี", "นครศรีธรรมราช", "ระนอง", "พังงา", "กระบี่", "ภูเก็ต", "ตรัง", "พัทลุง", "สงขลา", "สตูล"];
    const eastProvinces = ["จันทบุรี", "ระยอง", "ตราด", "ชลบุรี", "ฉะเชิงเทรา", "ปราจีนบุรี", "นครนายก", "สระแก้ว"];
    const isanProvinces = ["ชัยภูมิ", "ศรีสะเกษ", "นครราชสีมา", "ขอนแก่น", "อุบลราชธานี", "บุรีรัมย์", "สุรินทร์", "อุดรธานี", "เลย", "หนองคาย", "หนองบัวลำภู", "บึงกาฬ", "สกลนคร", "นครพนม", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "ร้อยเอ็ด", "กาฬสินธุ์", "มหาสารคาม"];
    const northProvinces = ["อุตรดิตถ์", "เชียงใหม่", "เชียงราย", "แพร่", "น่าน", "ลำปาง", "ลำพูน", "กำแพงเพชร", "พิจิตร", "ตาก", "สุโขทัย", "พิษณุโลก", "เพชรบูรณ์", "แม่ฮ่องสอน", "นครสวรรค์", "พะเยา", "อุทัยธานี"];

    let targetRegion = body.region ? String(body.region).trim() : "";
    const provTrim = province ? province.trim() : "";

    if (!targetRegion && provTrim) {
      if (deepSouthProvinces.some((p) => provTrim.includes(p))) {
        targetRegion = "3 จังหวัดชายแดนใต้";
      } else if (southProvinces.some((p) => provTrim.includes(p))) {
        targetRegion = "ภาคใต้";
      } else if (eastProvinces.some((p) => provTrim.includes(p))) {
        targetRegion = "ภาคตะวันออก";
      } else if (isanProvinces.some((p) => provTrim.includes(p))) {
        targetRegion = "ภาคอีสาน";
      } else if (northProvinces.some((p) => provTrim.includes(p))) {
        targetRegion = "ภาคเหนือ";
      } else {
        targetRegion = "ภาคกลาง";
      }
    }
    if (!targetRegion) targetRegion = "ภาคตะวันออก";

    let locationId: number | undefined = undefined;
    if (provTrim) {
      // Find matching regionalSeasonId
      const season = await prisma.regionalSeason.findFirst({
        where: {
          OR: [
            { regionName: targetRegion },
            { regionName: { contains: targetRegion } },
            targetRegion === "3 จังหวัดชายแดนใต้" ? { regionCode: "DEEP_SOUTH" } : {},
            targetRegion === "ภาคใต้" ? { regionCode: "SOUTH" } : {},
            targetRegion === "ภาคตะวันออก" ? { regionCode: "EAST" } : {},
            targetRegion === "ภาคเหนือ" ? { regionCode: "NORTH" } : {},
            targetRegion === "ภาคอีสาน" ? { regionCode: "ISAN" } : {},
            targetRegion === "ภาคกลาง" ? { regionCode: "CENTRAL" } : {},
          ],
        },
      });

      const loc = await prisma.location.findFirst({
        where: { province: provTrim },
      });
      if (loc) {
        locationId = loc.id;
      } else {
        const createdLoc = await prisma.location.create({
          data: {
            province: provTrim,
            district: "เมือง",
            region: targetRegion,
            regionalSeasonId: season?.id,
          },
        });
        locationId = createdLoc.id;
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailTrimmed,
          phone: phoneTrimmed,
          passwordHash,
          fullName: fullName.trim(),
          activeRole: primaryRole as RoleType,
          locationId,
          emailVerifiedAt: null, // ยังไม่ได้ยืนยัน ต้องผ่าน OTP ก่อน
          trustScore: 100,
          ratingAvg: 5.0,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleType: primaryRole as RoleType,
          isPrimaryRole: true,
          businessName: businessName.trim(),
          status: "ACTIVE",
          isVerified: false,
        },
      });

      return user;
    });

    // Send OTP via Mailpit
    await createAndSendOtp({
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      purpose: "VERIFY_EMAIL",
    });

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      message: `ระบบได้ส่งรหัส OTP ไปยังอีเมล ${newUser.email} แล้ว (เปิดดูได้ที่ Mailpit http://localhost:8025)`,
    });
  } catch (error: unknown) {
    console.error("Register Error:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการสมัครสมาชิก";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
