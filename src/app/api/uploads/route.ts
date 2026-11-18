import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveValidatedImage, UploadScope } from "@/lib/upload";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const rawScope = String(formData.get("scope") || "posts");
    const scope: UploadScope = rawScope === "chat" ? "chat" : "posts";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์รูปภาพ" }, { status: 400 });
    }

    const url = await saveValidatedImage(file, scope, user.id);
    return NextResponse.json({ success: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "อัปโหลดรูปภาพไม่สำเร็จ";
    const status = message.includes("5MB") || message.includes("JPG") || message.includes("เนื้อหา") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
