const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, request } = require('./helpers.cjs');

function postHarness(activeRole, roles, anonymous = false) {
  const writes = [];
  const route = loadTs('src/app/api/posts/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => anonymous ? null : { id: 10, activeRole, roles, locationId: 1 } },
    '@/lib/prisma': { prisma: { marketplacePost: { create: async ({ data }) => { writes.push(data); return data; } } } },
  });
  return { writes, post: postType => route.POST(request({ title: 'Test', price: 100, postType })) };
}
const approved = roleType => ({ roleType, status: 'ACTIVE' });
for (const [role, type] of [['SELLER', 'SELL'], ['BUYER', 'BUY'], ['CUTTER', 'CUT_SERVICE']]) {
  test(`${role} can post its own type with an approved active role`, async () => {
    const h = postHarness(role, [approved(role)]);
    assert.equal((await h.post(type)).status, 200);
    assert.equal(h.writes.length, 1); assert.equal(h.writes[0].postType, type); assert.equal(h.writes[0].userId, 10);
  });
}
for (const [name, activeRole, roles, type, status] of [
  ['single-role cross-category', 'SELLER', [approved('SELLER')], 'BUY', 403],
  ['two roles without switching', 'SELLER', [approved('SELLER'), approved('BUYER')], 'BUY', 403],
  ['pending role', 'BUYER', [{ roleType: 'BUYER', status: 'PENDING' }], 'BUY', 403],
  ['active role without approval', 'SELLER', [], 'SELL', 403],
  ['admin membership cannot bypass posting role', 'SELLER', [approved('SELLER'), approved('ADMIN')], 'BUY', 403],
  ['invalid type', 'SELLER', [approved('SELLER')], 'OTHER', 400],
  ['missing type', 'SELLER', [approved('SELLER')], undefined, 400],
]) test(`rejects ${name} before writing`, async () => {
  const h = postHarness(activeRole, roles);
  assert.equal((await h.post(type)).status, status); assert.equal(h.writes.length, 0);
});
test('anonymous users cannot publish', async () => {
  const h = postHarness('SELLER', [], true);
  assert.equal((await h.post('SELL')).status, 401); assert.equal(h.writes.length, 0);
});

test('switching role refreshes the session and business identity without logging out', async () => {
  let activeRole = 'SELLER'; const signed = [], cookies = [];
  const roles = [approved('SELLER'), { ...approved('BUYER'), businessName: 'Buying yard' }, { roleType: 'CUTTER', status: 'PENDING' }];
  const route = loadTs('src/app/api/user/active-role/route.ts', {
    '@/lib/auth': {
      getCurrentUser: async () => ({ id: 10, fullName: 'Name', roles, activeRole }),
      signSessionToken: async payload => { signed.push(payload); return 'new-session'; },
      setSessionCookie: async token => cookies.push(token),
    },
    '@/lib/prisma': { prisma: { user: { update: async ({ data }) => { activeRole = data.activeRole; return { id: 10, activeRole }; } } } },
  });
  const response = await route.PATCH(request({ activeRole: 'BUYER' }));
  assert.equal(response.status, 200); assert.equal(activeRole, 'BUYER');
  assert.equal((await response.json()).businessName, 'Buying yard');
  assert.equal(signed[0].activeRole, 'BUYER'); assert.deepEqual(cookies, ['new-session']);
  assert.equal((await route.PATCH(request({ activeRole: 'CUTTER' }))).status, 403);
  assert.equal((await route.PATCH(request({ activeRole: 'ADMIN' }))).status, 403);
  assert.equal(signed.length, 1); assert.equal(activeRole, 'BUYER');
  const h = postHarness(activeRole, roles);
  assert.equal((await h.post('BUY')).status, 200);
});

test('market browsing is public and post identity does not follow the owner active role', async () => {
  let query;
  const route = loadTs('src/app/api/posts/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => { throw new Error('public browsing should not need login'); } },
    '@/lib/prisma': { prisma: { marketplacePost: { findMany: async q => {
      query = q;
      return [{ id: 1, userId: 10, postType: 'BUY', price: 100, images: [], createdAt: new Date(),
        user: { fullName: 'Name', activeRole: 'SELLER', roles: [{ roleType: 'SELLER', businessName: 'Orchard' }, { roleType: 'BUYER', businessName: 'Buying yard' }] } }];
    } } } },
  });
  const response = await route.GET(new Request('http://localhost/api/posts?postType=BUY'));
  assert.equal(response.status, 200); assert.equal(query.where.postType, 'BUY');
  const { posts } = await response.json();
  assert.equal(posts[0].authorRole, 'BUYER'); assert.equal(posts[0].businessName, 'Buying yard');
});
