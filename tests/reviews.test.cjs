const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { Prisma } = require('@prisma/client');
const { NextResponse } = require('next/server');

// Execute the actual route with isolated database/auth dependencies; no live data changes.
function harness(options = {}) {
  const state = { reviews: [], messages: [], user: null };
  let attempts = 0;
  const prisma = { $transaction: async (run, settings) => {
    assert.equal(settings.isolationLevel, 'Serializable');
    attempts++;
    if (options.conflicts && attempts <= options.conflicts) {
      throw new Prisma.PrismaClientKnownRequestError('conflict', { code: 'P2034', clientVersion: '6' });
    }
    const draft = structuredClone(state);
    const tx = {
      chatRoom: {
        findUnique: async () => options.room === null ? null : { id: 1, postId: 2, initiatorId: 10, ownerId: 20, status: 'DEAL_CLOSED', ...options.room },
        update: async () => { if (options.failLastWrite) throw new Error('write failure'); },
      },
      deal: { findFirst: async ({ where }) => {
        assert.equal(where.status, 'ACCEPTED');
        assert.equal(where.postId, 2);
        assert.deepEqual(JSON.parse(JSON.stringify(where.OR)), [{ initiatorId: 10, receiverId: 20 }, { initiatorId: 20, receiverId: 10 }]);
        return options.noDeal ? null : { id: 3 };
      } },
      userReview: {
        findUnique: async () => options.duplicate ? { id: 4 } : null,
        create: async ({ data }) => {
          if (options.uniqueConflict) throw new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6' });
          draft.reviews.push(data); return { id: 4, ...data };
        },
        aggregate: async () => ({ _avg: { rating: 4.333333 }, _count: { _all: 3 } }),
      },
      user: { update: async ({ data }) => { draft.user = data; } },
      chatMessage: { create: async ({ data }) => { draft.messages.push(data); } },
    };
    const result = await run(tx);
    Object.assign(state, draft);
    return result;
  } };
  const output = ts.transpileModule(readFileSync('src/app/api/reviews/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(output, { exports, console: { error() {} }, require(name) {
    if (name === 'next/server') return { NextResponse };
    if (name === '@prisma/client') return { Prisma };
    if (name === '@/lib/prisma') return { prisma };
    if (name === '@/lib/auth') return { getCurrentUser: async () => options.anonymous ? null : { id: 10 } };
    throw new Error(name);
  } });
  return { state, attempts: () => attempts, post: (changes = {}, raw) => exports.POST(new Request('http://localhost/api/reviews', {
    method: 'POST', body: raw ?? JSON.stringify({ roomId: 1, postId: 2, revieweeId: 20, rating: 5, comment: ' good ', ...changes }),
  })) };
}

test('valid review commits rating and notification together', async () => {
  const h = harness(); const res = await h.post();
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.newRatingAvg, 4.33); assert.equal(data.newRatingCount, 3);
  assert.equal(h.state.reviews[0].comment, 'good');
  assert.equal(h.state.messages.length, 1); assert.equal(h.state.user.ratingAvg, 4.33);
});
for (const [name, options, changes, status] of [
  ['anonymous', { anonymous: true }, {}, 401],
  ['outsider', { room: { initiatorId: 30 } }, {}, 403],
  ['wrong partner', {}, { revieweeId: 30 }, 403],
  ['wrong post', {}, { postId: 9 }, 403],
  ['missing room', { room: null }, {}, 404],
  ['active room', { room: { status: 'ACTIVE' } }, {}, 400],
  ['archived room', { room: { status: 'ARCHIVED' } }, {}, 400],
  ['no accepted deal / legacy room', { noDeal: true }, {}, 400],
  ['duplicate', { duplicate: true }, {}, 409],
  ['concurrent duplicate', { uniqueConflict: true }, {}, 409],
  ['fractional rating', {}, { rating: 2.5 }, 400],
  ['self review', {}, { revieweeId: 10 }, 400],
  ['missing room id', {}, { roomId: null }, 400],
  ['invalid id', {}, { postId: true }, 400],
  ['invalid comment', {}, { comment: {} }, 400],
  ['long comment', {}, { comment: 'x'.repeat(5001) }, 400],
]) test(name, async () => {
  const h = harness(options); assert.equal((await h.post(changes)).status, status);
  assert.equal(h.state.reviews.length, 0); assert.equal(h.state.messages.length, 0);
});
test('malformed JSON returns 400', async () => {
  assert.equal((await harness().post({}, '{')).status, 400);
});
test('later failure leaves no committed review or rating', async () => {
  const h = harness({ failLastWrite: true }); assert.equal((await h.post()).status, 500);
  assert.deepEqual(h.state, { reviews: [], messages: [], user: null });
});
test('serialization conflict retries and commits once', async () => {
  const h = harness({ conflicts: 1 }); assert.equal((await h.post()).status, 200);
  assert.equal(h.attempts(), 2); assert.equal(h.state.reviews.length, 1);
});
test('persistent conflict stops after three attempts', async () => {
  const h = harness({ conflicts: 3 }); assert.equal((await h.post()).status, 409);
  assert.equal(h.attempts(), 3); assert.equal(h.state.reviews.length, 0);
});
