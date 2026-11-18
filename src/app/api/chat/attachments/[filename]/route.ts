import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const user = await getCurrentUser();
  const { filename } = await params;
  const image = /^chat_(\d+)_[a-f0-9-]{36}\.(jpg|png|webp)$/.exec(filename);
  if (!user || !image) return new NextResponse(null, { status: 404 });
  if (Number(image[1]) !== user.id) {
    const message = await prisma.chatMessage.findFirst({ where: {
      messageType: "IMAGE", content: `/uploads/chat/${filename}`,
      room: { OR: [{ ownerId: user.id }, { initiatorId: user.id }] },
    }, select: { id: true } });
    if (!message) return new NextResponse(null, { status: 404 });
  }
  try {
    const bytes = await readFile(join(process.cwd(), "public", "uploads", "chat", filename));
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": image[2] === "jpg" ? "image/jpeg" : `image/${image[2]}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
