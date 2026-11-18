import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { positiveDecimal, positiveId } from "@/lib/input";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนแก้ไขประกาศ" }, { status: 401 });
    }

    const { id } = await params;
    const postId = positiveId(id);
    if (!postId) {
      return NextResponse.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await prisma.marketplacePost.findUnique({
      where: { id: postId },
      include: { deals: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบประกาศนี้" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขประกาศของผู้อื่น" }, { status: 403 });
    }
    if (["HIDDEN_BY_ADMIN", "REMOVED_BY_ADMIN"].includes(existing.status)) {
      return NextResponse.json(
        { error: "ประกาศนี้ถูกผู้ดูแลระบบซ่อนไว้ ไม่สามารถแก้ไขได้" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t || t.length > 200) {
        return NextResponse.json({ error: "หัวข้อประกาศต้องมี 1–200 ตัวอักษร" }, { status: 400 });
      }
      updates.title = t;
    }

    if (typeof body.content === "string") {
      if (body.content.length > 5000) {
        return NextResponse.json({ error: "รายละเอียดต้องไม่เกิน 5,000 ตัวอักษร" }, { status: 400 });
      }
      updates.content = body.content.trim();
    }

    if (body.price !== undefined) {
      const validPrice = positiveDecimal(body.price);
      if (!validPrice) {
        return NextResponse.json({ error: "ราคาต้องเป็นตัวเลขมากกว่า 0" }, { status: 400 });
      }
      updates.price = validPrice;
      updates.pricePerKg = validPrice;
    }

    if (body.quantityKg !== undefined) {
      if (body.quantityKg === null || body.quantityKg === "") {
        updates.quantityKg = null;
      } else {
        const validQty = positiveDecimal(body.quantityKg, 9999999999.99);
        if (!validQty) {
          return NextResponse.json({ error: "ปริมาณต้องเป็นตัวเลขมากกว่า 0" }, { status: 400 });
        }
        updates.quantityKg = validQty;
      }
    }

    if (body.status !== undefined) {
      if (!["OPEN", "CLOSED"].includes(String(body.status))) {
        return NextResponse.json({ error: "สถานะประกาศไม่ถูกต้อง" }, { status: 400 });
      }
      if (body.status === "OPEN" && existing.deals.length > 0) {
        return NextResponse.json(
          { error: "ประกาศที่มีการปิดดีลแล้วไม่สามารถเปิดรับซ้ำได้" },
          { status: 409 }
        );
      }
      updates.status = body.status;
    }

    const safeImageUrl =
      typeof body.imageUrl === "string" && /^\/uploads\/posts\/[a-zA-Z0-9._-]+$/.test(body.imageUrl.trim())
        ? body.imageUrl.trim()
        : body.imageUrl === null
        ? null
        : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      if (safeImageUrl !== undefined) {
        await tx.postImage.deleteMany({ where: { postId } });
        if (safeImageUrl) {
          await tx.postImage.create({
            data: { postId, imageUrl: safeImageUrl, sortOrder: 0 },
          });
        }
      }
      return tx.marketplacePost.update({
        where: { id: postId, status: { notIn: ["REMOVED_BY_ADMIN", "HIDDEN_BY_ADMIN"] },
          ...(updates.status === "OPEN" ? { deals: { none: { status: { in: ["ACCEPTED", "COMPLETED"] } } } } : {}) },
        data: updates,
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
    });

    return NextResponse.json({
      success: true,
      post: {
        id: updated.id,
        title: updated.title,
        content: updated.content,
        pricePerKg: Number(updated.pricePerKg || updated.price),
        quantityKg: updated.quantityKg ? Number(updated.quantityKg) : 0,
        status: updated.status,
        imageUrl: updated.images[0]?.imageUrl || "",
      },
    });
  } catch (error) {
    console.error("PATCH Post Error:", error);
    return NextResponse.json({ error: "ไม่สามารถแก้ไขประกาศได้" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลบประกาศ" }, { status: 401 });
    }

    const { id } = await params;
    const postId = positiveId(id);
    if (!postId) {
      return NextResponse.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await prisma.marketplacePost.findUnique({
      where: { id: postId },
      include: { deals: { select: { id: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบประกาศนี้" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ลบประกาศของผู้อื่น" }, { status: 403 });
    }
    if (existing.deals.length > 0) {
      return NextResponse.json(
        { error: "ประกาศนี้มีสัญญาดีลบันทึกไว้แล้ว กรุณาใช้สถานะ 'ปิดการขาย' แทนการลบ" },
        { status: 409 }
      );
    }

    await prisma.marketplacePost.delete({ where: { id: postId, status: { not: "REMOVED_BY_ADMIN" } } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Post Error:", error);
    return NextResponse.json({ error: "ไม่สามารถลบประกาศได้" }, { status: 500 });
  }
}
