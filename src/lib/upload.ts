import { mkdir, writeFile } from "fs/promises";
import * as path from "path";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { cwd } from "node:process";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadScope = "posts" | "chat";

/**
 * Validates image file magic bytes and saves it under public/uploads/<scope>/.
 * Returns the public relative URL path or throws a descriptive Error.
 */
export async function saveValidatedImage(
  file: File,
  scope: UploadScope,
  ownerId: number
): Promise<string> {
  if (!file.size || file.size > MAX_IMAGE_BYTES) {
    throw new Error("ขนาดไฟล์ต้องไม่เกิน 5MB");
  }
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WebP");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedType = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    ? "image/jpeg"
    : buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ? "image/png"
    : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP"
    ? "image/webp"
    : null;

  if (detectedType !== file.type) {
    throw new Error("เนื้อหาไฟล์ไม่ตรงกับชนิดรูปภาพ");
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${scope}_${ownerId}_${randomUUID()}.${ext}`;
  const uploadDir = path.join(cwd(), "public", "uploads", scope);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${scope}/${filename}`;
}
