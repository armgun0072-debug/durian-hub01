const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NextResponse } = require('next/server');
const { loadTs } = require('./helpers.cjs');
function harness(user, findMany) {
  return loadTs('src/app/api/support/rooms/route.ts', {
    '@/lib/auth': { getCurrentUser: async () => user }, '@/lib/prisma': { prisma: { chatRoom: { findMany } } }, 'next/server': { NextResponse },
  });
}
test('support room picker denies anonymous access', async () => {
  const api = harness(null, () => { throw new Error('should not query'); });
  assert.equal((await api.GET(new Request('http://test/api/support/rooms'))).status, 401);
});
test('support room picker scopes participants and private tickets server-side', async () => {
  let query;
  const api = harness({ id: 10 }, async args => { query = args; return [{ id: 1, initiatorId: 10, initiator: { fullName: 'Me' }, owner: { fullName: 'Partner' }, supportTickets: [], post: { title: 'Test' } }]; });
  const response = await api.GET(new Request('http://test/api/support/rooms?roomId=1'));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.deepEqual(JSON.parse(JSON.stringify(query.where.OR)), [{ initiatorId: 10 }, { ownerId: 10 }]);
  assert.equal(query.select.supportTickets.where.requesterId, 10);
  assert.equal(query.where.id, 1);
  assert.equal((await response.json()).rooms[0].partnerName, 'Partner');
});
test('support room picker validates cursors and limits pagination', async () => {
  const api = harness({ id: 10 }, async query => { assert.equal(query.where.id.lt, 20); return []; });
  assert.equal((await api.GET(new Request('http://test/api/support/rooms?cursor=-1'))).status, 400);
  assert.equal((await api.GET(new Request('http://test/api/support/rooms?cursor=20'))).status, 200);
});
