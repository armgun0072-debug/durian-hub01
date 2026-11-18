import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { marketPricePerKg } from "@/lib/market-stats";
import { MARKET_GRADES, VARIETY_STRIP_ITEMS } from "@/data/mockData";
import { PostType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postType = searchParams.get("postType") as PostType | null;
    const includeAll = searchParams.get("includeAll") === "true";
    const days = parseInt(searchParams.get("days") || "7", 10);

    const where: Record<string, unknown> = {
      status: "OPEN",
    };

    if (postType) {
      where.postType = postType;
    }

    // Default: Show fresh active posts within 7 days to keep marketplace clean & relevant
    if (!includeAll && days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      where.createdAt = {
        gte: cutoffDate,
      };
    }

    const posts = await prisma.marketplacePost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            activeRole: true,
            isKycVerified: true,
            trustScore: true,
            ratingAvg: true,
            ratingCount: true,
            roles: {
              where: { isPrimaryRole: true },
              select: { businessName: true },
            },
          },
        },
        variety: true,
        grade: true,
        location: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    // Map to frontend friendly format
    const formattedPosts = posts.map((p) => {
      const primaryRole = p.user.roles[0];
      return {
        id: p.id,
        userId: p.userId,
        authorName: p.user.fullName,
        businessName: primaryRole?.businessName || p.user.fullName,
        authorRole: p.user.activeRole,
        isKycVerified: p.user.isKycVerified,
        rating: Number(p.user.ratingAvg),
        reviewCount: p.user.ratingCount,
        title: p.title,
        postType: p.postType,
        variety: p.variety?.nameTh || "",
        grade: p.grade?.nameTh || "",
        gradeCode: p.grade?.gradeCode ?? null,
        marketPricePerKg: p.isPriceOutlier ? null : marketPricePerKg(p.priceUnit, p.price, p.quantityKg),
        province: p.location?.province || "",
        region: p.location?.region || "",
        regionTag: p.location?.region || "",
        price: Number(p.price),
        pricePerKg: p.pricePerKg ? Number(p.pricePerKg) : Number(p.price),
        priceUnit: p.priceUnit,
        quantityKg: p.quantityKg ? Number(p.quantityKg) : 5000,
        dryMatterPct: p.dryMatterPct ? Number(p.dryMatterPct) : 32.0,
        availableDate: p.availableDate ? p.availableDate.toISOString().split("T")[0] : "พร้อมตัดทันที",
        content: p.content,
        imageUrl: p.images[0]?.imageUrl || "",
        status: p.status,
        createdAt: p.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ success: true, posts: formattedPosts });
  } catch (error) {
    console.error("GET Posts Error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลโพสต์ได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลงประกาศ" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      content,
      postType,
      varietyName,
      gradeCode,
      province,
      region,
      price,
      pricePerKg,
      priceUnit = "PER_KG",
      quantityKg,
      dryMatterPct,
      imageUrl,
    } = body;

    if (!title || !Number.isFinite(Number(price)) || Number(price) <= 0) {
      return NextResponse.json({ error: "กรุณาระบุหัวข้อและราคา" }, { status: 400 });
    }

    // Role-to-PostType Enforcement: บังคับให้ 1 บทบาทลงประกาศได้เฉพาะหมวดของบทบาทตนเองเท่านั้น
    const roleAllowedPostTypeMap: Record<string, string> = {
      SELLER: "SELL",
      BUYER: "BUY",
      CUTTER: "CUT_SERVICE",
    };

    const userRoleTypes = user.roles ? user.roles.map((r) => r.roleType) : [];
    const isAllowedRole =
      user.activeRole === "ADMIN" ||
      userRoleTypes.includes("ADMIN") ||
      roleAllowedPostTypeMap[user.activeRole] === postType ||
      user.roles?.some((r) => roleAllowedPostTypeMap[r.roleType] === postType && r.status === "ACTIVE");

    if (!isAllowedRole) {
      return NextResponse.json(
        {
          error: `บทบาทปัจจุบันของคุณไม่สามารถลงประกาศหมวดนี้ได้ (ผู้ขายลงได้เฉพาะโพสต์ขาย, ล้งลงได้เฉพาะโพสต์รับซื้อ, ทีมตัดลงได้เฉพาะรับตัดทุเรียน)`,
        },
        { status: 403 }
      );
    }

    // Find variety
    let varietyId: number | undefined;
    if (varietyName) {
      const v = await prisma.durianVariety.findFirst({
        where: { OR: [{ nameTh: varietyName }, { nameEn: varietyName }] },
      });
      if (v) varietyId = v.id;
      else {
        const choice = VARIETY_STRIP_ITEMS.find((item) => item.id === varietyName && item.id !== "ALL");
        if (!choice) return NextResponse.json({ error: "ไม่พบสายพันธุ์ที่เลือก" }, { status: 400 });
        const variety = await prisma.durianVariety.upsert({
          where: { nameTh: choice.id }, update: {}, create: { nameTh: choice.id, nameEn: choice.nameEn },
        });
        varietyId = variety.id;
      }
    }

    // Find grade
    let gradeId: number | undefined;
    if (gradeCode) {
      const aliases: Record<string, string> = { "AB ส่งออก": "AB_EXPORT", "C รอง": "C_GRADE", "คัดพิเศษ GI": "PREMIUM_GI" };
      const code = aliases[gradeCode] ?? gradeCode;
      const g = await prisma.durianGrade.findFirst({
        where: { OR: [{ gradeCode: code }, { nameTh: gradeCode }] },
      });
      if (g) gradeId = g.id;
      else {
        const name = MARKET_GRADES.find((entry) => entry.gradeCode === code)?.name
          ?? (code === "PREMIUM_GI" ? "คัดพิเศษ GI" : null);
        if (!name) return NextResponse.json({ error: "ไม่พบเกรดที่เลือก" }, { status: 400 });
        const grade = await prisma.durianGrade.upsert({
          where: { gradeCode: code }, update: {}, create: { gradeCode: code, nameTh: name },
        });
        gradeId = grade.id;
      }
    }

    // Resolve intended region and province
    const deepSouthProvinces = ["ยะลา", "ปัตตานี", "นราธิวาส"];
    const southProvinces = ["ชุมพร", "สุราษฎร์ธานี", "นครศรีธรรมราช", "ระนอง", "พังงา", "กระบี่", "ภูเก็ต", "ตรัง", "พัทลุง", "สงขลา", "สตูล"];
    const eastProvinces = ["จันทบุรี", "ระยอง", "ตราด", "ชลบุรี", "ฉะเชิงเทรา", "ปราจีนบุรี", "นครนายก", "สระแก้ว"];
    const isanProvinces = ["ชัยภูมิ", "ศรีสะเกษ", "นครราชสีมา", "ขอนแก่น", "อุบลราชธานี", "บุรีรัมย์", "สุรินทร์", "อุดรธานี", "เลย", "หนองคาย", "หนองบัวลำภู", "บึงกาฬ", "สกลนคร", "นครพนม", "มุกดาหาร", "ยโสธร", "อำนาจเจริญ", "ร้อยเอ็ด", "กาฬสินธุ์", "มหาสารคาม"];
    const northProvinces = ["อุตรดิตถ์", "เชียงใหม่", "เชียงราย", "แพร่", "น่าน", "ลำปาง", "ลำพูน", "กำแพงเพชร", "พิจิตร", "ตาก", "สุโขทัย", "พิษณุโลก", "เพชรบูรณ์", "แม่ฮ่องสอน", "นครสวรรค์", "พะเยา", "อุทัยธานี"];

    let targetRegion = region?.trim();
    const provTrim = province?.trim() || "";
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


    // Find or create location with province and region
    let locationId = user.locationId;
    if (provTrim) {
      const season = await prisma.regionalSeason.findFirst({
        where: { regionName: targetRegion },
      });

      let loc = await prisma.location.findFirst({
        where: {
          province: { contains: provTrim },
          region: targetRegion,
        },
      });

      if (!loc) {
        const existingLoc = await prisma.location.findFirst({
          where: { province: { contains: provTrim } },
        });

        if (existingLoc && (!existingLoc.region || existingLoc.region === "ภาคตะวันออก" || (deepSouthProvinces.some((p) => provTrim.includes(p)) && existingLoc.region === "ภาคใต้"))) {
          loc = await prisma.location.update({
            where: { id: existingLoc.id },
            data: {
              region: targetRegion,
              regionalSeasonId: season?.id,
            },
          });
        } else {
          loc = await prisma.location.create({
            data: {
              province: provTrim,
              region: targetRegion,
              district: "เมือง",
              regionalSeasonId: season?.id,
            },
          });
        }
      }
      if (loc) locationId = loc.id;
    }

    if (!locationId) return NextResponse.json({ error: "กรุณาเลือกพื้นที่ของประกาศ" }, { status: 400 });

    // Resolve post type properly
    let resolvedPostType: PostType;
    if (postType && ["SELL", "BUY", "CUT_SERVICE"].includes(postType)) {
      resolvedPostType = postType as PostType;
    } else if (user.activeRole === "BUYER") {
      resolvedPostType = "BUY";
    } else if (user.activeRole === "CUTTER") {
      resolvedPostType = "CUT_SERVICE";
    } else {
      resolvedPostType = "SELL";
    }

    const safeImageUrl =
      typeof imageUrl === "string" && /^\/uploads\/posts\/[a-zA-Z0-9._-]+$/.test(imageUrl.trim())
        ? imageUrl.trim()
        : null;

    const post = await prisma.marketplacePost.create({
      data: {
        userId: user.id,
        postType: resolvedPostType,
        varietyId,
        gradeId,
        locationId,
        title: title.trim(),
        content: content ? content.trim() : "",
        price: Number(price),
        pricePerKg: pricePerKg ? Number(pricePerKg) : Number(price),
        priceUnit,
        quantityKg: quantityKg ? Number(quantityKg) : null,
        dryMatterPct: dryMatterPct ? Number(dryMatterPct) : null,
        availableDate: new Date(),
        status: "OPEN",
        ...(safeImageUrl
          ? {
              images: {
                create: [{ imageUrl: safeImageUrl, sortOrder: 0 }],
              },
            }
          : {}),
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("POST Post Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลงประกาศ" }, { status: 500 });
  }
}
