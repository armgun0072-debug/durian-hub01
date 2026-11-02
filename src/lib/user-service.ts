import { prisma } from "@/lib/prisma";
import { UserStatus } from "@prisma/client";

export async function applyUserPenalty(params: {
  userId: number;
  trustScore: number;
  status: UserStatus;
  suspendedUntil: Date | null;
  suspensionReason: string | null;
}) {
  const { userId, trustScore, status, suspendedUntil, suspensionReason } = params;

  try {
    // 1. Try standard Prisma update
    return await prisma.user.update({
      where: { id: userId },
      data: {
        trustScore,
        status,
        ...(suspendedUntil !== undefined ? { suspendedUntil } : {}),
        ...(suspensionReason !== undefined ? { suspensionReason } : {}),
      } as any,
    });
  } catch (err: any) {
    // 2. Resilient Fallback: Direct SQL update if Prisma Client in Next.js memory has cached schema
    console.warn("Falling back to direct SQL update for user penalty:", err?.message);
    if (suspendedUntil) {
      await prisma.$executeRaw`
        UPDATE users 
        SET trust_score = ${trustScore}, 
            status = ${status}, 
            suspended_until = ${suspendedUntil}, 
            suspension_reason = ${suspensionReason},
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE users 
        SET trust_score = ${trustScore}, 
            status = ${status}, 
            suspended_until = NULL, 
            suspension_reason = ${suspensionReason},
            updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    return await prisma.user.findUnique({ where: { id: userId } });
  }
}
