import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma, type PendingRegistration } from "@prisma/client";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./auth";
import { sendOtpEmail } from "./mail";
import { registrationLocation } from "./registration-location";

const cookieName = "durian_registration";
const minute = 60_000;
const expired = "คำขอสมัครหมดอายุหรือถูกเปลี่ยนแล้ว กรุณากลับไปสมัครใหม่";
const duplicate = "อีเมลหรือเบอร์โทรนี้มีบัญชีอยู่แล้ว หากเป็นบัญชีเดิมที่ยังไม่ยืนยัน ให้ใช้รหัสผ่านเดิมเพื่อแก้ข้อมูล";
const publicRoles = ["SELLER", "BUYER", "CUTTER"] as const;
type PublicRole = typeof publicRoles[number];

class RegistrationError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}

export function registrationError(error: unknown) {
  if (error instanceof RegistrationError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    return NextResponse.json({ error: duplicate }, { status: 409 });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
    return NextResponse.json({ error: "มีการยืนยันพร้อมกัน กรุณาตรวจข้อมูลแล้วลองใหม่" }, { status: 409 });
  console.error("Pending registration failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "ทำรายการไม่สำเร็จ กรุณาลองอีกครั้ง" }, { status: 500 });
}

function key(token: string) { return createHash("sha256").update(token).digest("hex"); }
async function browserToken() { return (await cookies()).get(cookieName)?.value; }

async function ownedDraft(revision: string) {
  const token = await browserToken();
  if (!token || typeof revision !== "string") throw new RegistrationError(expired);
  const draft = await prisma.pendingRegistration.findFirst({
    where: { browserKey: key(token), revision, expiresAt: { gt: new Date() } },
  });
  if (!draft) throw new RegistrationError(expired);
  return draft;
}

async function challenge() {
  const code = String(randomInt(100000, 1000000));
  const codeHash = await bcrypt.hash(code, 8);
  const sentAt = new Date();
  return { code, fields: { codeHash, sentAt, expiresAt: new Date(+sentAt + 30 * minute), attempts: 0 } };
}

async function deliver(draft: PendingRegistration, code: string) {
  try {
    await sendOtpEmail({ to: draft.email, fullName: draft.fullName, otpCode: code, purpose: "VERIFY_EMAIL" });
  } catch {
    await prisma.pendingRegistration.deleteMany({ where: { revision: draft.revision, codeHash: draft.codeHash } });
    throw new RegistrationError("ส่งอีเมลไม่สำเร็จ กรุณากลับไปกรอกข้อมูลสมัครแล้วลองใหม่", 503);
  }
}

export async function startRegistration(body: Record<string, unknown>) {
  const field = (name: string) => typeof body[name] === "string" ? (body[name] as string).trim() : "";
  const email = field("email").toLowerCase(), phone = field("phone");
  const fullName = field("fullName"), businessName = field("businessName");
  const primaryRole = field("primaryRole") as PublicRole;
  const password = typeof body.password === "string" ? body.password : "";
  if (!fullName || !businessName || !phone || !publicRoles.includes(primaryRole))
    throw new RegistrationError("กรุณากรอกข้อมูลและเลือกบทบาทผู้สมัครให้ครบ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new RegistrationError("รูปแบบอีเมลไม่ถูกต้อง");
  if (password.length < 6) throw new RegistrationError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");

  const existing = await prisma.user.findMany({
    where: { OR: [{ email }, { phone }] }, include: { roles: true },
  });
  const legacy = existing[0];
  if (legacy && (existing.length !== 1 || legacy.emailVerifiedAt || legacy.status !== "ACTIVE" ||
      legacy.activeRole === "ADMIN" || legacy.roles.some(r => r.roleType === "ADMIN") ||
      !await verifyPassword(password, legacy.passwordHash))) throw new RegistrationError(duplicate, 409);

  const token = await browserToken() || randomBytes(32).toString("hex");
  const browserKey = key(token);
  await prisma.pendingRegistration.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  const previous = await prisma.pendingRegistration.findUnique({ where: { browserKey } });
  const data = { revision: randomUUID(), email, phone, fullName, businessName, primaryRole,
    region: field("region"), province: field("province"), passwordHash: legacy?.passwordHash ?? await hashPassword(password),
    legacyUserId: legacy?.id ?? null };
  if (legacy) {
    await prisma.otpCode.updateMany({ where: { userId: legacy.id, purpose: "VERIFY_EMAIL", usedAt: null },
      data: { usedAt: new Date() } });
  }
  let message = "ส่งรหัส OTP แล้ว กรุณาตรวจสอบกล่องจดหมายหรือโฟลเดอร์สแปม";
  if (previous && previous.email === email && Date.now() - +previous.sentAt < minute) {
    const changed = await prisma.pendingRegistration.updateMany({ where: { browserKey, revision: previous.revision }, data });
    if (!changed.count) throw new RegistrationError(expired);
    message = "ใช้รหัส OTP จากอีเมลที่ส่งไปเมื่อสักครู่";
  } else {
    const recent = await prisma.pendingRegistration.count({ where: { email, sentAt: { gt: new Date(Date.now() - minute) } } });
    if (recent >= 5) throw new RegistrationError("มีการขอรหัสหลายครั้ง กรุณารอหนึ่งนาทีแล้วลองใหม่", 429);
    const { code, fields } = await challenge();
    const draft = await prisma.pendingRegistration.upsert({
      where: { browserKey }, create: { browserKey, ...data, ...fields }, update: { ...data, ...fields },
    });
    await deliver(draft, code);
  }
  const response = NextResponse.json({ success: true, registrationId: data.revision, email, message });
  response.cookies.set(cookieName, token, { httpOnly: true, sameSite: "strict", path: "/api/auth",
    secure: process.env.NODE_ENV === "production", maxAge: 1800 });
  return response;
}

export async function resendRegistration(revision: string) {
  const draft = await ownedDraft(revision);
  if (Date.now() - +draft.sentAt < minute) throw new RegistrationError("กรุณารอ 1 นาทีก่อนขอรหัสใหม่", 429);
  const { code, fields } = await challenge();
  const updated = await prisma.pendingRegistration.updateMany({
    where: { revision, codeHash: draft.codeHash }, data: fields,
  });
  if (!updated.count) throw new RegistrationError(expired);
  await deliver({ ...draft, ...fields }, code);
  return NextResponse.json({ success: true, message: "ส่งรหัส OTP ใหม่แล้ว" });
}

export async function completeRegistration(revision: string, input: string) {
  const draft = await ownedDraft(revision);
  if (Date.now() - +draft.sentAt >= 10 * minute) throw new RegistrationError("รหัส OTP หมดอายุ กรุณาขอรหัสใหม่");
  if (!/^\d{6}$/.test(input)) throw new RegistrationError("กรุณากรอกรหัส OTP 6 หลัก");
  const identity = { revision, codeHash: draft.codeHash, sentAt: { gt: new Date(Date.now() - 10 * minute) } };
  const attempt = await prisma.pendingRegistration.updateMany({
    where: { ...identity, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } },
  });
  if (!attempt.count) throw new RegistrationError("กรุณาขอรหัส OTP ใหม่");
  if (!await bcrypt.compare(input, draft.codeHash)) throw new RegistrationError("รหัส OTP ไม่ถูกต้อง");
  return prisma.$transaction(async tx => {
    const claimed = await tx.pendingRegistration.deleteMany({ where: identity });
    if (!claimed.count) throw new RegistrationError(expired);
    const contacts = { email: draft.email, phone: draft.phone };
    const conflict = await tx.user.findFirst({ where: { OR: [{ email: draft.email }, { phone: draft.phone }],
      ...(draft.legacyUserId ? { id: { not: draft.legacyUserId } } : {}) } });
    if (conflict) throw new RegistrationError(duplicate, 409);
    const include = { roles: true, location: true };
    if (draft.legacyUserId) {
      const corrected = await tx.user.updateMany({ where: { id: draft.legacyUserId, emailVerifiedAt: null,
        status: "ACTIVE", passwordHash: draft.passwordHash, activeRole: { not: "ADMIN" },
        roles: { none: { roleType: "ADMIN" } } }, data: { ...contacts, emailVerifiedAt: new Date() } });
      if (!corrected.count) throw new RegistrationError(duplicate, 409);
      await tx.otpCode.deleteMany({ where: { userId: draft.legacyUserId, usedAt: null } });
      return tx.user.findUniqueOrThrow({ where: { id: draft.legacyUserId }, include });
    }
    const locationId = await registrationLocation(tx, draft.province, draft.region);
    return tx.user.create({ data: { ...contacts, locationId, fullName: draft.fullName,
      passwordHash: draft.passwordHash, activeRole: draft.primaryRole, emailVerifiedAt: new Date(),
      roles: { create: { roleType: draft.primaryRole, isPrimaryRole: true, businessName: draft.businessName } } }, include });
  });
}
