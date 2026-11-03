const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./helpers.cjs');

function harness({ anonymous = false, fail = false, activeRole = 'BUYER' } = {}) {
  const queries = [];
  const rows = [
    { id: 3, userId: 10, status: 'CLOSED', createdAt: new Date('2020-01-01') },
    { id: 2, userId: 10, status: 'HIDDEN_BY_ADMIN', createdAt: new Date('2019-01-01') },
    { id: 1, userId: 11, status: 'OPEN', createdAt: new Date() },
  ].map(p => ({ ...p, title: 'test', postType: p.id === 2 ? 'BUY' : 'SELL', price: 100, pricePerKg: null,
    priceUnit: 'LUMP_SUM', quantityKg: null, dryMatterPct: null, availableDate: new Date(),
  }));
  const match = (p, where) => p.userId === where.userId && (!where.status || p.status === where.status) && (!where.postType || p.postType === where.postType);
  const prisma = {
    marketplacePost: {
      findMany: async q => { queries.push(q); return rows.filter(p => match(p, q.where)).slice(q.skip, q.skip + q.take); },
      count: async q => rows.filter(p => match(p, q.where)).length,
    },
    $transaction: async queries => { if (fail) throw new Error('database failed'); return Promise.all(queries); },
  };
  const route = loadTs('src/app/api/posts/mine/route.ts', {
    '@/lib/prisma': { prisma },
    '@/lib/auth': { getCurrentUser: async () => anonymous ? null : { id: 10, fullName: 'Same Name', ratingAvg: 0, activeRole,
      roles: [{ roleType: 'SELLER', businessName: 'Orchard' }, { roleType: 'BUYER', businessName: 'Buying yard' }] } },
  });
  return { queries, get: query => route.GET(new Request(`http://localhost/api/posts/mine?${query || ''}`)) };
}

test('history requires login without querying posts', async () => {
  const h = harness({ anonymous: true });
  assert.equal((await h.get()).status, 401); assert.equal(h.queries.length, 0);
});
test('history retains old closed and hidden posts, scoped to session owner', async () => {
  const h = harness(); const response = await h.get('userId=11&days=7');
  const data = await response.json();
  assert.deepEqual(data.posts.map(p => p.id), [3, 2]);
  assert.equal(data.total, 2); assert.equal(data.hasMore, false);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.deepEqual(JSON.parse(JSON.stringify(h.queries[0].where)), { userId: 10 });
  assert.equal(data.posts[0].price, 100); assert.equal(data.posts[0].priceUnit, 'LUMP_SUM');
  assert.equal(data.posts[0].quantityKg, 0);
});
test('status filter and pagination preserve owner scope and stable ordering', async () => {
  const h = harness(); const data = await (await h.get('status=CLOSED&page=2')).json();
  assert.deepEqual(data.posts, []); assert.equal(data.total, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.queries[0].where)), { userId: 10, status: 'CLOSED' });
  assert.equal(h.queries[0].skip, 20); assert.equal(h.queries[0].take, 20);
  assert.deepEqual(JSON.parse(JSON.stringify(h.queries[0].orderBy)), [{ createdAt: 'desc' }, { id: 'desc' }]);
});
for (const query of ['page=0', 'page=-1', 'page=1.2', 'page=NaN', 'page=100001', 'status=INVALID', 'postType=INVALID']) {
  test(`invalid history query: ${query}`, async () => {
    const h = harness(); assert.equal((await h.get(query)).status, 400); assert.equal(h.queries.length, 0);
  });
}

test('type and status filters compose and remain scoped to the session owner', async () => {
  const h = harness(); const data = await (await h.get('postType=BUY&status=HIDDEN_BY_ADMIN&userId=11')).json();
  assert.deepEqual(data.posts.map(p => p.id), [2]); assert.equal(data.total, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(h.queries[0].where)), { userId: 10, status: 'HIDDEN_BY_ADMIN', postType: 'BUY' });
});

test('historical post roles and business names stay tied to their type after switching', async () => {
  for (const activeRole of ['SELLER', 'BUYER']) {
    const data = await (await harness({ activeRole }).get()).json();
    assert.deepEqual(data.posts.map(p => [p.authorRole, p.businessName]), [['SELLER', 'Orchard'], ['BUYER', 'Buying yard']]);
  }
});
test('database failure returns an error instead of empty history', async () => {
  assert.equal((await harness({ fail: true }).get()).status, 500);
});
test('closed and hidden posts cannot start a negotiation', async () => {
  for (const status of ['CLOSED', 'HIDDEN_BY_ADMIN']) {
    const route = loadTs('src/app/api/chat/rooms/route.ts', {
      '@/lib/auth': { getCurrentUser: async () => ({ id: 11 }) },
      '@/lib/prisma': { prisma: { marketplacePost: { findUnique: async () => ({ id: 3, userId: 10, status }) } } },
    });
    assert.equal((await route.POST(new Request('http://localhost/api/chat/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postId: 3 }),
    }))).status, 409);
  }
});
