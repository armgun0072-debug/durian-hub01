const assert = require('node:assert/strict');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();
const root = 'http://127.0.0.1:3000';

async function api(path, options = {}) {
  const headers = options.cookie ? { cookie: options.cookie } : {};
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(root + path, {
    method: options.method ?? (options.body ? 'POST' : 'GET'), headers,
    body: options.body instanceof FormData ? options.body : options.body && JSON.stringify(options.body),
  });
  return { status: response.status, data: response.headers.get('content-type')?.includes('application/json') ? await response.json() : null,
    cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

async function run() {
  assert.equal(new URL(process.env.DATABASE_URL).pathname, '/moderation_test');
  const tag = Date.now();
  const password = 'FixtureOnly123!';
  const hash = await bcrypt.hash(password, 8);
  async function user(label, role) {
    const email = label + tag + '@example.invalid';
    const row = await db.user.create({ data: { email, phone: label + tag, fullName: label, passwordHash: hash,
      emailVerifiedAt: new Date(), activeRole: role, roles: { create: { roleType: role, isPrimaryRole: true } } } });
    const session = await api(role === 'ADMIN' ? '/api/admin/auth/login' : '/api/auth/login', {
      body: { identifier: email, password, roleSelect: role },
    });
    assert.equal(session.status, 200, JSON.stringify(session.data));
    return { id: row.id, cookie: session.cookie };
  }
  const [seller, buyer, outsider, admin, otherAdmin] = await Promise.all([
    user('seller','SELLER'), user('buyer','BUYER'), user('outsider','BUYER'), user('admin','ADMIN'), user('otherAdmin','ADMIN'),
  ]);
  const location = await db.location.findFirstOrThrow();
  const post = await db.marketplacePost.create({ data: { userId: seller.id, title: 'Fixture post',
    content: 'Fixture', price: 100, availableDate: new Date(), postType: 'SELL', locationId: location.id } });
  const room = await db.chatRoom.create({ data: { postId: post.id, initiatorId: buyer.id, ownerId: seller.id } });
  const offer = await api('/api/deals', { cookie: seller.cookie, body: {
    roomId: room.id, postId: post.id, receiverId: buyer.id, agreedPrice: 1000,
  } });
  assert.equal(offer.status, 200, JSON.stringify(offer.data));
  const deal = offer.data.deal;
  assert.equal(deal.status, 'PENDING');
  assert.equal((await db.marketplacePost.findUniqueOrThrow({ where: { id: post.id } })).status, 'OPEN');
  const action = (actor, status) => api('/api/deals/' + deal.id, { cookie: actor.cookie, method: 'PATCH', body: { status } });
  assert.equal((await action(seller,'ACCEPTED')).status, 403);
  assert.equal((await action(outsider,'ACCEPTED')).status, 403);
  assert.equal((await action(buyer,'ACCEPTED')).data.status, 'ACCEPTED');
  const review = () => api('/api/reviews', { cookie: seller.cookie, body: {
    dealId: deal.id, roomId: room.id, postId: post.id, revieweeId: buyer.id, rating: 4,
  } });
  assert.equal((await review()).status, 400);
  assert.equal((await action(buyer,'COMPLETED')).data.status, 'ACCEPTED');
  assert.equal((await action(buyer,'COMPLETED')).data.status, 'ACCEPTED');
  assert.equal((await action(seller,'COMPLETED')).data.status, 'COMPLETED');
  assert.equal((await review()).data.newRatingAvg, 4);
  assert.equal((await review()).status, 409);
  const upload = new FormData();
  upload.append('scope', 'chat');
  upload.append('file', new Blob([Buffer.from([255, 216, 255, 0])], { type: 'image/jpeg' }), 'fixture.jpg');
  const image = await api('/api/uploads', { cookie: seller.cookie, body: upload });
  assert.equal(image.status, 200);
  const imageUrl = image.data.url;
  assert.equal((await api(imageUrl)).status, 404);
  assert.equal((await api(imageUrl, { cookie: buyer.cookie })).status, 404);
  const msg = '/api/chat/rooms/' + room.id + '/messages';
  assert.equal((await api(msg, { cookie: seller.cookie, body: { messageType: 'IMAGE', content: imageUrl } })).status, 200);
  assert.equal((await api(imageUrl, { cookie: buyer.cookie })).status, 200);
  assert.equal((await api(imageUrl, { cookie: outsider.cookie })).status, 404);
  const support = await api('/api/support', { cookie: buyer.cookie, body: { roomId: room.id, category: 'QUALITY', content: 'Fixture case' } });
  assert.equal(support.status, 200, JSON.stringify(support.data));
  const ticket = support.data.ticket.id;
  const route = '/api/admin/support/' + ticket;
  assert.equal((await api(route + '?evidence=1', { cookie: admin.cookie })).status, 403);
  assert.equal((await api('/api/admin/support/claim', { cookie: admin.cookie, method: 'POST' })).status, 200);
  assert.equal((await api(route + '?evidence=1', { cookie: otherAdmin.cookie })).status, 403);
  assert.equal((await api(route + '?evidence=1', { cookie: admin.cookie })).status, 200);
  assert.equal(await db.supportEvidenceAccess.count({ where: { ticketId: ticket, adminId: admin.id } }), 1);
  assert.equal((await api(route, { cookie: admin.cookie, method: 'PATCH', body: { postAction: 'FLAG_PRICE' } })).status, 200);
  assert.equal((await api('/api/admin/posts/' + post.id, { cookie: admin.cookie, method: 'DELETE' })).status, 200);
  assert.equal((await db.marketplacePost.findUniqueOrThrow({ where: { id: post.id } })).status, 'REMOVED_BY_ADMIN');
  assert.equal(await db.deal.count({ where: { id: deal.id } }), 1);
  assert.equal(await db.supportTicket.count({ where: { id: ticket } }), 1);
  console.log('PASS offer, both confirmations, verified review, private images, support permissions and removal');
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
