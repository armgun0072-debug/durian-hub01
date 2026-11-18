import type { Prisma } from "@prisma/client";

import { referencePrice } from "./reference-price";

type Sample = {
  userId: number;
  varietyId: number | null; gradeId: number | null; locationId: number;
  postType: string; priceUnit: string; price: unknown; quantityKg: unknown;
};

export function marketPricePerKg(unit: string, rawPrice: unknown, rawQuantity: unknown) {
  const price = Number(rawPrice);
  const quantity = Number(rawQuantity);
  const amount = unit === "PER_KG" ? price : unit === "PER_TON" ? price / 1000
    : unit === "LUMP_SUM" && quantity > 0 ? price / quantity : NaN;
  return Number.isFinite(amount) && amount > 0 && amount <= 99999999.99 ? amount : null;
}

// A snapshot of OPEN, non-outlier asking prices from the last 7 days.
// Use the declared unit, since legacy pricePerKg sometimes contains a lump sum.
type Quote = { userId: number; price: number };

export function summarizeMarketPosts(posts: Sample[]) {
  const groups = new Map<string, { varietyId: number; gradeId: number; locationId: number; buy: Quote[]; sell: Quote[]; cut: Quote[]; buyVolume: number; sellVolume: number }>();
  for (const post of posts) {
    if (!post.varietyId || !post.gradeId) continue;
    const quantity = Number(post.quantityKg);
    const perKg = marketPricePerKg(post.priceUnit, post.price, quantity);
    if (perKg === null) continue;
    if (!["BUY", "SELL", "CUT_SERVICE"].includes(post.postType)) continue;
    const key = `${post.varietyId}:${post.gradeId}:${post.locationId}`;
    let group = groups.get(key);
    if (!group) {
      group = { varietyId: post.varietyId, gradeId: post.gradeId, locationId: post.locationId, buy: [], sell: [], cut: [], buyVolume: 0, sellVolume: 0 };
      groups.set(key, group);
    }
    const volume = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    if (post.postType === "BUY") { group.buy.push({ userId: post.userId, price: perKg }); group.buyVolume += volume; }
    if (post.postType === "SELL") { group.sell.push({ userId: post.userId, price: perKg }); group.sellVolume += volume; }
    if (post.postType === "CUT_SERVICE") group.cut.push({ userId: post.userId, price: perKg });
  }
  const round = (n: number) => Math.round(n * 100) / 100;

  return [...groups.values()].map((g) => {
    // Service wages are a different market: exclude them from fruit min/max.
    const buy = referencePrice(g.buy), sell = referencePrice(g.sell), cut = referencePrice(g.cut);
    const fruitPrices = [...(buy.estimate === null ? [] : buy.eligible), ...(sell.estimate === null ? [] : sell.eligible)];
    return {
      varietyId: g.varietyId, gradeId: g.gradeId, locationId: g.locationId,
      avgBuyPrice: buy.estimate, avgSellPrice: sell.estimate, avgCutWagePerKg: cut.estimate,
      minPrice: fruitPrices.length ? round(Math.min(...fruitPrices)) : null,
      maxPrice: fruitPrices.length ? round(Math.max(...fruitPrices)) : null,
      totalBuyVolumeKg: round(g.buyVolume), totalSellVolumeKg: round(g.sellVolume),
      samplePostCount: buy.sources + sell.sources + cut.sources,
    };
  });
}

export async function refreshMarketStats(tx: Prisma.TransactionClient, now = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const statDate = new Date(`${day}T00:00:00.000Z`);
  const posts = await tx.marketplacePost.findMany({
    where: { status: "OPEN", isPriceOutlier: false, createdAt: { gte: new Date(now.getTime() - 7 * 86400000), lte: now } },
  });
  const groups = summarizeMarketPosts(posts);
  // Clear stale computed values for today; preserve official reference prices.
  await tx.dailyMarketStat.updateMany({ where: { statDate }, data: {
    avgBuyPrice: null, avgSellPrice: null, avgCutWagePerKg: null, minPrice: null, maxPrice: null,
    totalBuyVolumeKg: 0, totalSellVolumeKg: 0, samplePostCount: 0,
  } });
  for (const group of groups) {
    const { varietyId, gradeId, locationId } = group;
    await tx.dailyMarketStat.upsert({
      where: { statDate_varietyId_gradeId_locationId: { statDate, varietyId, gradeId, locationId } },
      create: { statDate, ...group, methodologyVersion: 1 }, update: { ...group, methodologyVersion: 1 },
    });
  }
  return { date: day, groups: groups.length, samples: groups.reduce((sum, g) => sum + g.samplePostCount, 0) };
}
