import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: บัญชีนี้ไม่ใช่ผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
    }

    const post = await prisma.marketplacePost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "ไม่พบประกาศนี้ในระบบ" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body as {
      action: "HIDE" | "RESTORE" | "TOGGLE_OUTLIER";
    };

    if (action === "HIDE") {
      const updated = await prisma.marketplacePost.update({
        where: { id: postId },
        data: { status: "HIDDEN_BY_ADMIN" },
      });
      return NextResponse.json({
        success: true,
        message: "ซ่อนประกาศนี้ออกจากตลาดกลางเรียบร้อยแล้ว",
        post: updated,
      });
    } else if (action === "RESTORE") {
      const updated = await prisma.marketplacePost.update({
        where: { id: postId },
        data: { status: "OPEN" },
      });
      return NextResponse.json({
        success: true,
        message: "คืนสถานะให้ประกาศนี้แสดงบนตลาดกลางตามปกติแล้ว",
        post: updated,
      });
    } else if (action === "TOGGLE_OUTLIER") {
      const updated = await prisma.marketplacePost.update({
        where: { id: postId },
        data: { isPriceOutlier: !post.isPriceOutlier },
      });
      return NextResponse.json({
        success: true,
        message: `ปรับสถานะราคาผิดปกติเป็น: ${!post.isPriceOutlier ? "ผิดปกติ (Outlier)" : "ราคาปกติ"}`,
        post: updated,
      });
    } else {
      return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin Post Action Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการจัดการประกาศ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: บัญชีนี้ไม่ใช่ผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const postId = parseInt(id, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "รหัสประกาศไม่ถูกต้อง" }, { status: 400 });
    }

    await prisma.marketplacePost.delete({
      where: { id: postId },
    });

    return NextResponse.json({
      success: true,
      message: "ลบประกาศออกจากระบบถาวรเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("Admin Delete Post Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบประกาศ" },
      { status: 500 }
    );
  }
}

