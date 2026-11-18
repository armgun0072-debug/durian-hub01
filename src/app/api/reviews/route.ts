import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const verifiedDeal = { status: "COMPLETED" as const, acceptedAt: { not: null }, initiatorConfirmedAt: { not: null }, receiverConfirmedAt: { not: null } };

class ReviewError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
function positiveId(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}
const duplicateMessage = "คุณได้รีวิวดีลนี้แล้ว (1 ดีล รีวิวได้ 1 ครั้ง)";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = positiveId(searchParams.get("userId"));
    if (!userId) {
      return NextResponse.json({ error: "กรุณาระบุรหัสสมาชิกที่ต้องการดูรีวิว" }, { status: 400 });
    }

    const [targetUser, reviews, dealsCount, totals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          isKycVerified: true,
          trustScore: true,
          ratingAvg: true,
          ratingCount: true,
          createdAt: true,
          location: { select: { province: true, region: true } },
          roles: {
            where: { status: "ACTIVE" },
            select: { roleType: true, businessName: true, isVerified: true },
          },
        },
      }),
      prisma.userReview.findMany({
        where: { revieweeId: userId, deal: verifiedDeal },
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          reviewer: { select: { id: true, fullName: true } },
          deal: {
            select: {
              id: true,
              agreedPrice: true,
              agreedQuantityKg: true,
              post: { select: { id: true, title: true, postType: true } },
            },
          },
        },
      }),
      prisma.deal.count({
        where: {
          status: { in: ["ACCEPTED", "COMPLETED"] },
          OR: [{ initiatorId: userId }, { receiverId: userId }],
        },
      }),
      prisma.userReview.aggregate({ where: { revieweeId: userId, deal: verifiedDeal }, _avg: { rating: true }, _count: { _all: true } }),
    ]);

    if (!targetUser) {
      return NextResponse.json({ error: "ไม่พบข้อมูลสมาชิกนี้" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        profile: {
          id: targetUser.id,
          fullName: targetUser.fullName,
          avatarUrl: targetUser.avatarUrl,
          isKycVerified: targetUser.isKycVerified,
          trustScore: targetUser.trustScore,
          ratingAvg: Number(totals._avg.rating ?? 0),
          ratingCount: totals._count._all,
          province: targetUser.location?.province || "",
          region: targetUser.location?.region || "",
          dealsCount,
          joinedAt: targetUser.createdAt.toISOString(),
          roles: targetUser.roles,
        },
        reviews: reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment || "",
          reviewerName: r.reviewer.fullName,
          postTitle: r.deal.post.title,
          postType: r.deal.post.postType,
          createdAt: r.createdAt.toISOString(),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET Reviews Error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลรีวิวคู่ค้าได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนรีวิว" }, { status: 401 });
    let body;
    try { body = await request.json(); }
    catch { throw new ReviewError("ข้อมูล JSON ไม่ถูกต้อง", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new ReviewError("ข้อมูลรีวิวไม่ถูกต้อง", 400);
    const dealId = positiveId(body.dealId);
    const roomId = positiveId(body.roomId);
    const postId = positiveId(body.postId);
    const revieweeId = positiveId(body.revieweeId);
    const rating = typeof body.rating === "number" || typeof body.rating === "string" ? Number(body.rating) : NaN;
    if (!dealId || !roomId || !postId || !revieweeId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ReviewError("กรุณาระบุห้อง ประกาศ คู่ค้า และคะแนนเต็มตั้งแต่ 1 ถึง 5 ดาวให้ถูกต้อง", 400);
    }
    if (revieweeId === user.id) throw new ReviewError("ไม่สามารถรีวิวตัวเองได้", 400);
    if (body.comment != null && typeof body.comment !== "string") throw new ReviewError("ความคิดเห็นต้องเป็นข้อความ", 400);
    const comment: string | null = body.comment?.trim() || null;
    if (comment && comment.length > 5000) throw new ReviewError("ความคิดเห็นต้องไม่เกิน 5,000 ตัวอักษร", 400);

    // Retry serialization conflicts to keep totals accurate for simultaneous reviews.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          const room = await tx.chatRoom.findUnique({ where: { id: roomId } });
          if (!room) throw new ReviewError("ไม่พบห้องแชท", 404);
          const partnerId = room.initiatorId === user.id ? room.ownerId : room.ownerId === user.id ? room.initiatorId : null;
          if (partnerId === null || partnerId !== revieweeId || room.postId !== postId) {
            throw new ReviewError("คุณไม่มีสิทธิ์รีวิวคู่ค้าหรือประกาศในห้องนี้", 403);
          }
          if (room.status !== "DEAL_CLOSED") throw new ReviewError("รีวิวได้เฉพาะห้องที่ปิดดีลสำเร็จแล้ว", 400);
          // Do not manufacture historical deals from asking prices during a review.
          const deal = await tx.deal.findFirst({
            where: { id: dealId, roomId, postId, ...verifiedDeal, OR: [
              { initiatorId: user.id, receiverId: revieweeId },
              { initiatorId: revieweeId, receiverId: user.id },
            ] },
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          });
          if (!deal) throw new ReviewError("ไม่พบดีลที่ยืนยันแล้วของคู่ค้าในห้องนี้ กรุณาติดต่อผู้ดูแลระบบหากเป็นข้อมูลเก่า", 400);
          const existing = await tx.userReview.findUnique({ where: { dealId_reviewerId: { dealId: deal.id, reviewerId: user.id } } });
          if (existing) throw new ReviewError(duplicateMessage, 409);
          const review = await tx.userReview.create({ data: { dealId: deal.id, reviewerId: user.id, revieweeId, rating, comment } });
          const totals = await tx.userReview.aggregate({ where: { revieweeId, deal: verifiedDeal }, _avg: { rating: true }, _count: { _all: true } });
          const newAvg = Number((totals._avg.rating ?? 0).toFixed(2));
          const totalCount = totals._count._all;
          await tx.user.update({ where: { id: revieweeId }, data: { ratingAvg: newAvg, ratingCount: totalCount } });
          await tx.chatMessage.create({ data: {
            roomId, senderId: user.id, messageType: "TEXT",
            content: `${"⭐".repeat(rating)} ให้คะแนนรีวิวคู่ค้า ${rating}/5 ดาว!${comment ? `\n💬 ความคิดเห็น: "${comment}"` : ""}\n(คะแนนความน่าเชื่อถือเฉลี่ยของคู่ค้า: ★ ${newAvg.toFixed(1)} จาก ${totalCount} รีวิว)`,
          } });
          await tx.chatRoom.update({ where: { id: roomId }, data: { lastMessageAt: new Date() } });
          return { review, newRatingAvg: newAvg, newRatingCount: totalCount };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
        return NextResponse.json({ success: true, ...result, message: `บันทึกคะแนนรีวิว ${rating} ดาว เรียบร้อยแล้ว!` });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") throw new ReviewError(duplicateMessage, 409);
          if (error.code === "P2034") {
            if (attempt < 2) continue;
            throw new ReviewError("มีการอัปเดตรีวิวพร้อมกัน กรุณาลองอีกครั้ง", 409);
          }
        }
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ReviewError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("POST Review Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกคะแนนรีวิว" }, { status: 500 });
  }
}
