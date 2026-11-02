// An isolated production build, Chrome, and a disposable MySQL database.
const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const suffix = randomBytes(6).toString('hex');
const dbName = `durian_hub_ui_test_${suffix}`;
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${dbName}`;
const admin = new PrismaClient();
const prisma = new PrismaClient({ datasourceUrl: url.href });
const output = path.resolve('docs/ui-preview');
const profile = path.resolve('.local', `chrome-ui-${suffix}`);
const base = 'http://localhost:3110';
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
let created = false, server, chrome, socket, session;
let seq = 0;
const waiting = new Map();
const runtimeErrors = [];
const checks = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function send(method, params = {}, browser = false) {
  const id = ++seq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { waiting.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    waiting.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, ...(!browser && session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression, label) {
  for (let n = 0; n < 80; n++) { if (await evaluate(expression)) return; await sleep(100); }
  throw new Error(`UI wait failed: ${label}`);
}
async function click(selector) {
  const result = await evaluate(`(()=>{const el=[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length);if(!el)return false;el.click();return true})()`);
  assert.equal(result, true, `Missing visible control: ${selector}`);
  await sleep(150);
}
async function navigate(url) {
  await send('Page.navigate', { url });
  await until('document.readyState === "complete" && !!document.querySelector(".theme-switcher")', 'page ready');
  await sleep(350);
}
async function screenshot(name) {
  await sleep(220); // Capture the settled view after short color transitions.
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, `${name}.png`), Buffer.from(result.data, 'base64'));
}
async function primaryContrast(mode) {
  const colors = await evaluate(`(()=>{const s=getComputedStyle(document.querySelector('.page-heading .ui-button-primary'));return {fg:s.color,bg:s.backgroundColor}})()`);
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const values = [luminance(colors.fg), luminance(colors.bg)].sort((a,b)=>b-a);
  const ratio = (values[0] + 0.05) / (values[1] + 0.05);
  assert.ok(ratio >= 4.5, `Primary button contrast in ${mode}: ${ratio}`);
  checks.push({ label: `primary button contrast ${mode}`, ratio: Number(ratio.toFixed(2)) });
}
async function checkLayout(label) {
  const metrics = await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,background:getComputedStyle(document.body).backgroundColor})`);
  assert.ok(metrics.scroll <= metrics.width + 1, `${label}: horizontal overflow (${metrics.scroll}/${metrics.width})`);
  checks.push({ label, ...metrics });
}
async function appearance(mode) {
  await click(`.theme-switcher button[aria-label="${mode === 'dark' ? 'โหมดมืด' : mode === 'light' ? 'โหมดสว่าง' : 'ตามระบบ'}"]`);
  if (mode !== 'system') await until(`document.documentElement.dataset.theme === '${mode}'`, `theme ${mode}`);
}

