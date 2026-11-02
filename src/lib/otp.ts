import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendOtpEmail } from "./mail";
import { OtpPurpose } from "@prisma/client";

const OTP_EXPIRY_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export function generateNumericOtp(): string {
  // Generate random 6-digit integer from 100000 to 999999
  const num = Math.floor(100000 + Math.random() * 900000);
  return num.toString();
}

export async function createAndSendOtp({
  userId,
  email,
  fullName,
  purpose,
}: {
  userId: number;
  email: string;
  fullName: string;
  purpose: OtpPurpose;
}) {
  // Check cooldown: Has an OTP been created in the last 60 seconds?
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      userId,
      purpose,
      createdAt: {
        gte: new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (recentOtp) {
    const waitSeconds = Math.ceil(
      (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
    );
    throw new Error(`กรุณารออีก ${waitSeconds} วินาทีก่อนขอรหัส OTP ใหม่อีกครั้ง`);
  }

  const plainOtp = generateNumericOtp();
  const salt = await bcrypt.genSalt(8);
  const codeHash = await bcrypt.hash(plainOtp, salt);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Invalidate any previous unused OTPs for this purpose
  await prisma.otpCode.updateMany({
    where: {
      userId,
      purpose,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  // Create new OTP record
  await prisma.otpCode.create({
    data: {
      userId,
      purpose,
      codeHash,
      expiresAt,
    },
  });

  // Send email via Mailpit
  await sendOtpEmail({
    to: email,
    fullName,
    otpCode: plainOtp,
    purpose,
  });

  return { success: true };
}

export async function verifyOtp({
  userId,
  otpCode,
  purpose,
}: {
  userId: number;
  otpCode: string;
  purpose: OtpPurpose;
}) {
  const latestOtp = await prisma.otpCode.findFirst({
    where: {
      userId,
      purpose,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!latestOtp) {
    throw new Error("ไม่พบรหัส OTP ที่รอการยืนยัน หรือรหัสถูกใช้งานไปแล้ว");
  }

  // Check expiration
  if (new Date() > latestOtp.expiresAt) {
    await prisma.otpCode.update({
      where: { id: latestOtp.id },
      data: { usedAt: new Date() },
    });
    throw new Error("รหัส OTP หมดอายุแล้ว (อายุการใช้งาน 10 นาที) กรุณากดขอรหัสใหม่");
  }

  // Check attempts
  if (latestOtp.attempts >= MAX_ATTEMPTS) {
    await prisma.otpCode.update({
      where: { id: latestOtp.id },
      data: { usedAt: new Date() },
    });
    throw new Error("กรอกรหัสผิดเกินจำนวนครั้งที่กำหนด กรุณากดขอรหัสใหม่");
  }

  const isMatch = await bcrypt.compare(otpCode, latestOtp.codeHash);
  if (!isMatch) {
    await prisma.otpCode.update({
      where: { id: latestOtp.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - (latestOtp.attempts + 1);
    throw new Error(`รหัส OTP ไม่ถูกต้อง (เหลือโอกาสลองอีก ${remaining} ครั้ง)`);
  }

  // Mark as used
  await prisma.otpCode.update({
    where: { id: latestOtp.id },
    data: { usedAt: new Date() },
  });

  return { verified: true };
}
