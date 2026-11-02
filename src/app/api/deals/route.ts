import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { positiveDecimal, positiveId } from "@/lib/input";

class DealError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
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
          // Atomically claim an OPEN post. Rollback releases the claim if any later write fails.
          const claimed = await tx.marketplacePost.updateMany({ where: { id: postId, status: "OPEN" }, data: { status: "CLOSED" } });
          if (claimed.count !== 1) throw new DealError("ประกาศนี้ไม่เปิดให้ปิดดีลแล้ว", 409);
          const created = await tx.deal.create({ data: {
            postId, initiatorId: user.id, receiverId, agreedPrice,
            agreedPricePerKg, agreedQuantityKg, cutDate, note, status: "ACCEPTED",
          } });
          await tx.chatMessage.create({ data: {
            roomId, senderId: user.id, messageType: "TEXT",
            content: `🎉 ตกลงราคาซื้อขาย (ปิดดีล) สำเร็จ!\n• ราคาตกลง: ${agreedPrice.toLocaleString()} บาท${agreedPricePerKg ? ` (${agreedPricePerKg} บาท/กก.)` : ""}\n• ปริมาณ: ${agreedQuantityKg ? `${agreedQuantityKg.toLocaleString()} กก.` : "ตามตกลง"}\n• สถานะดีล: ยืนยันแล้ว (รหัสดีล #${created.id})`,
          } });
          await tx.chatRoom.update({ where: { id: roomId }, data: { status: "DEAL_CLOSED", lastMessageAt: new Date() } });
          const otherRooms = await tx.chatRoom.findMany({ where: { postId, id: { not: roomId }, status: "ACTIVE" } });
          for (const other of otherRooms) {
            await tx.chatMessage.create({ data: {
              roomId: other.id, senderId: user.id, messageType: "TEXT",
              content: `📢 แจ้งเตือนจากระบบ: ประกาศ "${post.title}" ได้ทำการตกลงซื้อขาย (ปิดดีล) กับคู่ค้ารายอื่นเรียบร้อยแล้ว ขอบคุณที่ให้ความสนใจครับ (คุณยังสามารถพูดคุยเพื่อสอบถามข้อมูลผลผลิตล็อตถัดไปกับผู้ขายได้)`,
            } });
            await tx.chatRoom.update({ where: { id: other.id }, data: { status: "ARCHIVED", lastMessageAt: new Date() } });
          }
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
