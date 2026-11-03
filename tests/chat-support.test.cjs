const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextResponse } = require('next/server');
const { loadTs, request } = require('./helpers.cjs');
const { chatHistory, CHAT_HISTORY_MS } = loadTs('src/lib/chat-history.ts');

test('history begins exactly 168 hours after closing and ignores message activity', () => {
  const closed = new Date('2026-11-01T05:00:00Z');
  assert.equal(chatHistory(closed, +closed + CHAT_HISTORY_MS - 1).isHistory, false);
  assert.equal(chatHistory(closed, +closed + CHAT_HISTORY_MS).isHistory, true);
  assert.equal(chatHistory(closed, +closed + CHAT_HISTORY_MS + 1).isHistory, true);
  assert.equal(chatHistory(null).isHistory, false);
});

function supportHarness({ user = { id: 10 }, admin = null, owner = 10, resolved = false } = {}) {
  const writes = [];
  const tx = {
    supportTicket: {
      findFirst: async ({ where }) => where.requesterId && where.requesterId !== owner ? null : { id: 1, status: resolved ? 'RESOLVED' : admin ? 'IN_PROGRESS' : 'OPEN', handledById: admin?.id },
      update: async args => writes.push(args),
    },
    supportMessage: { create: async args => writes.push(args) },
  };
  const prisma = {
    ...tx,
    chatRoom: { findUnique: async () => ({ id: 1, initiatorId: owner, ownerId: 20 }) },
    supportTicket: { ...tx.supportTicket, create: async args => { writes.push(args); return { id: 1 }; } },
    $transaction: async run => run(tx),
  };
  const api = loadTs('src/lib/support.ts', {
    '@/lib/prisma': { prisma }, '@/lib/auth': { getCurrentUser: async () => user, getAdminUser: async () => admin }, 'next/server': { NextResponse },
  });
  return { ...api, writes };
}
test('anonymous user cannot open support', async () => {
  const h = supportHarness({ user: null });
  assert.equal((await h.createSupport(request({ roomId: 1, category: 'OTHER', content: 'help' }))).status, 401);
  assert.equal(h.writes.length, 0);
});
test('nonparticipant cannot create a ticket for another room', async () => {
  const h = supportHarness({ owner: 30 });
  assert.equal((await h.createSupport(request({ roomId: 1, category: 'OTHER', content: 'help' }))).status, 403);
  assert.equal(h.writes.length, 0);
});
test('participant creates ticket with private initial message', async () => {
  const h = supportHarness();
  assert.equal((await h.createSupport(request({ roomId: 1, category: 'PAYMENT', content: 'help' }))).status, 200);
  assert.equal(h.writes[0].data.requesterId, 10);
  assert.equal(h.writes[0].data.messages.create.senderId, 10);
});
test('another user cannot reply to a private ticket', async () => {
  const h = supportHarness({ owner: 30 });
  assert.equal((await h.updateSupport(request({ content: 'reply' }), '1')).status, 404);
  assert.equal(h.writes.length, 0);
});
test('user cannot resolve tickets or impersonate admin', async () => {
  const h = supportHarness();
  assert.equal((await h.updateSupport(request({ status: 'RESOLVED', resolution: 'done' }), '1')).status, 400);
  assert.equal((await h.updateSupport(request({ content: 'reply' }), '1', true)).status, 401);
  assert.equal(h.writes.length, 0);
});
test('admin closure requires a resolution and records actor and outcome', async () => {
  const h = supportHarness({ admin: { id: 99 } });
  assert.equal((await h.updateSupport(request({ status: 'RESOLVED' }), '1', true)).status, 400);
  assert.equal((await h.updateSupport(request({ status: 'RESOLVED', resolution: 'contacted both parties' }), '1', true)).status, 200);
  assert.equal(h.writes[0].where.status, 'IN_PROGRESS');
  assert.equal(h.writes[1].data.isAdmin, true);
});

test('sending more details does not reset queuedAt and reopening returns to queue', async () => {
  const h = supportHarness();
  assert.equal((await h.updateSupport(request({ content: 'more details' }), '1')).status, 200);
  assert.equal(Object.hasOwn(h.writes[0].data, 'queuedAt'), false);
  const reopened = supportHarness({ resolved: true });
  assert.equal((await reopened.updateSupport(request({ status: 'OPEN' }), '1')).status, 200);
  assert.ok(reopened.writes[0].data.queuedAt instanceof Date);
  assert.equal(reopened.writes[0].data.handledById, null);
});

