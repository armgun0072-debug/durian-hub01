import { UserStatus } from "@prisma/client";

/**
 * ตารางบทลงโทษอัตโนมัติตามระดับคะแนนความประพฤติ (เต็ม 100 คะแนน)
 * - 90 - 100: ปกติ (ACTIVE)
 * - 80 - 89 : ตักเตือน (ACTIVE)
 * - 60 - 79 : ระงับชั่วคราว 3 วัน (SUSPENDED, 3 days)
 * - 40 - 59 : ระงับชั่วคราว 7 วัน (SUSPENDED, 7 days)
 * - 1 - 39  : ระงับชั่วคราว 30 วัน (SUSPENDED, 30 days)
 * - 0       : ระงับถาวร (BANNED)
 */
export function evaluatePenaltyFromScore(
  newScore: number,
  reasonLabel?: string
): {
  clampedScore: number;
  status: UserStatus;
  suspendedUntil: Date | null;
  suspensionReason: string | null;
  penaltySummary: string;
} {
  const clampedScore = Math.max(0, Math.min(100, Math.round(newScore)));
  const now = new Date();

  if (clampedScore === 0) {
    return {
      clampedScore: 0,
      status: "BANNED",
      suspendedUntil: null,
      suspensionReason:
        reasonLabel || "คะแนนความประพฤติเหลือ 0 คะแนน (ระงับการใช้งานถาวร)",
      penaltySummary: "⛔ คะแนนเหลือ 0/100 — ระงับบัญชีถาวร (Permanent Ban)",
    };
  }

  if (clampedScore <= 39) {
    const until = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      clampedScore,
      status: "SUSPENDED",
      suspendedUntil: until,
      suspensionReason:
        reasonLabel ||
        "คะแนนความประพฤติอยู่ในเกณฑ์ 1–39 คะแนน (ระงับชั่วคราว 30 วัน)",
      penaltySummary: `🔴 คะแนนเหลือ ${clampedScore}/100 — ระงับบัญชีชั่วคราว 30 วัน (ถึง ${until.toLocaleDateString("th-TH")})`,
    };
  }

  if (clampedScore <= 59) {
    const until = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      clampedScore,
      status: "SUSPENDED",
      suspendedUntil: until,
      suspensionReason:
        reasonLabel ||
        "คะแนนความประพฤติอยู่ในเกณฑ์ 40–59 คะแนน (ระงับชั่วคราว 7 วัน)",
      penaltySummary: `🟠 คะแนนเหลือ ${clampedScore}/100 — ระงับบัญชีชั่วคราว 7 วัน (ถึง ${until.toLocaleDateString("th-TH")})`,
    };
  }

  if (clampedScore <= 79) {
    const until = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return {
      clampedScore,
      status: "SUSPENDED",
      suspendedUntil: until,
      suspensionReason:
        reasonLabel ||
        "คะแนนความประพฤติอยู่ในเกณฑ์ 60–79 คะแนน (ระงับชั่วคราว 3 วัน)",
      penaltySummary: `🟠 คะแนนเหลือ ${clampedScore}/100 — ระงับบัญชีชั่วคราว 3 วัน (ถึง ${until.toLocaleDateString("th-TH")})`,
    };
  }

  if (clampedScore <= 89) {
    return {
      clampedScore,
      status: "ACTIVE",
      suspendedUntil: null,
      suspensionReason: reasonLabel || "ตักเตือนความประพฤติ (คะแนน 80–89)",
      penaltySummary: `🟡 คะแนนเหลือ ${clampedScore}/100 — สถานะตักเตือน (ใช้งานได้ปกติ)`,
    };
  }

  return {
    clampedScore,
    status: "ACTIVE",
    suspendedUntil: null,
    suspensionReason: null,
    penaltySummary: `🟢 คะแนน ${clampedScore}/100 — สถานะปกติ`,
  };
}

