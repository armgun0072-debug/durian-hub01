import { NextResponse } from "next/server";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const approvedRoles = user.roles
      .filter((r) => r.status === "ACTIVE")
      .map((r) => r.roleType);

    const activeRoleObj =
      user.roles.find((r) => r.roleType === user.activeRole) || user.roles[0];

    const roleRequests = await prisma.roleVerificationRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        email: user.email,
        phone: user.phone,
        businessName: activeRoleObj?.businessName || user.fullName,
        province: user.location?.province || "จันทบุรี",
        primaryRole: user.activeRole,
        approvedRoles,
        activeRole: user.activeRole,
        trustScore: user.trustScore,
        rating: Number(user.ratingAvg),
        ratingCount: user.ratingCount,
        isEmailVerified: Boolean(user.emailVerifiedAt),
        roleRequests,
      },
    });
  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
