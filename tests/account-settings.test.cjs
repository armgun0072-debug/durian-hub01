const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, request } = require('./helpers.cjs');

function profileHarness({ anonymous = false, revoked = false, failRead = false } = {}) {
  let user = { id: 10, fullName: 'Account Name', email: 'private@example.test', phone: '0800000000',
    passwordHash: 'secret', activeRole: 'SELLER', locationId: 1, location: { id: 1, province: 'จันทบุรี', district: 'ขลุง' },
    emailVerifiedAt: new Date(), ratingAvg: 4.5, ratingCount: 2, trustScore: 90, avatarUrl: null,
    roles: [{ id: 1, roleType: 'SELLER', status: 'ACTIVE', businessName: 'Orchard', description: '', isVerified: true },
      { id: 2, roleType: 'BUYER', status: 'ACTIVE', businessName: 'Yard', description: '', isVerified: false },
      { id: 3, roleType: 'CUTTER', status: 'PENDING_APPROVAL', businessName: 'Crew', description: '' }] };
  const writes = [];
  const tx = {
    userRole: { updateMany: async ({ where, data }) => {
      assert.equal(where.userId, 10); assert.equal(where.status, 'ACTIVE');
      if (revoked) return { count: 0 };
      const role = user.roles.find(r => r.id === where.id); Object.assign(role, data); writes.push({ role: role.roleType, ...data }); return { count: 1 };
    } },
    user: { findUnique: async ({ where }) => { assert.equal(where.id, 10); return user; } },
  };
  const prisma = {
    location: {
      findMany: async () => { if (failRead) throw new Error('DB'); return [{ province: 'จันทบุรี' }, { province: 'ยะลา' }]; },
      findFirst: async ({ where }) => where.province === 'ยะลา' ? { id: 2, province: 'ยะลา' } : null,
    },
    roleVerificationRequest: { findMany: async ({ where }) => { assert.equal(where.userId, 10); return [{ id: 5, requestedRole: 'CUTTER', status: 'REJECTED', adminRemark: 'Please resubmit' }]; } },
    user: { update: async ({ where, data }) => { assert.equal(where.id, 10); writes.push(data); user = { ...user, ...data, location: data.locationId === 2 ? { id: 2, province: 'ยะลา' } : data.locationId === null ? null : user.location }; return user; } },
    $transaction: async run => run(tx),
  };
  const route = loadTs('src/app/api/user/profile/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => anonymous ? null : user }, '@/lib/prisma': { prisma },
  });
  return { writes, get: () => route.GET(), patch: (body, raw) => route.PATCH(request(body, raw)), user: () => user };
}

