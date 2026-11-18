import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshMarketStats } from "@/lib/market-stats";

export async function POST() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "สิทธิ์ไม่เพียงพอ: เฉพาะผู้ดูแลระบบเท่านั้น" },
        { status: 403 }
      );
    }

    const result = await prisma.$transaction((tx) => refreshMarketStats(tx));
    return NextResponse.json({
      success: true,
      ...result,
      message: `อัปเดตสถิติราคากลางวันที่ ${result.date} สำเร็จ (${result.groups} กลุ่ม / ${result.samples} ประกาศ)`,
    });
  } catch (error) {
    console.error("Admin Refresh Market Stats Error:", error);
    return NextResponse.json(
      { error: "ไม่สามารถอัปเดตสถิติราคากลางได้" },
      { status: 500 }
    );
  }
}
