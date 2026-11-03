import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { chatHistory } from "@/lib/chat-history";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const rooms = await prisma.chatRoom.findMany({
      where: {
        OR: [{ initiatorId: user.id }, { ownerId: user.id }],
      },
      orderBy: { lastMessageAt: "desc" },
      include: {
        post: {
          include: {
            variety: true,
            grade: true,
            location: true,
            deals: {
              include: {
                reviews: true,
              },
            },
            user: {
              select: {
                fullName: true,
                roles: { where: { isPrimaryRole: true }, select: { businessName: true } },
              },
            },
          },
        },
        initiator: {
          select: {
            id: true,
            fullName: true,
            ratingAvg: true,
            ratingCount: true,
            trustScore: true,
            roles: { where: { isPrimaryRole: true }, select: { businessName: true } },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            ratingAvg: true,
            ratingCount: true,
            trustScore: true,
            roles: { where: { isPrimaryRole: true }, select: { businessName: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    const formattedRooms = rooms.map((room) => {
      const isMeInitiator = room.initiatorId === user.id;
      const partner = isMeInitiator ? room.owner : room.initiator;
      const partnerPrimaryRole = partner.roles[0];
      const allMessages = (room.messages || []).map((m) => ({
        id: m.id,
        sender: m.senderId === user.id ? "ME" : "PARTNER",
        senderName: m.sender.fullName,
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        isProductCard: m.messageType === "PRODUCT_CARD",
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }));
      const lastMsg = allMessages[allMessages.length - 1];
      const ownDeal = room.post.deals.find(d =>
        (d.initiatorId === room.initiatorId && d.receiverId === room.ownerId) ||
        (d.initiatorId === room.ownerId && d.receiverId === room.initiatorId));

      const unreadCount = (room.messages || []).filter(
        (m) => m.senderId !== user.id && !m.isRead
      ).length;

      // คำนวณสถานะห้อง: หากประกาศปิดดีลไปแล้วแต่ไม่ใช่ห้องที่ปิดดีล ให้เป็น ARCHIVED
      const effectiveStatus =
        room.status === "ACTIVE" && room.post.status === "CLOSED"
          ? "ARCHIVED"
          : room.status;

      // ตรวจสอบว่าผู้ใช้ปัจจุบันเคยให้คะแนนรีวิวในดีลของห้องนี้หรือยัง
      const hasReviewedByMe = (room.post.deals || []).some((d) =>
        (d.reviews || []).some((rev) => rev.reviewerId === user.id)
      );

      return {
        id: room.id,
        postId: room.postId,
        status: effectiveStatus,
        closedAt: room.closedAt,
        ...chatHistory(room.closedAt),
        deal: ownDeal ? { id: ownDeal.id, agreedPrice: String(ownDeal.agreedPrice), agreedPricePerKg: ownDeal.agreedPricePerKg?.toString(), agreedQuantityKg: ownDeal.agreedQuantityKg?.toString(), cutDate: ownDeal.cutDate, note: ownDeal.note } : null,
        partnerId: partner.id,
        partnerName: partner.fullName,
        partnerBusiness: partnerPrimaryRole?.businessName || partner.fullName,
        partnerRating: Number(partner.ratingAvg),
        partnerRatingCount: partner.ratingCount,
        partnerTrustScore: partner.trustScore,
        hasReviewedByMe,
        lastActive: "ออนไลน์เมื่อสักครู่",
        lastMessage: lastMsg ? lastMsg.text : "เริ่มการสนทนา",
        lastTime: lastMsg
          ? lastMsg.time
          : new Date(room.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }),
        unreadCount,
        messages: allMessages,
        post: {
          id: room.post.id,
          title: room.post.title,
          pricePerKg: room.post.pricePerKg ? Number(room.post.pricePerKg) : Number(room.post.price),
          province: room.post.location?.province || "จันทบุรี",
          quantityKg: room.post.quantityKg ? Number(room.post.quantityKg) : 5000,
          authorName: room.post.user.fullName,
          businessName: room.post.user.roles[0]?.businessName || room.post.user.fullName,
          status: room.post.status,
        },
      };
    });

    return NextResponse.json({ success: true, rooms: formattedRooms }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("GET Chat Rooms Error:", error);
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลห้องแชทได้" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเริ่มการแชท" }, { status: 401 });
    }

    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "กรุณาระบุ postId" }, { status: 400 });
    }

    const post = await prisma.marketplacePost.findUnique({
      where: { id: Number(postId) },
      include: { user: true, location: true },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบข้อมูลประกาศสินค้านี้" }, { status: 404 });
    }

    if (post.userId === user.id) {
      return NextResponse.json({ error: "คุณไม่สามารถเริ่มแชทกับประกาศของตัวเองได้" }, { status: 400 });
    }

    if (post.status !== "OPEN") {
      return NextResponse.json({ error: "ประกาศนี้ปิดรับการเจรจาแล้ว" }, { status: 409 });
    }

    // Check if room already exists
    let room = await prisma.chatRoom.findUnique({
      where: {
        postId_initiatorId: {
          postId: post.id,
          initiatorId: user.id,
        },
      },
    });

    if (!room) {
      // Create new chat room
      room = await prisma.chatRoom.create({
        data: {
          postId: post.id,
          initiatorId: user.id,
          ownerId: post.userId,
          status: "ACTIVE",
        },
      });

      // Send initial product card message
      await prisma.chatMessage.create({
        data: {
          roomId: room.id,
          senderId: user.id,
          messageType: "PRODUCT_CARD",
          content: `สนใจสินค้า: ${post.title}`,
        },
      });
    }

    return NextResponse.json({ success: true, roomId: room.id });
  } catch (error) {
    console.error("POST Chat Room Error:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างห้องแชทได้" }, { status: 500 });
  }
}
