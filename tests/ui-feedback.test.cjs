const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./helpers.cjs');

// Exercise the same boundary used by the UI, including network and malformed responses.
const ui = () => loadTs('src/lib/ui-feedback.ts');
test('unreviewed users never appear to have a five-star rating', () => {
  const { reviewLabel } = ui();
  assert.equal(reviewLabel(5, 0, 'TH'), 'ยังไม่มีรีวิว');
  assert.equal(reviewLabel(null, 0, 'EN'), 'No reviews yet');
  assert.equal(reviewLabel(4.5, 2, 'TH'), '4.5 (2 รีวิว)');
  assert.equal(reviewLabel(null, 2, 'EN'), 'Rating unavailable (2 reviews)');
});
test('admin overview distinguishes expired access from outages', async () => {
  const { loadAdminOverview } = ui();
  for (const status of [401, 403]) {
    assert.equal((await loadAdminOverview(async () => new Response('', { status }))).kind, 'unauthenticated');
  }
  assert.equal((await loadAdminOverview(async () => new Response('', { status: 503 }))).kind, 'error');
  assert.equal((await loadAdminOverview(async () => { throw new Error('offline'); })).kind, 'error');
  assert.equal((await loadAdminOverview(async () => new Response('broken'))).kind, 'error');
  assert.equal((await loadAdminOverview(async () => Response.json({ admin: { id: 1 }, summary: {} }))).kind, 'ready');
});
test('marketplace only accepts a successful post collection, including real empty results', async () => {
  const { loadMarketplacePosts } = ui();
  assert.equal((await loadMarketplacePosts(async () => new Response('', { status: 500 }), 7)).kind, 'error');
  assert.equal((await loadMarketplacePosts(async () => Response.json({}), 7)).kind, 'error');
  const result = await loadMarketplacePosts(async url => {
    assert.equal(url, '/api/posts?days=30');
    return Response.json({ posts: [] });
  }, 30);
  assert.equal(result.kind, 'ready');
  assert.equal(result.posts.length, 0);
});
