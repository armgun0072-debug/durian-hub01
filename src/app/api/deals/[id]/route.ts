import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { positiveId } from "@/lib/input";

class DealError extends Error {
  constructor(message: string, readonly status = 409) { super(message); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new DealError("กรุณาเข้าสู่ระบบ", 401);
    const id = positiveId((await params).id);
    const action = (await request.json().catch(() => null))?.status;
    if (!id || !["ACCEPTED", "CANCELLED", "COMPLETED"].includes(action))
      throw new DealError("รหัสหรือคำสั่งดีลไม่ถูกต้อง", 400);

    const deal = await prisma.$transaction(async tx => {
      const current = await tx.deal.findUnique({ where: { id } });
      if (!current) throw new DealError("ไม่พบดีล", 404);
      const initiator = current.initiatorId === user.id;
      if (!initiator && current.receiverId !== user.id) throw new DealError("คุณไม่ได้เป็นคู่ค้าของดีลนี้", 403);
      const now = new Date();

      if (action === "COMPLETED") {
        if (current.status === "COMPLETED") return current;
        if (current.status !== "ACCEPTED") throw new DealError("ดีลยังไม่ได้รับการยอมรับ");
        const field = initiator ? "initiatorConfirmedAt" : "receiverConfirmedAt";
        if (current[field]) return current;
        const other = initiator ? current.receiverConfirmedAt : current.initiatorConfirmedAt;
        return tx.deal.update({ where: { id }, data: { [field]: now, status: other ? "COMPLETED" : "ACCEPTED" } });
      }

      if (action === "ACCEPTED" && initiator) throw new DealError("เฉพาะผู้รับข้อเสนอเท่านั้นที่ยอมรับได้", 403);
      if (current.status === action) return current;
      if (current.status !== "PENDING") throw new DealError("ข้อเสนอนี้ปิดแล้ว");
      if (action === "CANCELLED") return tx.deal.update({ where: { id }, data: { status: "CANCELLED" } });

      const room = current.roomId === null ? null : await tx.chatRoom.findUnique({ where: { id: current.roomId } });
      if (!room || room.status !== "ACTIVE" || room.postId !== current.postId)
        throw new DealError("ห้องเจรจานี้ปิดแล้ว");
      const claimed = await tx.marketplacePost.updateMany({
        where: { id: current.postId, status: "OPEN" }, data: { status: "CLOSED" },
      });
      if (!claimed.count) throw new DealError("ประกาศนี้ปิดรับข้อเสนอแล้ว");
      const accepted = await tx.deal.update({ where: { id }, data: { status: "ACCEPTED", acceptedAt: now } });
      await tx.deal.updateMany({
        where: { postId: current.postId, id: { not: id }, status: "PENDING" }, data: { status: "CANCELLED" },
      });
      await tx.chatRoom.updateMany({
        where: { postId: current.postId, id: { not: room.id }, status: "ACTIVE" },
        data: { status: "ARCHIVED", closedAt: now, lastMessageAt: now },
      });
      await tx.chatRoom.update({
        where: { id: room.id }, data: { status: "DEAL_CLOSED", closedAt: now, lastMessageAt: now },
      });
      await tx.chatMessage.create({ data: {
        roomId: room.id, senderId: user.id, messageType: "TEXT",
        content: "คู่ค้ายอมรับข้อเสนอ #" + id + " แล้ว · ยืนยันเมื่อส่งมอบสำเร็จในเมนูดีล",
      } });
      return accepted;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ success: true, status: deal.status });
  } catch (error) {
    if (error instanceof DealError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
      return NextResponse.json({ error: "ดีลถูกอัปเดตพร้อมกัน กรุณารีเฟรชแล้วลองอีกครั้ง" }, { status: 409 });
    console.error("Update deal failed", error);
    return NextResponse.json({ error: "อัปเดตดีลไม่สำเร็จ" }, { status: 500 });
  }
}
