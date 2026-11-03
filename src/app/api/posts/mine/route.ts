import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PostStatus, PostType } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const postType = params.get("postType");
    const page = Number(params.get("page") || "1");
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        (status && !Object.values(PostStatus).includes(status as PostStatus)) ||
        (postType && !Object.values(PostType).includes(postType as PostType))) {
      return NextResponse.json({ error: "ตัวกรองหรือหน้าไม่ถูกต้อง" }, { status: 400 });
    }
    const where = { userId: user.id, ...(status ? { status: status as PostStatus } : {}),
      ...(postType ? { postType: postType as PostType } : {}) };
    const pageSize = 20;
    const [posts, total] = await prisma.$transaction([
      prisma.marketplacePost.findMany({
        where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize, take: pageSize,
        include: { variety: true, grade: true, location: true },
      }),
      prisma.marketplacePost.count({ where }),
    ]);
    return NextResponse.json({
      success: true, total, page, hasMore: page * pageSize < total,
      posts: posts.map(p => ({
        id: p.id, userId: p.userId, authorName: user.fullName,
        businessName: user.roles?.find(r => r.roleType === (p.postType === "BUY" ? "BUYER" : p.postType === "CUT_SERVICE" ? "CUTTER" : "SELLER"))?.businessName || user.fullName,
        authorRole: p.postType === "BUY" ? "BUYER" : p.postType === "CUT_SERVICE" ? "CUTTER" : "SELLER",
        isKycVerified: user.isKycVerified, rating: Number(user.ratingAvg),
        reviewCount: user.ratingCount, trustScore: user.trustScore,
        postType: p.postType, title: p.title, content: p.content,
        variety: p.variety?.nameTh || "ไม่ระบุ", grade: p.grade?.nameTh || "ไม่ระบุ",
        province: p.location?.province || "", district: p.location?.district || "",
        regionTag: p.location?.region || "", itemDetailSummary: "",
        pricePerKg: Number(p.pricePerKg ?? p.price), price: Number(p.price),
        priceUnit: p.priceUnit,
        priceUnitLabel: p.priceUnit === "PER_KG" ? "บาท/กก." : p.priceUnit === "PER_TON" ? "บาท/ตัน" : "บาท/เหมา",
        quantityKg: Number(p.quantityKg ?? 0),
        dryMatterPct: p.dryMatterPct == null ? undefined : Number(p.dryMatterPct),
        availableDate: p.availableDate.toISOString().split("T")[0],
        isPriceOutlier: p.isPriceOutlier, reportCount: p.reportCount,
        contactNote: "", status: p.status, createdAt: p.createdAt.toISOString(),
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET My Posts Error:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดประวัติประกาศได้" }, { status: 500 });
  }
}