test('account GET is private, scoped, and does not expose password hashes', async () => {
  const response = await profileHarness().get(); const data = await response.json();
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  assert.equal(data.user.id, 10); assert.equal(data.user.isEmailVerified, true);
  assert.equal(data.user.rating, 4.5); assert.equal(data.user.passwordHash, undefined);
  assert.deepEqual(data.provinces, ['จันทบุรี', 'ยะลา']); assert.equal(data.requests[0].adminRemark, 'Please resubmit');
  assert.equal(data.user.roles[0].id, undefined);
});
test('anonymous accounts cannot read or mutate profiles', async () => {
  const h = profileHarness({ anonymous: true }); assert.equal((await h.get()).status, 401);
  assert.equal((await h.patch({ section: 'personal' })).status, 401); assert.equal(h.writes.length, 0);
});
test('personal update preserves contact fields, roles, and district if province unchanged', async () => {
  const h = profileHarness(); const response = await h.patch({ section: 'personal', fullName: ' New Name ', province: 'จันทบุรี' });
  assert.equal(response.status, 200); const { user } = await response.json();
  assert.equal(user.fullName, 'New Name'); assert.equal(user.phone, '0800000000'); assert.equal(user.businessName, 'Orchard');
  assert.equal(h.user().location.district, 'ขลุง'); assert.equal(h.writes[0].locationId, 1);
});
test('account province can only link to existing locations', async () => {
  const h = profileHarness(); assert.equal((await h.patch({ section: 'personal', fullName: 'Name', province: 'ยะลา' })).status, 200);
  assert.equal(h.user().locationId, 2); assert.equal(h.user().location.province, 'ยะลา');
  assert.equal((await h.patch({ section: 'personal', fullName: 'Name', province: 'made-up' })).status, 400); assert.equal(h.writes.length, 1);
});
test('editing the buyer business does not change seller business or active role', async () => {
  const h = profileHarness(); const response = await h.patch({ section: 'business', roleType: 'BUYER', businessName: ' New Yard ', description: ' Buying durians ' });
  assert.equal(response.status, 200); const { user } = await response.json();
  assert.equal(user.activeRole, 'SELLER'); assert.equal(user.businessName, 'Orchard');
  assert.equal(user.roles[0].businessName, 'Orchard'); assert.equal(user.roles[1].businessName, 'New Yard');
  assert.equal(user.roles[1].description, 'Buying durians');
});
for (const [label, body, status] of [
  ['unowned role', { section: 'business', roleType: 'ADMIN', businessName: 'Name', description: '' }, 403],
  ['pending role', { section: 'business', roleType: 'CUTTER', businessName: 'Name', description: '' }, 403],
  ['phone change', { section: 'personal', fullName: 'Name', province: '', phone: '0999999999' }, 400],
  ['email change', { section: 'personal', fullName: 'Name', province: '', email: 'other@example.test' }, 400],
  ['owner injection', { section: 'business', roleType: 'BUYER', businessName: 'Name', description: '', userId: 11 }, 400],
  ['mixed section', { section: 'business', roleType: 'BUYER', businessName: 'Name', description: '', fullName: 'Other' }, 400],
  ['long description', { section: 'business', roleType: 'BUYER', businessName: 'Name', description: 'x'.repeat(2001) }, 400],
  ['blank name', { section: 'personal', fullName: ' ', province: '' }, 400],
  ['wrong name type', { section: 'personal', fullName: 123, province: '' }, 400],
  ['old unscoped form', { fullName: 'Name', businessName: 'Other' }, 400],
]) test(`profile rejects ${label} before writes`, async () => {
  const h = profileHarness(); assert.equal((await h.patch(body)).status, status); assert.equal(h.writes.length, 0);
});
test('invalid profile JSON and database failures are explicit errors', async () => {
  assert.equal((await profileHarness().patch({}, '{')).status, 400);
  assert.equal((await profileHarness({ failRead: true }).get()).status, 500);
});
test('revoked role cannot be saved even if approved at the start of the request', async () => {
  const h = profileHarness({ revoked: true });
  assert.equal((await h.patch({ section: 'business', roleType: 'BUYER', businessName: 'Name', description: '' })).status, 409);
  assert.equal(h.writes.length, 0);
});

