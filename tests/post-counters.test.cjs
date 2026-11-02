const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, request } = require('./helpers.cjs');

function reportHarness(options = {}) {
  const state = { count: 0, reports: [] };
  const prisma = { $transaction: async (run) => {
    const draft = structuredClone(state);
    const result = await run({
      marketplacePost: {
        findUnique: async () => options.noPost ? null : { userId: 20, status: 'OPEN', ...options.post },
        update: async ({ data }) => { if (options.failCounter) throw new Error('failure'); draft.count += data.reportCount.increment; },
      },
      postReport: { create: async ({ data }) => { if (options.failInsert) throw new Error('insert failure'); draft.reports.push(data); return data; } },
    });
    Object.assign(state, draft); return result;
  } };
  const route = loadTs('src/app/api/posts/[id]/report/route.ts', { '@/lib/prisma': { prisma }, '@/lib/auth': { getCurrentUser: async () => options.anonymous ? null : { id: 10 } } });
  return { state, post: (changes = {}, id = '2', raw) => route.POST(request({ reason: 'SPAM', detail: ' test ', ...changes }, raw), { params: Promise.resolve({ id }) }) };
}
test('report and count commit together', async () => {
  const h = reportHarness(); assert.equal((await h.post()).status, 200);
  assert.equal(h.state.count, 1); assert.equal(h.state.reports[0].detail, 'test');
});
for (const [name, options, changes, id, status] of [
  ['anonymous', { anonymous: true }, {}, '2', 401],
  ['bad id', {}, {}, '2junk', 400],
  ['missing post', { noPost: true }, {}, '2', 404],
  ['hidden post', { post: { status: 'HIDDEN_BY_ADMIN' } }, {}, '2', 404],
  ['own post', { post: { userId: 10 } }, {}, '2', 400],
  ['unknown reason', {}, { reason: 'OTHER' }, '2', 400],
  ['invalid detail', {}, { detail: {} }, '2', 400],
  ['oversize detail', {}, { detail: 'x'.repeat(5001) }, '2', 400],
  ['counter failure', { failCounter: true }, {}, '2', 500],
  ['insert failure after increment', { failInsert: true }, {}, '2', 500],
]) test(`report rejects ${name} without partial writes`, async () => {
  const h = reportHarness(options); assert.equal((await h.post(changes, id)).status, status);
  assert.deepEqual(h.state, { count: 0, reports: [] });
});
test('report rejects malformed JSON', async () => assert.equal((await reportHarness().post({}, '2', '{')).status, 400));

test('view uses an atomic increment restricted to public posts', async () => {
  let calls = 0;
  const route = loadTs('src/app/api/posts/[id]/view/route.ts', { '@/lib/prisma': { prisma: { marketplacePost: { updateMany: async ({ where, data }) => {
    assert.equal(where.id, 2); assert.deepEqual([...where.status.in], ['OPEN', 'CLOSED']); assert.equal(data.viewCount.increment, 1); calls++;
    return { count: 1 };
  } } } } });
  assert.equal((await route.POST(request({}), { params: Promise.resolve({ id: '2' }) })).status, 200); assert.equal(calls, 1);
  assert.equal((await route.POST(request({}), { params: Promise.resolve({ id: '2x' }) })).status, 400); assert.equal(calls, 1);
});
test('view returns 404 for missing or hidden posts', async () => {
  const route = loadTs('src/app/api/posts/[id]/view/route.ts', { '@/lib/prisma': { prisma: { marketplacePost: { updateMany: async () => ({ count: 0 }) } } } });
  assert.equal((await route.POST(request({}), { params: Promise.resolve({ id: '2' }) })).status, 404);
});
