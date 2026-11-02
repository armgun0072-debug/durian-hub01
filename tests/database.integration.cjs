const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { PrismaClient, Prisma } = require('@prisma/client');
const { loadTs, request } = require('./helpers.cjs');

// A new disposable database, never the app database. Use the configured server.
const dbName = `durian_hub_test_${randomBytes(8).toString('hex')}`;
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${dbName}`;
const admin = new PrismaClient();
const prisma = new PrismaClient({ datasourceUrl: url.href });
let created = false;
let owner, buyer, other, outsider, location, variety, grade;

before(async () => {
  assert.match(dbName, /^durian_hub_test_[a-f0-9]{16}$/);
  await admin.$executeRawUnsafe(`CREATE DATABASE \`${dbName}\``);
  created = true;
  const pushed = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate', '--schema', 'prisma/schema.prisma'], {
    env: { ...process.env, DATABASE_URL: url.href }, encoding: 'utf8', timeout: 60000,
  });
  assert.equal(pushed.status, 0, 'Could not initialize the isolated integration database');
  for (const sql of readFileSync('database/hardening.sql', 'utf8').replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean)) await prisma.$executeRawUnsafe(sql);
  location = await prisma.location.create({ data: { province: 'TEST', district: 'TEST', region: 'TEST' } });
  variety = await prisma.durianVariety.create({ data: { nameTh: 'TEST', nameEn: 'TEST' } });
  grade = await prisma.durianGrade.create({ data: { gradeCode: 'TEST', nameTh: 'TEST' } });
  [owner, buyer, other, outsider] = await Promise.all(['owner', 'buyer', 'other', 'outsider'].map((name, i) => prisma.user.create({ data: {
    email: `${name}@example.test`, phone: `080000000${i}`, fullName: name, passwordHash: 'integration-fixture',
  } })));
}, { timeout: 90000 });

after(async () => {
  await prisma.$disconnect();
  if (created) {
    assert.match(dbName, /^durian_hub_test_[a-f0-9]{16}$/);
    assert.notEqual(new URL(process.env.DATABASE_URL).pathname, `/${dbName}`);
    await admin.$executeRawUnsafe(`DROP DATABASE \`${dbName}\``);
  }
  await admin.$disconnect();
});

function route(file, user, db = prisma) {
  return loadTs(file, { '@/lib/prisma': { prisma: db }, '@/lib/auth': { getCurrentUser: async () => user } });
}
async function fixture(options = {}) {
  const post = await prisma.marketplacePost.create({ data: {
    userId: owner.id, postType: 'SELL', locationId: location.id, varietyId: variety.id, gradeId: grade.id,
    title: 'Integration test', content: '', price: 100, priceUnit: 'PER_KG', quantityKg: 10, availableDate: new Date(), ...options,
  } });
  const rooms = await Promise.all([buyer, other].map((u) => prisma.chatRoom.create({ data: { postId: post.id, ownerId: owner.id, initiatorId: u.id } })));
  return { post, room: rooms[0], otherRoom: rooms[1] };
}
function close(f, user = buyer, room = f.room, db = prisma) {
  return route('src/app/api/deals/route.ts', user, db).POST(request({ roomId: room.id, postId: f.post.id, receiverId: owner.id, agreedPrice: 1000, agreedQuantityKg: 10 }));
}
function review(f, user, rating, db = prisma) {
  return route('src/app/api/reviews/route.ts', user, db).POST(request({ roomId: f.room.id, postId: f.post.id, revieweeId: owner.id, rating }));
}
// Keep a real DB transaction, but simulate a failure at a late write boundary.
function failRoomWrite() {
  return { $transaction: (run, settings) => prisma.$transaction((tx) => run(new Proxy(tx, {
    get(target, prop) {
      if (prop === 'chatRoom') return new Proxy(target.chatRoom, { get(model, key) {
        if (key === 'update') return async () => { throw new Error('injected last-write failure'); };
        return model[key];
      } });
      return target[prop];
    },
  })), settings) };
}