async function seed() {
  assert.match(dbName, /^durian_hub_ui_test_[a-f0-9]{12}$/);
  await admin.$executeRawUnsafe(`CREATE DATABASE \`${dbName}\``);
  created = true;
  const pushed = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate'], { env: { ...process.env, DATABASE_URL: url.href }, encoding: 'utf8', timeout: 60000, windowsHide: true });
  assert.equal(pushed.status, 0, 'Could not initialize UI test database');
  const region = await prisma.regionalSeason.create({ data: { regionCode: 'EAST', regionName: 'ภาคตะวันออก', provincesSummary: 'จันทบุรี', popularVarieties: 'หมอนทอง', harvestPeriod: 'เม.ย. - มิ.ย.' } });
  const location = await prisma.location.create({ data: { province: 'จันทบุรี', district: 'เมือง', region: 'ภาคตะวันออก', regionalSeasonId: region.id } });
  const variety = await prisma.durianVariety.create({ data: { nameTh: 'หมอนทอง', nameEn: 'Monthong' } });
  const grade = await prisma.durianGrade.create({ data: { gradeCode: 'AB', nameTh: 'เกรด AB' } });
  const passwordHash = await bcrypt.hash('UiTestOnly-2026', 4);
  const user = await prisma.user.create({ data: { email: 'grower@example.test', emailVerifiedAt: new Date(), phone: '0810000001', fullName: 'สวนทดสอบ UI', passwordHash, activeRole: 'SELLER', locationId: location.id, roles: { create: [{ roleType: 'SELLER', isPrimaryRole: true, businessName: 'สวนทุเรียนตัวอย่าง' }, { roleType: 'BUYER' }] } } });
  const partner = await prisma.user.create({ data: { email: 'buyer@example.test', emailVerifiedAt: new Date(), phone: '0810000002', fullName: 'ล้งตัวอย่าง', passwordHash, activeRole: 'BUYER', locationId: location.id, roles: { create: { roleType: 'BUYER', isPrimaryRole: true, businessName: 'ล้งตัวอย่าง' } } } });
  await prisma.user.create({ data: { email: 'admin@example.test', emailVerifiedAt: new Date(), phone: '0810000003', fullName: 'ผู้ดูแลทดสอบ', passwordHash, activeRole: 'ADMIN', roles: { create: { roleType: 'ADMIN', isPrimaryRole: true } } } });
  const post = await prisma.marketplacePost.create({ data: { userId: user.id, postType: 'SELL', locationId: location.id, varietyId: variety.id, gradeId: grade.id, title: 'หมอนทองพร้อมตัด จากสวนจันทบุรี', content: 'ทุเรียนหมอนทองคุณภาพ คัดผลพร้อมตัด ติดต่อสอบถามรายละเอียดและนัดดูสวนได้', price: 155, pricePerKg: 155, quantityKg: 5000, availableDate: new Date() } });
  await prisma.marketplacePost.create({ data: { userId: partner.id, postType: 'BUY', locationId: location.id, varietyId: variety.id, gradeId: grade.id, title: 'รับซื้อหมอนทอง เกรด AB', content: 'รับซื้อผลผลิตตามฤดูกาล', price: 150, pricePerKg: 150, quantityKg: 10000, availableDate: new Date() } });
  const room = await prisma.chatRoom.create({ data: { postId: post.id, ownerId: user.id, initiatorId: partner.id } });
  await prisma.chatMessage.create({ data: { roomId: room.id, senderId: partner.id, content: 'สวัสดีครับ สนใจหมอนทอง พร้อมนัดดูสวนได้วันไหนครับ' } });
  return { roomId: room.id };
}

