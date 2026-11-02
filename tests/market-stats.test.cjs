const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./helpers.cjs');
const { summarizeMarketPosts, refreshMarketStats } = loadTs('src/lib/market-stats.ts');
const sample = (changes = {}) => ({ varietyId: 1, gradeId: 2, locationId: 3, postType: 'SELL', priceUnit: 'PER_KG', price: 100, quantityKg: 10, ...changes });
test('stats normalize kg, ton, and lump sum prices; keep wages out of fruit range', () => {
  const [g] = summarizeMarketPosts([sample(), sample({ priceUnit: 'PER_TON', price: 200000 }), sample({ priceUnit: 'LUMP_SUM', price: 3000 }), sample({ postType: 'BUY', price: 80 }), sample({ postType: 'CUT_SERVICE', price: 5 })]);
  assert.equal(g.avgSellPrice, 200); assert.equal(g.avgBuyPrice, 80); assert.equal(g.avgCutWagePerKg, 5);
  assert.equal(g.minPrice, 80); assert.equal(g.maxPrice, 300); assert.equal(g.samplePostCount, 5); assert.equal(g.totalSellVolumeKg, 30);
});
test('stats skip missing dimensions, invalid prices, and lump sums without quantities', () => {
  const groups = summarizeMarketPosts([sample({ varietyId: null }), sample({ gradeId: null }), sample({ price: -1 }), sample({ priceUnit: 'LUMP_SUM', quantityKg: null }), sample({ price: Infinity })]);
  assert.equal(groups.length, 0);
});
test('stats keep groups separate and do not invent a fruit price for services', () => {
  const groups = summarizeMarketPosts([sample(), sample({ locationId: 4, postType: 'CUT_SERVICE' })]);
  assert.equal(groups.length, 2); assert.equal(groups[1].minPrice, null); assert.equal(groups[1].avgSellPrice, null);
});
test('snapshot uses Bangkok date, excludes stale/hidden/outlier posts, and preserves official prices', async () => {
  const now = new Date('2026-11-01T18:00:00Z');
  const tx = {
    marketplacePost: { findMany: async ({ where }) => {
      assert.equal(where.status, 'OPEN'); assert.equal(where.isPriceOutlier, false); assert.equal(where.createdAt.lte, now);
      assert.equal(now - where.createdAt.gte, 7 * 86400000); return [sample()];
    } },
    dailyMarketStat: {
      updateMany: async ({ where, data }) => { assert.equal(where.statDate.toISOString(), '2026-11-02T00:00:00.000Z'); assert.equal(Object.hasOwn(data, 'officialRefPrice'), false); },
      upsert: async ({ create, update }) => { assert.equal(create.avgSellPrice, 100); assert.equal(Object.hasOwn(update, 'officialRefPrice'), false); },
    },
  };
  assert.equal((await refreshMarketStats(tx, now)).samples, 1);
});
