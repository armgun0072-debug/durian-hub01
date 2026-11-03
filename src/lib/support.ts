import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser, getCurrentUser } from "@/lib/auth";
import { positiveId } from "@/lib/input";

const categories = ["DELIVERY", "PAYMENT", "QUALITY", "SCAM", "OTHER"];
const headers = { "Cache-Control": "private, no-store" };
class SupportError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
async function actor(admin: boolean) {
  const user = await (admin ? getAdminUser() : getCurrentUser());
  if (!user) throw new SupportError("กรุณาเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์", 401);
  return user;
}
async function body(request: Request) {
  try {
    const value = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new SupportError("ข้อมูล JSON ไม่ถูกต้อง", 400); }
}
function content(value: unknown) {
  if (typeof value !== "string" || !value.trim() || value.length > 5000) throw new SupportError("ข้อความต้องมี 1–5,000 ตัวอักษร", 400);
  return value.trim();
}
async function respond(run: () => Promise<unknown>) {
  try { return NextResponse.json(await run(), { headers }); }
  catch (error) {
    if (error instanceof SupportError) return NextResponse.json({ error: error.message }, { status: error.status, headers });
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "มีคำร้องของรายการนี้แล้ว กรุณาเปิดคำร้องเดิม" }, { status: 409, headers });
    if (["P2034", "P2025"].includes((error as { code?: string }).code || "")) return NextResponse.json({ error: "คำร้องมีการเปลี่ยนแปลง กรุณารีเฟรชแล้วลองใหม่" }, { status: 409, headers });
    console.error("Support error", error);
    return NextResponse.json({ error: "ไม่สามารถดำเนินการได้ กรุณาลองใหม่" }, { status: 500, headers });
  }
}
export function listSupport(request: Request, admin = false) {
  return respond(async () => {
    const user = await actor(admin);
    const url = new URL(request.url);
    const roomId = positiveId(url.searchParams.get("roomId"));
    const cursor = positiveId(url.searchParams.get("cursor"));
    const status = url.searchParams.get("status") || "OPEN";
    if (admin && !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status)) throw new SupportError("สถานะไม่ถูกต้อง", 400);
    const tickets = await prisma.supportTicket.findMany({
      where: { ...(!admin ? { requesterId: user.id } : { status: status as "OPEN" | "IN_PROGRESS" | "RESOLVED" }), ...(roomId ? { roomId } : {}) },
      orderBy: admin ? [{ queuedAt: "asc" }, { id: "asc" }] : [{ id: "desc" }], take: 21,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { room: { select: { post: { select: { title: true } } } }, requester: { select: { fullName: true } } },
    });
    return { tickets: tickets.slice(0, 20), nextCursor: tickets.length > 20 ? tickets[19].id : null };
  });
}
export function createSupport(request: Request) {
  return respond(async () => {
    const user = await actor(false);
    const data = await body(request);
    const roomId = positiveId(data.roomId);
    if (!roomId || !categories.includes(data.category)) throw new SupportError("กรุณาระบุห้องและประเภทปัญหา", 400);
    const text = content(data.content);
    const room = await prisma.chatRoom.findUnique({ where: { id: roomId } });
    if (!room || (room.initiatorId !== user.id && room.ownerId !== user.id)) throw new SupportError("คุณไม่มีสิทธิ์แจ้งปัญหาของห้องนี้", 403);
    const ticket = await prisma.supportTicket.create({ data: {
      roomId, requesterId: user.id, category: data.category,
      messages: { create: { senderId: user.id, content: text } },
    } });
    return { ticket };
  });
}
export function supportDetail(request: Request, id: string, admin = false) {
  return respond(async () => {
    const user = await actor(admin);
    const ticketId = positiveId(id);
    if (!ticketId) throw new SupportError("รหัสคำร้องไม่ถูกต้อง", 400);
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: ticketId, ...(!admin ? { requesterId: user.id } : {}) },
      include: { requester: { select: { fullName: true } }, room: { select: { id: true, postId: true, post: { select: { title: true } } } } },
    });
    if (!ticket) throw new SupportError("ไม่พบคำร้องหรือไม่มีสิทธิ์เข้าถึง", 404);
    const cursor = positiveId(new URL(request.url).searchParams.get("before"));
    const messages = await prisma.supportMessage.findMany({
      where: { ticketId, ...(cursor ? { id: { lt: cursor } } : {}) }, orderBy: { id: "desc" }, take: 51,
      include: { sender: { select: { fullName: true } } },
    });
    let evidence;
    if (admin) {
      const room = await prisma.chatRoom.findUniqueOrThrow({ where: { id: ticket.roomId } });
      evidence = {
        messages: await prisma.chatMessage.findMany({ where: { roomId: room.id }, orderBy: { id: "asc" }, include: { sender: { select: { fullName: true } } } }),
        deals: await prisma.deal.findMany({ where: { postId: room.postId, OR: [
          { initiatorId: room.initiatorId, receiverId: room.ownerId }, { initiatorId: room.ownerId, receiverId: room.initiatorId },
        ] } }),
      };
    }
    const ahead = ticket.status === "OPEN" ? await prisma.supportTicket.count({ where: { status: "OPEN", OR: [
      { queuedAt: { lt: ticket.queuedAt } }, { queuedAt: ticket.queuedAt, id: { lt: ticket.id } },
    ] } }) : null;
    const handler = ticket.handledById ? await prisma.user.findUnique({ where: { id: ticket.handledById }, select: { fullName: true } }) : null;
    return { ticket, ahead, handler, canManage: admin && ticket.status === "IN_PROGRESS" && ticket.handledById === user.id, messages: messages.slice(0, 50).reverse(), nextBefore: messages.length > 50 ? messages[49].id : null, evidence };
  });
}
export function updateSupport(request: Request, id: string, admin = false) {
  return respond(async () => {
    const user = await actor(admin);
    const ticketId = positiveId(id);
    if (!ticketId) throw new SupportError("รหัสคำร้องไม่ถูกต้อง", 400);
    const data = await body(request);
    const text = data.content === undefined ? undefined : content(data.content);
    const status = data.status;
    if (admin && status === "IN_PROGRESS") throw new SupportError("กรุณาใช้ปุ่มรับคิวถัดไป", 400);
    if (status && (!admin ? status !== "OPEN" : !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(status))) throw new SupportError("สถานะไม่ถูกต้อง", 400);
    const resolution = data.resolution === undefined ? undefined : content(data.resolution);
    if (resolution && !admin) throw new SupportError("เฉพาะแอดมินเท่านั้นที่บันทึกผลแก้ไขได้", 403);
    if (!text && !status) throw new SupportError("กรุณาระบุข้อความหรือสถานะ", 400);
    if (status === "RESOLVED" && !resolution) throw new SupportError("กรุณาระบุผลการแก้ปัญหาก่อนปิดเรื่อง", 400);
    await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.findFirst({ where: { id: ticketId, ...(!admin ? { requesterId: user.id } : {}) } });
      if (!ticket) throw new SupportError("ไม่พบคำร้องหรือไม่มีสิทธิ์เข้าถึง", 404);
      if (admin && (ticket.status !== "IN_PROGRESS" || ticket.handledById !== user.id)) throw new SupportError("รับคิวก่อน และดำเนินการได้เฉพาะเรื่องที่คุณดูแล", 409);
      if (admin && status === "OPEN") throw new SupportError("ผู้แจ้งสามารถเปิดเรื่องซ้ำหลังปิดเรื่องแล้ว", 400);
      if (!admin && status === "OPEN" && ticket.status !== "RESOLVED") throw new SupportError("เปิดซ้ำได้เฉพาะเรื่องที่แก้ไขแล้ว", 409);
      if (text && ticket.status === "RESOLVED" && status !== "OPEN") throw new SupportError("กรุณาเปิดเรื่องอีกครั้งก่อนส่งข้อความ", 409);
      await tx.supportTicket.update({ where: { id: ticketId, status: ticket.status }, data: {
        updatedAt: new Date(), ...(status ? { status, resolvedAt: status === "RESOLVED" ? new Date() : null } : {}),
        ...(status === "OPEN" ? { queuedAt: new Date(), handledById: null, resolution: null } : {}), ...(resolution ? { resolution } : {}),
      } });
      if (text || status) await tx.supportMessage.create({ data: {
        ticketId, senderId: user.id, isAdmin: admin,
        content: [text, status ? `สถานะ: ${status}${resolution ? ` — ${resolution}` : ""}` : null].filter(Boolean).join("\n"),
      } });
    }, { isolationLevel: "Serializable" });
    return { success: true };
  });
}

export function claimNextSupport() {
  return respond(async () => {
    const user = await actor(true);
    const ticket = await prisma.$transaction(async tx => {
      const next = await tx.supportTicket.findFirst({ where: { status: "OPEN" }, orderBy: [{ queuedAt: "asc" }, { id: "asc" }] });
      if (!next) throw new SupportError("ไม่มีคำร้องรอรับเรื่อง", 409);
      const claimed = await tx.supportTicket.updateMany({ where: { id: next.id, status: "OPEN" }, data: { status: "IN_PROGRESS", handledById: user.id } });
      if (claimed.count !== 1) throw new SupportError("คิวนี้ถูกรับแล้ว กรุณาลองรับคิวถัดไป", 409);
      await tx.supportMessage.create({ data: { ticketId: next.id, senderId: user.id, isAdmin: true, content: "ผู้ดูแลระบบรับเรื่องแล้ว" } });
      return { id: next.id };
    }, { isolationLevel: "Serializable" });
    return { ticket };
  });
}
