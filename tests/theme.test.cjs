const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { loadTs } = require('./helpers.cjs');
const { themeBootstrap, THEME_STORAGE_KEY, isThemePreference } = loadTs('src/lib/theme.ts');

function boot(stored, darkSystem = false, blocked = false) {
  const root = { dataset: {}, style: {} };
  vm.runInNewContext(themeBootstrap, {
    localStorage: { getItem(key) { assert.equal(key, THEME_STORAGE_KEY); if (blocked) throw new Error('storage blocked'); return stored; } },
    matchMedia(query) { assert.equal(query, '(prefers-color-scheme: dark)'); return { matches: darkSystem }; },
    document: { documentElement: root },
  });
  return root;
}
test('theme honors explicit dark preference before painting', () => {
  const root = boot('dark'); assert.equal(root.dataset.theme, 'dark'); assert.equal(root.style.colorScheme, 'dark');
});
test('explicit light overrides a dark OS preference', () => assert.equal(boot('light', true).dataset.theme, 'light'));
test('system choice and first visit follow OS appearance', () => {
  assert.equal(boot('system', true).dataset.theme, 'dark'); assert.equal(boot(null, false).dataset.theme, 'light');
});
test('invalid saved preference falls back to system', () => assert.equal(boot('invalid', true).dataset.theme, 'dark'));
test('blocked storage still applies OS preference', () => assert.equal(boot(null, true, true).dataset.theme, 'dark'));
test('only supported theme preferences are accepted', () => {
  for (const value of ['light', 'dark', 'system']) assert.equal(isThemePreference(value), true);
  for (const value of ['', null, undefined, 1, 'DARK']) assert.equal(isThemePreference(value), false);
});
