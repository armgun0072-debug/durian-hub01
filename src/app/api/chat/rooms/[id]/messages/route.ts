import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { ChatMessageType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = Number(id);

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || (room.initiatorId !== user.id && room.ownerId !== user.id)) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงห้องแชทนี้" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const shouldMarkRead = searchParams.get("markRead") === "true";

    // Mark partner's unread messages as read ONLY when user is actively inside the chat room
    if (shouldMarkRead) {
      await prisma.chatMessage.updateMany({
        where: {
          roomId,
          senderId: { not: user.id },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: { id: true, fullName: true },
        },
      },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      sender: m.senderId === user.id ? "ME" : "PARTNER",
      senderName: m.sender.fullName,
      text: m.content,
      time: new Date(m.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
      isProductCard: m.messageType === "PRODUCT_CARD",
      isRead: m.isRead,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, messages: formattedMessages });
  } catch (error) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อความได้" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const { id } = await params;
    const roomId = Number(id);

    const room = await prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || (room.initiatorId !== user.id && room.ownerId !== user.id)) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ส่งข้อความในห้องนี้" }, { status: 403 });
    }

    const body = await request.json();
    const { content, messageType = "TEXT" } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "กรุณาระบุข้อความ" }, { status: 400 });
    }

    const [newMessage] = await prisma.$transaction([
      prisma.chatMessage.create({
        data: {
          roomId,
          senderId: user.id,
          messageType: messageType as ChatMessageType,
          content: content.trim(),
        },
      }),
      prisma.chatRoom.update({
        where: { id: roomId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        sender: "ME",
        senderName: user.fullName,
        text: newMessage.content,
        time: new Date(newMessage.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        isProductCard: newMessage.messageType === "PRODUCT_CARD",
        isRead: false,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: "ไม่สามารถส่งข้อความได้" }, { status: 500 });
  }
}