function passwordHarness({ anonymous = false, conflict = false, fail = false } = {}) {
  const writes = [], cleared = [];
  const route = loadTs('src/app/api/user/password/route.ts', {
    '@/lib/auth': {
      getCurrentUser: async () => anonymous ? null : { id: 10, passwordHash: 'original-hash' },
      verifyPassword: async password => password === 'old-password', hashPassword: async value => `hash:${value}`,
      clearSessionCookie: async () => cleared.push('user'), clearAdminSessionCookie: async () => cleared.push('admin'),
    },
    '@/lib/prisma': { prisma: { user: { updateMany: async query => {
      if (fail) throw new Error('DB'); if (conflict) return { count: 0 }; writes.push(query); return { count: 1 };
    } } } },
  });
  return { writes, cleared, post: (body = {}, raw) => route.POST(request({ currentPassword: 'old-password', newPassword: 'new-password', ...body }, raw)) };
}
test('password change requires current credentials and only updates the session owner', async () => {
  const h = passwordHarness(); const response = await h.post({ userId: 99 });
  assert.equal(response.status, 200); assert.equal(h.writes[0].where.id, 10);
  assert.equal(h.writes[0].where.passwordHash, 'original-hash'); assert.equal(h.writes[0].where.status, 'ACTIVE');
  assert.equal(h.writes[0].data.passwordHash, 'hash:new-password'); assert.deepEqual(h.cleared, ['user', 'admin']);
  assert.deepEqual(await response.json(), { success: true });
});
for (const [label, body] of [
  ['wrong current password', { currentPassword: 'wrong' }], ['short new password', { newPassword: 'short' }],
  ['same password', { newPassword: 'old-password' }], ['non-string input', { currentPassword: {} }],
  ['bcrypt byte limit', { newPassword: 'ก'.repeat(25) }],
]) test(`password rejects ${label} without writes or logout`, async () => {
  const h = passwordHarness(); assert.equal((await h.post(body)).status, 400); assert.equal(h.writes.length, 0); assert.equal(h.cleared.length, 0);
});
test('password throttles repeated wrong current passwords', async () => {
  const h = passwordHarness(); for (let i = 0; i < 5; i++) assert.equal((await h.post({ currentPassword: 'wrong' })).status, 400);
  const response = await h.post(); assert.equal(response.status, 429); assert.ok(Number(response.headers.get('Retry-After')) > 0);
  assert.equal(h.writes.length, 0); assert.equal(h.cleared.length, 0);
});
test('password handles anonymous, concurrent change, malformed JSON, and DB failure', async () => {
  assert.equal((await passwordHarness({ anonymous: true }).post()).status, 401);
  assert.equal((await passwordHarness().post({}, '{')).status, 400);
  for (const [options, status] of [[{ conflict: true }, 409], [{ fail: true }, 500]]) {
    const h = passwordHarness(options); assert.equal((await h.post()).status, status); assert.equal(h.cleared.length, 0);
  }
});

function avatarHarness(anonymous = false) {
  const writes = [], files = [];
  const route = loadTs('src/app/api/user/avatar/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => anonymous ? null : { id: 10 } },
    '@/lib/prisma': { prisma: { user: { update: async ({ where, data }) => { assert.equal(where.id, 10); writes.push(data); return data; } } } },
    'fs/promises': { mkdir: async () => {}, writeFile: async (path, buffer) => files.push({ path, buffer }) },
  });
  return { writes, files, remove: () => route.DELETE(), upload: (bytes, type, filename = 'picture.png') => {
    const form = new FormData(); form.append('file', new Blob([bytes], { type }), filename);
    return route.POST(new Request('http://localhost/api/user/avatar', { method: 'POST', body: form }));
  }, preset: () => { const form = new FormData(); form.append('preset', 'https://example.test/person.jpg'); return route.POST(new Request('http://localhost', { method: 'POST', body: form })); } };
}
test('avatar removal clears only the owner image reference', async () => {
  const h = avatarHarness(); assert.equal((await h.remove()).status, 200); assert.equal(h.writes.length, 1); assert.equal(h.writes[0].avatarUrl, null); assert.equal(h.files.length, 0);
  assert.equal((await avatarHarness(true).remove()).status, 401);
});
test('avatar upload chooses extension from actual content instead of the supplied filename', async () => {
  const h = avatarHarness(); const response = await h.upload(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0]), 'image/png', '../../payload.html');
  assert.equal(response.status, 200); assert.match((await response.json()).avatarUrl, /^\/uploads\/avatars\/avatar_10_[a-f0-9-]+\.png$/);
  assert.equal(h.files.length, 1); assert.ok(!h.files[0].path.includes('payload'));
});
test('avatar rejects untrusted presets, MIME mismatch, empty and oversized files', async () => {
  const h = avatarHarness(); assert.equal((await h.preset()).status, 400);
  for (const [bytes, type] of [['html', 'image/png'], ['', 'image/png'], ['svg', 'image/svg+xml'], [new Uint8Array(5 * 1024 * 1024 + 1), 'image/png']]) {
    assert.equal((await h.upload(bytes, type)).status, 400);
  }
  assert.equal(h.writes.length, 0); assert.equal(h.files.length, 0);
});
