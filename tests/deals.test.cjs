const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { loadTs, request } = require('./helpers.cjs');

function harness(options = {}) {
  const state = { status: 'OPEN', deals: [], messages: [], rooms: [] };
  let attempts = 0;
  const prisma = { $transaction: async (run, settings) => {
    assert.equal(settings.isolationLevel, 'Serializable');
    attempts++;
    if (attempts <= (options.conflicts || 0)) throw new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: '6' });
    const draft = structuredClone(state);
    const tx = {
      chatRoom: {
        findUnique: async () => options.noRoom ? null : { id: 1, postId: 2, initiatorId: 10, ownerId: 20, status: 'ACTIVE', ...options.room },
        findMany: async ({ where }) => { assert.equal(where.status, 'ACTIVE'); return [{ id: 9 }]; },
        update: async ({ where, data }) => { if (options.failLater && where.id === 9) throw new Error('failure'); draft.rooms.push({ id: where.id, ...data }); },
      },
      marketplacePost: {
        findUnique: async () => options.noPost ? null : { id: 2, userId: 20, title: 'Test', ...options.post },
        updateMany: async ({ where }) => { assert.equal(where.status, 'OPEN'); if (options.claimLost) return { count: 0 }; draft.status = 'CLOSED'; return { count: 1 }; },
      },
      deal: { create: async ({ data }) => { draft.deals.push(data); return { id: 3, ...data }; } },
      chatMessage: { create: async ({ data }) => { draft.messages.push(data); } },
    };
    const result = await run(tx); Object.assign(state, draft); return result;
  } };
  const route = loadTs('src/app/api/deals/route.ts', { '@/lib/prisma': { prisma }, '@/lib/auth': { getCurrentUser: async () => options.anonymous ? null : { id: 10 } } });
  return { state, attempts: () => attempts, post: (changes = {}, raw) => route.POST(request({ roomId: 1, postId: 2, receiverId: 20, agreedPrice: 1000, ...changes }, raw)) };
}

test('deal commits post, agreement, winning room, and archived rooms together', async () => {
  const h = harness(); assert.equal((await h.post()).status, 200);
  assert.equal(h.state.status, 'CLOSED'); assert.equal(h.state.deals.length, 1);
  assert.equal(h.state.deals[0].agreedPricePerKg, null);
  assert.deepEqual(h.state.rooms.map(r => r.status), ['DEAL_CLOSED', 'ARCHIVED']);
  assert.equal(h.state.messages.length, 2);
});
for (const [name, options, changes, status] of [
  ['anonymous', { anonymous: true }, {}, 401],
  ['missing room', { noRoom: true }, {}, 404],
  ['outsider', { room: { initiatorId: 30 } }, {}, 403],
  ['wrong partner', {}, { receiverId: 30 }, 403],
  ['wrong post', {}, { postId: 99 }, 403],
  ['wrong post owner', { post: { userId: 99 } }, {}, 403],
  ['missing post', { noPost: true }, {}, 404],
  ['closed room', { room: { status: 'DEAL_CLOSED' } }, {}, 409],
  ['archived room', { room: { status: 'ARCHIVED' } }, {}, 409],
  ['closed or hidden post / concurrent claim lost', { claimLost: true }, {}, 409],
  ['room required', {}, { roomId: null }, 400],
  ['self deal', {}, { receiverId: 10 }, 400],
  ['negative price', {}, { agreedPrice: -1 }, 400],
  ['boolean price', {}, { agreedPrice: true }, 400],
  ['infinite price', {}, { agreedPrice: 'Infinity' }, 400],
  ['price exceeds decimal column', {}, { agreedPrice: 100000000 }, 400],
  ['fractional cents', {}, { agreedPrice: 1.001 }, 400],
  ['negative optional price', {}, { agreedPricePerKg: -1 }, 400],
  ['zero quantity', {}, { agreedQuantityKg: 0 }, 400],
  ['invalid date', {}, { cutDate: '2026-02-30' }, 400],
  ['invalid note', {}, { note: {} }, 400],
]) test(`deal rejects ${name}`, async () => {
  const h = harness(options); assert.equal((await h.post(changes)).status, status);
  assert.deepEqual(h.state, { status: 'OPEN', deals: [], messages: [], rooms: [] });
});
test('deal rejects malformed JSON', async () => assert.equal((await harness().post({}, '{')).status, 400));
test('deal rolls back all writes when a later broadcast fails', async () => {
  const h = harness({ failLater: true }); assert.equal((await h.post()).status, 500);
  assert.deepEqual(h.state, { status: 'OPEN', deals: [], messages: [], rooms: [] });
});
test('deal retries serialization failure and commits once', async () => {
  const h = harness({ conflicts: 1 }); assert.equal((await h.post()).status, 200);
  assert.equal(h.attempts(), 2); assert.equal(h.state.deals.length, 1);
});
test('deal stops after three serialization failures', async () => {
  const h = harness({ conflicts: 3 }); assert.equal((await h.post()).status, 409); assert.equal(h.attempts(), 3);
});
