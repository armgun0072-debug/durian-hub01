import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { positiveDecimal, positiveId } from "@/lib/input";

class DealError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดูประวัติสัญญาดีล" }, { status: 401 });
    }

    const deals = await prisma.deal.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { receiverId: user.id }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            postType: true,
            variety: { select: { nameTh: true, nameEn: true } },
            grade: { select: { nameTh: true } },
            location: { select: { province: true, region: true } },
          },
        },
        initiator: { select: { id: true, fullName: true } },
        receiver: { select: { id: true, fullName: true } },
        reviews: {
          where: { reviewerId: user.id },
          select: { id: true, rating: true },
        },
      },
    });

    let totalVolumeKg = 0;
    let totalValueThb = 0;

    const items = deals.map((d) => {
      const agreedPrice = Number(d.agreedPrice);
      const agreedPricePerKg = d.agreedPricePerKg ? Number(d.agreedPricePerKg) : null;
      const agreedQuantityKg = d.agreedQuantityKg ? Number(d.agreedQuantityKg) : null;

      if (["ACCEPTED", "COMPLETED"].includes(d.status) && agreedQuantityKg) {
        totalVolumeKg += agreedQuantityKg;
      }
      if (["ACCEPTED", "COMPLETED"].includes(d.status)) totalValueThb +=
        agreedPricePerKg && agreedQuantityKg
          ? agreedPricePerKg * agreedQuantityKg
          : agreedPrice;

      const isInitiator = d.initiatorId === user.id;
      const partner = isInitiator ? d.receiver : d.initiator;

      return {
        id: d.id,
        postId: d.postId,
        postTitle: d.post.title,
        postType: d.post.postType,
        variety: d.post.variety?.nameTh || "หมอนทอง",
        grade: d.post.grade?.nameTh || "ทั่วไป",
        province: d.post.location?.province || "",
        region: d.post.location?.region || "",
        partnerId: partner.id,
        partnerName: partner.fullName,
        roleInDeal: isInitiator ? "INITIATOR" : "RECEIVER",
        agreedPrice,
        agreedPricePerKg,
        agreedQuantityKg,
        cutDate: d.cutDate ? d.cutDate.toISOString().slice(0, 10) : null,
        note: d.note,
        status: d.status,
        myConfirmed: Boolean(isInitiator ? d.initiatorConfirmedAt : d.receiverConfirmedAt),
        partnerConfirmed: Boolean(isInitiator ? d.receiverConfirmedAt : d.initiatorConfirmedAt),
        hasMyReview: d.reviews.length > 0,
        myRating: d.reviews[0]?.rating ?? null,
        createdAt: d.createdAt.toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        deals: items,
        summary: {
          totalDeals: items.length,
          totalVolumeKg,
          totalValueThb,
        },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("GET Deals Error:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดประวัติสัญญาดีลได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DealError("กรุณาเข้าสู่ระบบก่อนตกลงซื้อขาย", 401);
    let body;
    try { body = await request.json(); }
    catch { throw new DealError("ข้อมูล JSON ไม่ถูกต้อง", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new DealError("ข้อมูลดีลไม่ถูกต้อง", 400);
    const roomId = positiveId(body.roomId);
    const postId = positiveId(body.postId);
    const receiverId = positiveId(body.receiverId);
    const agreedPrice = positiveDecimal(body.agreedPrice);
    const agreedPricePerKg = body.agreedPricePerKg == null ? null : positiveDecimal(body.agreedPricePerKg);
    const agreedQuantityKg = body.agreedQuantityKg == null ? null : positiveDecimal(body.agreedQuantityKg, 9999999999.99);
    if (!roomId || !postId || !receiverId || !agreedPrice ||
      (body.agreedPricePerKg != null && !agreedPricePerKg) ||
      (body.agreedQuantityKg != null && !agreedQuantityKg)) {
      throw new DealError("กรุณาระบุห้อง ประกาศ คู่ค้า และราคาหรือปริมาณที่เป็นบวก (ทศนิยมไม่เกิน 2 ตำแหน่ง)", 400);
    }
    if (receiverId === user.id) throw new DealError("ไม่สามารถปิดดีลกับตัวเองได้", 400);
    if (body.note != null && (typeof body.note !== "string" || body.note.length > 5000)) throw new DealError("หมายเหตุต้องเป็นข้อความไม่เกิน 5,000 ตัวอักษร", 400);
    const note: string | null = body.note?.trim() || null;
    let cutDate: Date | null = null;
    if (body.cutDate != null) {
      if (typeof body.cutDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(body.cutDate)) throw new DealError("วันตัดไม่ถูกต้อง", 400);
      cutDate = new Date(`${body.cutDate}T00:00:00.000Z`);
      if (!Number.isFinite(cutDate.getTime()) || cutDate.toISOString().slice(0, 10) !== body.cutDate || cutDate.getUTCFullYear() < 1000) throw new DealError("วันตัดไม่ถูกต้อง", 400);
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const deal = await prisma.$transaction(async (tx) => {
          const room = await tx.chatRoom.findUnique({ where: { id: roomId } });
          if (!room) throw new DealError("ไม่พบห้องแชท", 404);
          const partnerId = room.initiatorId === user.id ? room.ownerId : room.ownerId === user.id ? room.initiatorId : null;
          if (partnerId !== receiverId || room.postId !== postId) throw new DealError("คุณไม่มีสิทธิ์ปิดดีลกับคู่ค้าหรือประกาศในห้องนี้", 403);
          if (room.status !== "ACTIVE") throw new DealError("ห้องนี้ปิดดีลหรือปิดการขายแล้ว", 409);
          const post = await tx.marketplacePost.findUnique({ where: { id: postId } });
          if (!post) throw new DealError("ไม่พบประกาศสินค้านี้", 404);
          if (post.userId !== room.ownerId) throw new DealError("เจ้าของประกาศไม่ตรงกับห้องแชท", 403);
          if (post.status !== "OPEN") throw new DealError("ประกาศนี้ไม่เปิดรับข้อเสนอแล้ว", 409);
          const pending = await tx.deal.findFirst({ where: { roomId, status: "PENDING" } });
          if (pending) throw new DealError("มีข้อเสนอรอคำตอบในห้องนี้แล้ว", 409);
          const created = await tx.deal.create({ data: {
            roomId, postId, initiatorId: user.id, receiverId, agreedPrice,
            agreedPricePerKg, agreedQuantityKg, cutDate, note, status: "PENDING",
          } });
          await tx.chatMessage.create({ data: {
            roomId, senderId: user.id, messageType: "TEXT",
            content: `ข้อเสนอ #${created.id}: ${agreedPrice.toLocaleString()} บาท · เปิดเมนูดีลเพื่อดูเงื่อนไขและตอบข้อเสนอ`,
          } });
          await tx.chatRoom.update({ where: { id: roomId }, data: { lastMessageAt: created.createdAt } });
          return created;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return NextResponse.json({ success: true, deal });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
          if (attempt < 2) continue;
          throw new DealError("มีการปิดดีลพร้อมกัน กรุณาลองอีกครั้ง", 409);
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof DealError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST Deal Error:", error);
    return NextResponse.json({ error: "ไม่สามารถทำรายการซื้อขายได้" }, { status: 500 });
  }
}