async function main() {
  console.log('Building UI in .next-ui-test (separate from the development server)...');
  const build = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { env: { ...process.env, UI_TEST_BUILD: '1' }, windowsHide: true, encoding: 'utf8', timeout: 120000 });
  if (build.status !== 0) throw new Error('Isolated UI build failed: ' + (build.stderr || build.stdout || build.error));
  console.log('Preparing disposable UI database...');
  const fixture = await seed();
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(profile, { recursive: true });
  let serverLog = '';
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3110'], { env: { ...process.env, UI_TEST_BUILD: '1', DATABASE_URL: url.href }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { serverLog += data; }); server.stderr.on('data', data => { serverLog += data; });
  for (let n = 0; n < 40; n++) {
    if (server.exitCode !== null) throw new Error('UI server exited: ' + serverLog.slice(-2000));
    try { if (serverLog.includes('Ready') && (await fetch(base, {signal:AbortSignal.timeout(1000)})).ok) break; } catch {}
    await sleep(100); if (n === 39) throw new Error('UI server not ready: ' + serverLog.slice(-4000));
  }
  console.log('UI server ready; launching headless Chrome...');
  chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-extensions', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  chrome.on('error', error => console.error('Chrome launch failed:', error.message));
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await sleep(100);
  assert.ok(fs.existsSync(portFile), 'Chrome DevTools did not start');
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const version = await (await fetch(`http://localhost:${port}/json/version`)).json();
  socket = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.id && waiting.has(message.id)) { const pending = waiting.get(message.id); waiting.delete(message.id); message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result); }
  };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, true);
  session = (await send('Target.attachToTarget', { targetId, flatten: true }, true)).sessionId;
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await navigate(base);
  await checkLayout('login desktop light'); await screenshot('login-light');
  await appearance('dark'); await checkLayout('login desktop dark'); await screenshot('login-dark');
  await send('Page.reload'); await until('document.readyState === "complete" && !!document.querySelector(".theme-switcher")', 'theme reload');
  assert.equal(await evaluate('document.documentElement.dataset.theme'), 'dark'); checks.push({ label: 'theme persists after reload', passed: true });
  await appearance('system');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
  await until('document.documentElement.dataset.theme === "dark"', 'OS theme change'); checks.push({ label: 'system theme follows OS changes', passed: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await checkLayout('login mobile dark'); await screenshot('login-mobile-dark');
  console.log('Login themes, persistence and system appearance checked.');
  // Real authentication and cookies against the disposable database.
  const login = await evaluate(`fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'grower@example.test',password:'UiTestOnly-2026'})}).then(r=>r.status)`);
  assert.equal(login, 200);
  await navigate(base); await until('!!document.querySelector("#main-content")', 'authenticated workspace');
  await checkLayout('workspace mobile dark'); await screenshot('workspace-mobile-dark');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  await checkLayout('workspace narrow mobile 320px');
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  await checkLayout('workspace tablet 1100px');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await appearance('light'); await checkLayout('workspace desktop light'); await screenshot('workspace-light');
  await appearance('dark'); await screenshot('workspace-dark');
  await click('nav button[aria-current]');
  // Navigate through the same visible buttons users use.
  await evaluate(`document.querySelectorAll('nav button')[2].click()`);
  await until('!!document.querySelector(".market-tabs")', 'marketplace');
  await checkLayout('market desktop dark'); await primaryContrast('dark'); await screenshot('market-dark');
  await appearance('light'); await primaryContrast('light'); await screenshot('market-light');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await checkLayout('market mobile light'); await screenshot('market-mobile-light');
  const search = 'input[placeholder]';
  await evaluate(`(()=>{const input=document.querySelector(${JSON.stringify(search)});const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(input,'no-results-xyz');input.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await until('document.querySelector("[role=status]")?.textContent.includes("0")', 'empty search results');
  await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes('ล้างตัวกรอง'));if(!button)throw new Error('Clear filters missing');button.click()})()`);
  await until(`document.querySelector(${JSON.stringify(search)}).value === ''`, 'clear filters'); checks.push({ label: 'search and clear filters', passed: true });
  await click('.page-heading .ui-button');
  await until('!!document.querySelector("form input")', 'create listing form');
  await checkLayout('create listing modal mobile'); await screenshot('listing-modal-mobile');
  assert.equal(await evaluate('document.querySelector("[role=dialog]")?.contains(document.activeElement)'), true);
  await evaluate(`(()=>{const controls=[...document.querySelector('[role=dialog]').querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(e=>e.getClientRects().length);controls.at(-1).focus()})()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  assert.equal(await evaluate('document.querySelector("[role=dialog]")?.contains(document.activeElement)'), true); checks.push({ label: 'dialog keyboard focus stays inside', passed: true });
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await until('!document.querySelector("[role=dialog]")', 'Escape closes modal'); checks.push({ label: 'dialog takes focus and closes with Escape', passed: true });
  console.log('Workspace, marketplace, filters and mobile listing dialog checked.');
  // Return to a clean workspace without submitting a listing.
  await navigate(base); await until('!!document.querySelector("#main-content")', 'workspace');
  await evaluate(`document.querySelectorAll('nav button')[1].click()`);
  await checkLayout('dashboard mobile'); await screenshot('dashboard-mobile');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await appearance('dark'); await screenshot('dashboard-dark');
  await evaluate(`document.querySelectorAll('nav button')[3].click()`);
  await until(`!!document.querySelector('main')?.textContent.includes('ข้อความสนทนา')`, 'inbox');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await checkLayout('inbox mobile'); await screenshot('inbox-mobile');
  await evaluate(`(()=>{const card=[...document.querySelectorAll('main button, main div')].find(e=>e.textContent.includes('ล้งตัวอย่าง')&&e.getAttribute('class')?.includes('cursor-pointer'));if(!card)throw new Error('Conversation missing');card.click()})()`);
  await until(`!![...document.querySelectorAll('button')].find(b=>b.textContent.includes('กลับไปข้อความทั้งหมด'))`, 'conversation');
  await checkLayout('conversation mobile'); await screenshot('conversation-mobile');
  await evaluate(`(()=>{[...document.querySelectorAll('button')].find(b=>b.textContent.includes('กลับไปข้อความทั้งหมด')).click()})()`);
  assert.equal(await evaluate(`!![...document.querySelectorAll('button')].find(b=>b.textContent.includes('กลับไปข้อความทั้งหมด'))`), false); checks.push({ label: 'mobile conversation back navigation', passed: true });
  await navigate(base + '/admin');
  await checkLayout('admin login mobile'); await screenshot('admin-login-mobile');
  assert.equal(await evaluate(`fetch('/api/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({identifier:'admin@example.test',password:'UiTestOnly-2026'})}).then(r=>r.status)`), 200);
  await navigate(base + '/admin'); await until('!!document.querySelector("#admin-main")', 'admin workspace');
  await checkLayout('admin mobile dark'); await screenshot('admin-mobile-dark');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1050, deviceScaleFactor: 1, mobile: false });
  await screenshot('admin-dark'); await appearance('light'); await checkLayout('admin desktop light'); await screenshot('admin-light');
  assert.deepEqual(runtimeErrors, [], 'Browser runtime errors');
  checks.push({ label: 'no browser runtime exceptions', passed: true });
  fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify(checks, null, 2));
  console.log(JSON.stringify({ checks: checks.length, screenshots: output, fixtureRoom: fixture.roomId }));
}

