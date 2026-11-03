import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401, headers });
    const query = new URL(request.url).searchParams;
    const cursor = Number(query.get("cursor") || 0);
    const roomId = Number(query.get("roomId") || 0);
    if (![cursor, roomId].every(n => Number.isSafeInteger(n) && n >= 0)) return NextResponse.json({ error: "รหัสรายการไม่ถูกต้อง" }, { status: 400, headers });
    const rooms = await prisma.chatRoom.findMany({
      where: { OR: [{ initiatorId: user.id }, { ownerId: user.id }], ...(roomId ? { id: roomId } : {}), ...(cursor ? { id: { lt: cursor } } : {}) },
      orderBy: { id: "desc" }, take: 13,
      select: { id: true, status: true, closedAt: true, createdAt: true, initiatorId: true,
        initiator: { select: { fullName: true } }, owner: { select: { fullName: true } },
        post: { select: { id: true, title: true, postType: true, location: { select: { province: true } } } },
        supportTickets: { where: { requesterId: user.id }, select: { id: true, status: true } },
      },
    });
    return NextResponse.json({ rooms: rooms.slice(0, 12).map(room => ({
      id: room.id, status: room.status, closedAt: room.closedAt, createdAt: room.createdAt,
      partnerName: room.initiatorId === user.id ? room.owner.fullName : room.initiator.fullName,
      post: room.post, ticket: room.supportTickets[0] || null,
    })), nextCursor: rooms.length > 12 ? rooms[11].id : null }, { headers });
  } catch (error) {
    console.error("Support rooms error", error);
    return NextResponse.json({ error: "โหลดรายการไม่สำเร็จ กรุณาลองใหม่" }, { status: 500, headers });
  }
}
