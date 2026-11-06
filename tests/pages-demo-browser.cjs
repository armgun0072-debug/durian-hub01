// Browser checks against the exported Pages artifact; no database or API fixtures.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.pages-demo-build/out');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'durian-pages-'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let chrome, socket, session, sequence = 0;
const pending = new Map(), errors = [], apiRequests = [], failures = [], checks = [];
const prefix = '/durian-hub01';
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith(prefix + '/')) { response.writeHead(404).end(); return; }
  const target = path.resolve(output, '.' + decodeURIComponent(pathname.slice(prefix.length)));
  if (!target.startsWith(output + path.sep) && target !== output) { response.writeHead(403).end(); return; }
  const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
  if (!fs.existsSync(file)) { response.writeHead(404).end(); return; }
  const type = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' }[path.extname(file)] || 'application/octet-stream';
  response.writeHead(200, { 'Content-Type': type }); fs.createReadStream(file).pipe(response);
});
function send(method, params = {}, browser = false) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(id, { resolve: result => { clearTimeout(timer); resolve(result); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, ...(!browser && session ? { sessionId: session } : {}) }));
  });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
async function until(expression) {
  for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await delay(100); }
  throw new Error(`UI timeout: ${expression}`);
}
async function check(label, expression) { assert.ok(await evaluate(expression), label); checks.push(label); }
async function clickText(text) {
  assert.ok(await evaluate(`(()=>{const el=[...document.querySelectorAll('button')].find(el=>el.textContent.trim()===${JSON.stringify(text)});if(!el)return false;el.click();return true})()`), `Button: ${text}`);
  await delay(100);
}
async function input(selector, value) {
  await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await delay(120);
}
async function screenshot(name) {
  fs.mkdirSync(path.join(root, 'scratch'), { recursive: true });
  const result = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(root, 'scratch', name), Buffer.from(result.data, 'base64'));
}
async function main() {
  assert.ok(fs.existsSync(path.join(output, 'index.html')), 'Run npm run build:pages first');
  assert.ok(!fs.existsSync(path.join(output, 'uploads')), 'No uploaded files in artifact');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = process.env.PAGES_DEMO_URL || `http://127.0.0.1:${server.address().port}${prefix}/`;
  chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
  chrome.on('error', error => errors.push(error.message));
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await delay(100);
  assert.ok(fs.existsSync(portFile), `Chrome did not start: ${errors.join('; ')}`);
  const [port, endpoint] = fs.readFileSync(portFile, 'utf8').trim().split(/\r?\n/);
  socket = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
    if (message.method === 'Network.requestWillBeSent' && new URL(message.params.request.url).pathname.includes('/api/')) apiRequests.push(message.params.request.url);
    if (message.method === 'Network.responseReceived' && message.params.response.status >= 400 && !message.params.response.url.endsWith('/favicon.ico')) failures.push(message.params.response.url);
  });
  const { targetInfos } = await send('Target.getTargets', {}, true);
  ({ sessionId: session } = await send('Target.attachToTarget', { targetId: targetInfos.find(target => target.type === 'page').targetId, flatten: true }, true));
  await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base });
  await until('document.readyState === "complete" && document.querySelector("article") && !!document.querySelector(".theme-switcher")');
  await delay(600);
  await check('Demo notice', 'document.body.innerText.includes("เว็บเดโมเพื่อการศึกษา")');
  await check('Sample listings', 'document.querySelectorAll("article").length > 0');
  await check('Styles and base path', 'getComputedStyle(document.querySelector("h1")).fontSize === "48px"');
  await check('Desktop fits viewport', 'document.documentElement.scrollWidth <= innerWidth');
  const total = await evaluate('document.querySelectorAll("article").length');
  await screenshot('pages-demo-desktop.png');
  await input('[aria-label="ค้นหาประกาศ"]', 'no-such-durian-123');
  await check('Empty search', 'document.querySelectorAll("article").length === 0 && document.body.innerText.includes("ไม่พบประกาศ")');
  await clickText('ล้างตัวกรอง');
  await check('Reset search', `document.querySelectorAll("article").length === ${total}`);
  await clickText('ประกาศขาย');
  await check('Category filter', `document.querySelectorAll("article").length > 0 && document.querySelectorAll("article").length < ${total}`);
  await evaluate(`(()=>{const el=document.querySelector('select');el.value=el.options[1].value;el.dispatchEvent(new Event('change',{bubbles:true}));})()`); await delay(150);
  await check('Province filter', `(()=>{const selected=document.querySelector('select').value;return [...document.querySelectorAll('article')].every(el=>el.innerText.includes(selected))})()`);
  await evaluate(`(()=>{const el=document.querySelector('select');el.value='ALL';el.dispatchEvent(new Event('change',{bubbles:true}));})()`); await delay(100);
  await clickText('ทั้งหมด');
  await evaluate('document.querySelector("article button").click()'); await delay(150);
  await check('Listing details dialog', 'document.querySelector("[role=dialog]")?.innerText.includes("ประกาศตัวอย่าง")');
  await clickText('ทดลองแชตจำลอง');
  await input('[aria-label="ข้อความจำลอง"]', 'สวัสดี ทดสอบแชต');
  await clickText('ส่งจำลอง');
  await check('Simulated message', 'document.querySelector("[role=dialog]").innerText.includes("สวัสดี ทดสอบแชต")');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await check('Escape closes dialog', '!document.querySelector("[role=dialog]")');
  await evaluate('document.querySelector("article button").click()'); await delay(100); await clickText('ทดลองแชตจำลอง');
  await check('Chat resets on reopen', '!document.querySelector("[role=dialog]").innerText.includes("สวัสดี ทดสอบแชต")');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await clickText('เข้าสู่ระบบ');
  await check('No credential form', 'document.querySelector("[role=dialog]").innerText.includes("ไม่มีระบบเข้าสู่ระบบ") && !document.querySelector("input[type=password]")');
  await clickText('เข้าใจแล้ว'); await clickText('ลงประกาศ');
  await check('Posting limitation shown', 'document.querySelector("[role=dialog]").innerText.includes("เฉพาะระบบจริง")');
  await clickText('เข้าใจแล้ว'); await clickText('ภาพรวมฤดูกาล');
  await check('Six sample regions', 'document.querySelectorAll("article").length === 6');
  await evaluate('document.querySelector("[aria-label=โหมดมืด]").click()'); await delay(150);
  await check('Dark theme', 'document.documentElement.dataset.theme === "dark"');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await evaluate('window.scrollTo(0,0)'); await delay(200);
  await check('Mobile fits viewport', 'document.documentElement.scrollWidth <= innerWidth');
  await screenshot('pages-demo-mobile-dark.png');
  await evaluate('document.querySelector("[aria-label=โหมดสว่าง]").click()'); await delay(150);
  await check('Light theme', 'document.documentElement.dataset.theme === "light"');
  assert.deepEqual(errors, [], 'No runtime errors'); assert.deepEqual(apiRequests, [], 'No application API requests'); assert.deepEqual(failures, [], 'No broken assets');
  console.log(JSON.stringify({ passed: checks.length, checks, runtimeErrors: errors, apiRequests, brokenAssets: failures }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (socket?.readyState === WebSocket.OPEN) { try { await send('Browser.close', {}, true); } catch {} socket.close(); }
  if (chrome && chrome.exitCode === null) { await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(2000)]); if (chrome.exitCode === null) chrome.kill(); }
  server.closeAllConnections(); server.close();
  if (path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith('durian-pages-')) { try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch {} }
});