test('claim requires admin and uses FIFO with atomic status guard', async () => {
  assert.equal((await supportHarness().claimNextSupport()).status, 401);
  let claimed;
  const api = loadTs('src/lib/support.ts', {
    '@/lib/auth': { getAdminUser: async () => ({ id: 99 }) },
    '@/lib/prisma': { prisma: { $transaction: async run => run({
      supportTicket: {
        findFirst: async query => { assert.equal(query.orderBy[0].queuedAt, 'asc'); assert.equal(query.orderBy[1].id, 'asc'); return { id: 7 }; },
        updateMany: async query => { claimed = query; return { count: 1 }; },
      }, supportMessage: { create: async () => {} },
    }) } }, 'next/server': { NextResponse },
  });
  const response = await api.claimNextSupport();
  assert.equal(response.status, 200);
  assert.equal(claimed.where.status, 'OPEN');
  assert.equal(claimed.data.handledById, 99);
});

test('another admin cannot reply to someone else assigned ticket', async () => {
  const api = loadTs('src/lib/support.ts', {
    '@/lib/auth': { getAdminUser: async () => ({ id: 99 }) },
    '@/lib/prisma': { prisma: { $transaction: async run => run({
      supportTicket: { findFirst: async () => ({ id: 1, status: 'IN_PROGRESS', handledById: 88 }) },
    }) } }, 'next/server': { NextResponse },
  });
  assert.equal((await api.updateSupport(request({ content: 'reply' }), '1', true)).status, 409);
  assert.equal((await api.updateSupport(request({ status: 'IN_PROGRESS' }), '1', true)).status, 400);
});
test('resolved requests reject messages until requester reopens', async () => {
  const h = supportHarness({ resolved: true });
  assert.equal((await h.updateSupport(request({ content: 'more help' }), '1')).status, 409);
  assert.equal((await h.updateSupport(request({ status: 'OPEN' }), '1')).status, 200);
});
test('expired partner chat blocks API sends before any write', async () => {
  const api = loadTs('src/app/api/chat/rooms/[id]/messages/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => ({ id: 10 }) },
    '@/lib/prisma': { prisma: { chatRoom: { findUnique: async () => ({ initiatorId: 10, ownerId: 20, closedAt: new Date(Date.now() - CHAT_HISTORY_MS) }) } } },
    'next/server': { NextResponse },
  });
  assert.equal((await api.POST(request({ content: 'hello' }), { params: Promise.resolve({ id: '1' }) })).status, 403);
});

test('room expiring after initial read still blocks at database write', async () => {
  let creates = 0;
  const api = loadTs('src/app/api/chat/rooms/[id]/messages/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => ({ id: 10 }) },
    '@/lib/prisma': { prisma: {
      chatRoom: { findUnique: async () => ({ initiatorId: 10, ownerId: 20, closedAt: new Date(Date.now() - CHAT_HISTORY_MS + 60000) }) },
      $transaction: async run => run({ chatRoom: { updateMany: async () => ({ count: 0 }) }, chatMessage: { create: async () => { creates++; } } }),
    } }, 'next/server': { NextResponse },
  });
  assert.equal((await api.POST(request({ content: 'hello' }), { params: Promise.resolve({ id: '1' }) })).status, 403);
  assert.equal(creates, 0);
});

test('unexpired partner chat sends and uses fixed closedAt cutoff', async () => {
  const writes = [];
  const api = loadTs('src/app/api/chat/rooms/[id]/messages/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => ({ id: 10, fullName: 'Buyer' }) },
    '@/lib/prisma': { prisma: {
      chatRoom: { findUnique: async () => ({ initiatorId: 10, ownerId: 20, closedAt: new Date() }) },
      $transaction: async run => run({
        chatRoom: { updateMany: async args => { writes.push(args); return { count: 1 }; } },
        chatMessage: { create: async ({ data }) => ({ ...data, id: 1, createdAt: new Date() }) },
      }),
    } }, 'next/server': { NextResponse },
  });
  assert.equal((await api.POST(request({ content: 'hello' }), { params: Promise.resolve({ id: '1' }) })).status, 200);
  assert.equal(writes[0].where.OR[0].closedAt, null);
  assert.ok(writes[0].where.OR[1].closedAt.gt instanceof Date);
  assert.equal(Object.hasOwn(writes[0].data, 'closedAt'), false);
});
