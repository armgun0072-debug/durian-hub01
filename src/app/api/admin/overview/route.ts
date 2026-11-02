import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    // 1. Fetch Role Requests
    const roleRequests = await prisma.roleVerificationRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            trustScore: true,
            activeRole: true,
          },
        },
        reviewedByAdmin: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    // 2. Fetch Post Reports
    const postReports = await prisma.postReport.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        post: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                trustScore: true,
              },
            },
            variety: true,
            grade: true,
            location: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING first
        { createdAt: "desc" },
      ],
    });

    // 3. Fetch Marketplace Posts for Moderation
    const posts = await prisma.marketplacePost.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            trustScore: true,
          },
        },
        variety: true,
        grade: true,
        location: true,
        reports: {
          select: {
            id: true,
            reason: true,
            detail: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 4. Fetch Users
    const users = await prisma.user.findMany({
      include: {
        roles: true,
        location: true,
        _count: {
          select: {
            posts: true,
            roleRequests: true,
            reportsMade: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 5. Calculate Quick Stats
    const pendingRoleRequestsCount = roleRequests.filter((r) => r.status === "PENDING").length;
    const pendingReportsCount = postReports.filter((r) => r.status === "PENDING").length;
    const outlierPostsCount = posts.filter((p) => p.isPriceOutlier).length;
    const hiddenPostsCount = posts.filter((p) => p.status === "HIDDEN_BY_ADMIN").length;
    const suspendedUsersCount = users.filter((u) => u.status === "SUSPENDED" || u.status === "BANNED").length;

    return NextResponse.json({
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
      },
      summary: {
        pendingRoleRequestsCount,
        pendingReportsCount,
        totalPostsCount: posts.length,
        outlierPostsCount,
        hiddenPostsCount,
        totalUsersCount: users.length,
        suspendedUsersCount,
      },
      roleRequests,
      postReports,
      posts,
      users,
    });
  } catch (error) {
    console.error("Admin Overview Error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับผู้ดูแลระบบ" },
      { status: 500 }
    );
  }
}