main().catch(async error => { if (socket?.readyState === WebSocket.OPEN && session) await screenshot('failure').catch(() => {}); console.error(error); process.exitCode = 1; }).finally(async () => {
  try { if (socket?.readyState === WebSocket.OPEN) await send('Browser.close', {}, true).catch(() => {}); } finally { socket?.close(); chrome?.kill(); server?.kill(); }
  await prisma.$disconnect();
  if (created) { assert.match(dbName, /^durian_hub_ui_test_[a-f0-9]{12}$/); assert.notEqual(new URL(process.env.DATABASE_URL).pathname, `/${dbName}`); await admin.$executeRawUnsafe(`DROP DATABASE \`${dbName}\``); }
  await admin.$disconnect();
  // Next generates these files during the isolated build. Restore the normal app paths.
  const envTypes = fs.readFileSync('next-env.d.ts', 'utf8');
  if (envTypes.includes('./.next-ui-test/types/')) fs.writeFileSync('next-env.d.ts', envTypes.replace('./.next-ui-test/types/', './.next/types/'));
  const config = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  if (config.include?.includes('.next-ui-test/types/**/*.ts')) {
    config.include = config.include.filter(entry => entry !== '.next-ui-test/types/**/*.ts');
    fs.writeFileSync('tsconfig.json', JSON.stringify(config, null, 2) + '\n');
  }
  // Only this run's disposable profile, verified inside the workspace's .local directory.
  if (profile.startsWith(path.resolve('.local') + path.sep) && path.basename(profile) === `chrome-ui-${suffix}`) {
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { console.log('Chrome profile still locked; retained:', profile); }
  }
});