test('MySQL: outsiders cannot close deals and leave no writes', async () => {
  const f = await fixture(); const response = await close(f, outsider);
  assert.equal(response.status, 403); assert.equal(await prisma.deal.count({ where: { postId: f.post.id } }), 0);
  assert.equal((await prisma.marketplacePost.findUnique({ where: { id: f.post.id } })).status, 'OPEN');
});

test('MySQL: simultaneous deal closes produce one winner and synchronize rooms', async () => {
  const f = await fixture();
  const responses = await Promise.all([close(f), close(f, other, f.otherRoom)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  assert.equal(await prisma.deal.count({ where: { postId: f.post.id } }), 1);
  const rooms = await prisma.chatRoom.findMany({ where: { postId: f.post.id } });
  assert.deepEqual(rooms.map(r => r.status).sort(), ['ARCHIVED', 'DEAL_CLOSED']);
  assert.equal(await prisma.chatMessage.count({ where: { room: { postId: f.post.id } } }), 2);
  assert.equal((await prisma.marketplacePost.findUnique({ where: { id: f.post.id } })).status, 'CLOSED');
});

test('MySQL: a failed deal write rolls back claim, deal, message and room', async () => {
  const f = await fixture(); assert.equal((await close(f, buyer, f.room, failRoomWrite())).status, 500);
  assert.equal((await prisma.marketplacePost.findUnique({ where: { id: f.post.id } })).status, 'OPEN');
  assert.equal(await prisma.deal.count({ where: { postId: f.post.id } }), 0);
  assert.equal(await prisma.chatMessage.count({ where: { room: { postId: f.post.id } } }), 0);
  assert.equal((await prisma.chatRoom.findUnique({ where: { id: f.room.id } })).status, 'ACTIVE');
});

test('MySQL: close → concurrent reviews on two deals keeps rating totals accurate', async () => {
  const first = await fixture(); const second = await fixture();
  assert.equal((await close(first)).status, 200); assert.equal((await close(second)).status, 200);
  const results = await Promise.all([review(first, buyer, 5), review(second, buyer, 1)]);
  assert.deepEqual(results.map(r => r.status), [200, 200]);
  const u = await prisma.user.findUnique({ where: { id: owner.id } });
  assert.equal(Number(u.ratingAvg), 3); assert.equal(u.ratingCount, 2);
  assert.equal((await review(first, buyer, 4)).status, 409);
  assert.equal((await review(first, outsider, 4)).status, 403);
});

test('MySQL: concurrent duplicate reviews create only one review', async () => {
  const f = await fixture(); assert.equal((await close(f)).status, 200);
  const responses = await Promise.all([review(f, buyer, 4), review(f, buyer, 4)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
  const deal = await prisma.deal.findFirst({ where: { postId: f.post.id } });
  assert.equal(await prisma.userReview.count({ where: { dealId: deal.id } }), 1);
});

test('MySQL: review failure rolls back review, rating and notification', async () => {
  const f = await fixture(); assert.equal((await close(f)).status, 200);
  const beforeUser = await prisma.user.findUnique({ where: { id: owner.id } });
  const beforeMessages = await prisma.chatMessage.count({ where: { roomId: f.room.id } });
  assert.equal((await review(f, buyer, 5, failRoomWrite())).status, 500);
  const deal = await prisma.deal.findFirst({ where: { postId: f.post.id } });
  assert.equal(await prisma.userReview.count({ where: { dealId: deal.id } }), 0);
  const afterUser = await prisma.user.findUnique({ where: { id: owner.id } });
  assert.equal(afterUser.ratingCount, beforeUser.ratingCount); assert.equal(String(afterUser.ratingAvg), String(beforeUser.ratingAvg));
  assert.equal(await prisma.chatMessage.count({ where: { roomId: f.room.id } }), beforeMessages);
});

test('MySQL: CHECK rejects out-of-range ratings through direct DB writes', async () => {
  const f = await fixture(); assert.equal((await close(f)).status, 200);
  const deal = await prisma.deal.findFirst({ where: { postId: f.post.id } });
  for (const rating of [0, 6]) await assert.rejects(prisma.userReview.create({ data: { dealId: deal.id, reviewerId: buyer.id, revieweeId: owner.id, rating } }));
  assert.equal(await prisma.userReview.count({ where: { dealId: deal.id } }), 0);
});

test('MySQL: report count and view count survive concurrent requests', async () => {
  const f = await fixture();
  const reports = route('src/app/api/posts/[id]/report/route.ts', buyer);
  const params = { params: Promise.resolve({ id: String(f.post.id) }) };
  const responses = await Promise.all(Array.from({ length: 5 }, () => reports.POST(request({ reason: 'SPAM' }), params)));
  assert.ok(responses.every(r => r.status === 200));
  assert.equal(await prisma.postReport.count({ where: { postId: f.post.id } }), 5);
  const views = route('src/app/api/posts/[id]/view/route.ts', null);
  assert.ok((await Promise.all(Array.from({ length: 10 }, () => views.POST(request({}), params)))).every(r => r.status === 200));
  const post = await prisma.marketplacePost.findUnique({ where: { id: f.post.id } });
  assert.equal(post.reportCount, 5); assert.equal(post.viewCount, 10);
  await prisma.marketplacePost.update({ where: { id: f.post.id }, data: { status: 'HIDDEN_BY_ADMIN' } });
  assert.equal((await views.POST(request({}), params)).status, 404);
});

test('MySQL: failed report insert rolls back the counter increment', async () => {
  const f = await fixture();
  const db = { $transaction: (run) => prisma.$transaction((tx) => run(new Proxy(tx, {
    get(target, prop) {
      if (prop === 'postReport') return new Proxy(target.postReport, { get(model, key) {
        if (key === 'create') return async () => { throw new Error('report insert failure'); };
        return model[key];
      } });
      return target[prop];
    },
  }))) };
  const response = await route('src/app/api/posts/[id]/report/route.ts', buyer, db).POST(request({ reason: 'SCAM' }), { params: Promise.resolve({ id: String(f.post.id) }) });
  assert.equal(response.status, 500); assert.equal(await prisma.postReport.count({ where: { postId: f.post.id } }), 0);
  assert.equal((await prisma.marketplacePost.findUnique({ where: { id: f.post.id } })).reportCount, 0);
});

test('MySQL: stats rebuild is idempotent, normalizes units, removes stale values and preserves reference prices', async () => {
  await prisma.marketplacePost.updateMany({ data: { status: 'CLOSED' } });
  await fixture({ price: 100 });
  const ton = await fixture({ price: 200000, priceUnit: 'PER_TON' });
  await fixture({ price: 900, isPriceOutlier: true });
  await fixture({ price: 900, createdAt: new Date(Date.now() - 8 * 86400000) });
  const { refreshMarketStats } = loadTs('src/lib/market-stats.ts');
  const run = () => prisma.$transaction(tx => refreshMarketStats(tx), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  assert.equal((await run()).samples, 2);
  const row = await prisma.dailyMarketStat.findFirst();
  assert.equal(Number(row.avgSellPrice), 150); assert.equal(row.samplePostCount, 2);
  await prisma.dailyMarketStat.update({ where: { id: row.id }, data: { officialRefPrice: 125 } });
  await run(); assert.equal(await prisma.dailyMarketStat.count(), 1);
  assert.equal(Number((await prisma.dailyMarketStat.findUnique({ where: { id: row.id } })).officialRefPrice), 125);
  await prisma.marketplacePost.update({ where: { id: ton.post.id }, data: { status: 'CLOSED' } });
  await run(); assert.equal(Number((await prisma.dailyMarketStat.findUnique({ where: { id: row.id } })).avgSellPrice), 100);
  await prisma.marketplacePost.updateMany({ data: { status: 'CLOSED' } });
  await run(); const empty = await prisma.dailyMarketStat.findUnique({ where: { id: row.id } });
  assert.equal(empty.avgSellPrice, null); assert.equal(empty.samplePostCount, 0); assert.equal(Number(empty.officialRefPrice), 125);
});
