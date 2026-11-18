import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { summarizeMarketPosts } from "@/lib/market-stats";
import { median } from "@/lib/reference-price";

interface DailyBucket {
  date: string;
  buyPrices: number[];
  sellPrices: number[];
  cutWages: number[];
  sampleCount: number;
}

const avg = median;

function formatBuckets(dailyMap: Map<string, DailyBucket>) {
  return Array.from(dailyMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      date: d.date,
      avgBuyPrice: avg(d.buyPrices),
      avgSellPrice: avg(d.sellPrices),
      avgCutWagePerKg: avg(d.cutWages),
      sampleCount: d.sampleCount,
    }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region")?.trim() || "";
    const variety = searchParams.get("variety")?.trim() || "";
    const daysParam = Number(searchParams.get("days") || "30");
    const days = Number.isFinite(daysParam) && daysParam > 0 && daysParam <= 90 ? Math.floor(daysParam) : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const rows = await prisma.dailyMarketStat.findMany({
      where: {
        methodologyVersion: 1,
        statDate: { gte: since },
        ...(region ? { location: { region } } : {}),
        ...(variety ? { variety: { OR: [{ nameTh: variety }, { nameEn: variety }] } } : {}),
      },
      orderBy: { statDate: "asc" },
      take: 300,
    });

    if (rows.length > 0) {
      const dailyMap = new Map<string, DailyBucket>();
      for (const r of rows) {
        const key = r.statDate.toISOString().slice(0, 10);
        const entry = dailyMap.get(key) || {
          date: key,
          buyPrices: [],
          sellPrices: [],
          cutWages: [],
          sampleCount: 0,
        };
        if (r.avgBuyPrice != null) entry.buyPrices.push(Number(r.avgBuyPrice));
        if (r.avgSellPrice != null) entry.sellPrices.push(Number(r.avgSellPrice));
        if (r.avgCutWagePerKg != null) entry.cutWages.push(Number(r.avgCutWagePerKg));
        entry.sampleCount += r.samplePostCount;
        dailyMap.set(key, entry);
      }

      return NextResponse.json(
        {
          success: true,
          source: "SNAPSHOT",
          series: formatBuckets(dailyMap),
          totalSnapshots: rows.length,
          days,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    // Fallback: aggregate directly from real non-outlier MarketplacePost records in the last N days
    const posts = await prisma.marketplacePost.findMany({
      where: {
        createdAt: { gte: since },
        status: "OPEN",
        isPriceOutlier: false,
        ...(region ? { location: { region } } : {}),
        ...(variety ? { variety: { OR: [{ nameTh: variety }, { nameEn: variety }] } } : {}),
      },
      orderBy: { createdAt: "asc" },
      take: 500,
    });

    if (posts.length > 0) {
      const dailyMap = new Map<string, DailyBucket>();
      const byDate = new Map<string, typeof posts>();
      const thaiDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" });
      for (const post of posts) {
        const date = thaiDate.format(post.createdAt);
        const bucket = byDate.get(date) ?? [];
        bucket.push(post);
        byDate.set(date, bucket);
      }
      for (const [date, quotes] of byDate) {
        const groups = summarizeMarketPosts(quotes);
        const values = (key: "avgBuyPrice" | "avgSellPrice" | "avgCutWagePerKg") =>
          groups.flatMap(group => group[key] === null ? [] : [group[key]]);
        dailyMap.set(date, { date, buyPrices: values("avgBuyPrice"), sellPrices: values("avgSellPrice"),
          cutWages: values("avgCutWagePerKg"), sampleCount: groups.reduce((sum, group) => sum + group.samplePostCount, 0) });
      }
      return NextResponse.json(
        {
          success: true,
          source: "LIVE_POSTS",
          series: formatBuckets(dailyMap),
          totalSnapshots: posts.length,
          days,
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: "NONE",
        series: [],
        totalSnapshots: 0,
        days,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET Market Stats Error:", error);
    return NextResponse.json({ error: "ไม่สามารถโหลดสถิติราคาย้อนหลังได้" }, { status: 500 });
  }
}
