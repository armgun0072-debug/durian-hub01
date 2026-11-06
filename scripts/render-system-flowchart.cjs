// Fixed SVG layout: all business nodes, links and Mermaid source share one model.
// Requires local Chrome (CHROME_PATH can override the Windows default).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs/diagrams');
const width = 1900, height = 4540, scale = 2;
const nodes = [], edges = [];
const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;' }[c]));
function node(id, x, y, lines, type = 'step', w = 500, h = 110) {
  nodes.push({ id, x, y, w, h, lines, type });
}
function connector(id, code, x, y) { node(id, x - 25, y - 25, [code], 'connector', 50, 50); }
function edge(from, to, points, label = '', lx = 0, ly = 0, optional = false) {
  edges.push({ from, to, points, label, lx, ly, optional });
}

// Main lane: account entry, marketplace and the agreed transaction.
node('START', 860, 230, ['เริ่มต้น'], 'terminal', 180, 64);
node('PUBLIC', 700, 355, ['ดูประกาศสาธารณะ', 'และข้อมูลตลาด']);
node('ENTRY', 700, 515, ['เลือกช่องทางเข้าใช้งาน'], 'decision');
node('LOGIN', 700, 700, ['เข้าสู่ระบบสมาชิก']);
node('CHECK', 700, 860, ['รหัสผ่าน สถานะบัญชี', 'และอีเมลผ่านหรือไม่'], 'decision');
node('HOME', 700, 1140, ['ใช้งานบัญชีสมาชิก']);
node('ACTION', 700, 1430, ['เลือกใช้งาน Marketplace'], 'decision');
node('SELECT', 700, 1640, ['เลือกประกาศ OPEN ของผู้อื่น']);
node('CHAT', 700, 1830, ['เปิดห้องเดิมหรือสร้างห้อง', 'ส่งข้อความเจรจา']);
node('AGREE', 700, 2040, ['ตกลงปิดดีลหรือไม่'], 'decision');
node('DEAL', 700, 2250, ['สร้างดีล ACCEPTED', 'และปิดประกาศใน transaction'], 'step', 500, 120);
node('CLOSED', 700, 2460, ['ห้องคู่ค้า DEAL_CLOSED', 'ห้องอื่น ARCHIVED พร้อม closed_at'], 'step', 500, 120);
node('REVIEW', 700, 2700, ['คู่ค้ารีวิว 1–5 ดาว', 'คนละครั้งต่อดีล'], 'step', 500, 120);
node('TOTAL', 700, 2890, ['บันทึกรีวิวและคำนวณคะแนนเฉลี่ย', 'พร้อมจำนวนรีวิวใน transaction']);
node('END', 790, 4140, ['สิ้นสุดขั้นตอนที่เลือก'], 'terminal', 320, 80);

// Account branches, kept beside their point of entry.
node('REG', 60, 700, ['สมัครสมาชิก', 'เลือกบทบาทหลัก']);
node('OTP', 60, 860, ['รับและยืนยันอีเมลด้วย OTP']);
node('RETRY', 60, 1140, ['แก้ไขรหัสหรือขอส่ง OTP ใหม่']);
node('ADMINLOGIN', 1340, 700, ['เข้าสู่ระบบแอดมิน', 'และตรวจสิทธิ์']);
node('ADMIN', 1340, 845, ['งานผู้ดูแลระบบ'], 'step', 500, 70);
node('DENY', 1340, 1050, ['แจ้งข้อผิดพลาด', 'ปฏิเสธการเข้าใช้งาน']);
connector('A_OTP', 'A', 620, 1020);
connector('A_HOME', 'A', 620, 1195);
connector('O_CHECK', 'O', 620, 915);
connector('O_OTP', 'O', 30, 915);
connector('O_RETRY', 'O', 310, 1300);
connector('B_ADMIN', 'B', 1590, 965);
connector('R_HOME', 'R', 1270, 1195);
connector('P_PUBLIC', 'P', 620, 410);

// Marketplace branches.
node('POST', 60, 1640, ['ลงประกาศตามบทบาทที่มีสิทธิ์']);
node('SAVE', 60, 1810, ['บันทึกประกาศ OPEN', 'และเพิ่มรูปภาพถ้ามี']);
connector('P_SAVE', 'P', 220, 2020);
connector('S_SAVE', 'S', 450, 2020);
connector('C_SELECT', 'C', 1270, 1695);
connector('H_CHAT', 'H', 1270, 1885);
connector('J_AGREE', 'J', 620, 2095);
connector('J_CHAT', 'J', 620, 1885);
connector('Z_TOTAL', 'Z', 950, 3080);

// Role verification is optional; primary-role signup does not require approval.
connector('R_REQUEST', 'R', 310, 2240);
node('REQUEST', 60, 2330, ['ส่งเอกสารขอเพิ่มบทบาท']);
node('ROLEADMIN', 60, 2520, ['แอดมินพิจารณาเอกสาร'], 'decision');
connector('B_ROLE', 'B', 620, 2575);
node('GRANT', 60, 2740, ['เพิ่มบทบาท ACTIVE', 'และสถานะยืนยัน'], 'step', 240, 140);
node('REJECT', 320, 2740, ['บันทึก REJECTED', 'และหมายเหตุ'], 'step', 240, 140);
connector('A_GRANT', 'A', 180, 3040);
connector('Z_REJECT', 'Z', 440, 3040);

// Moderation: short local branches instead of global admin lines.
connector('C_REPORT', 'C', 1590, 1600);
node('REPORT', 1340, 1700, ['สร้างรายงานประกาศ', 'และเพิ่ม report_count']);
node('MOD', 1340, 1860, ['แอดมินตรวจรายงาน']);
connector('B_MOD', 'B', 1270, 1985);
node('MOD_RESULT', 1340, 2020, ['พบความผิดหรือไม่'], 'decision');
node('PENALTY', 1340, 2220, ['ซ่อนประกาศ', 'ปรับคะแนน /', 'สถานะบัญชี'], 'step', 240, 140);
node('DISMISS', 1600, 2220, ['บันทึกรายงาน', 'REJECTED'], 'step', 240, 140);
connector('Z_PENALTY', 'Z', 1460, 2420);
connector('Z_DISMISS', 'Z', 1720, 2420);

// History and support can be used independently of partner reviews.
node('HISTORY', 1340, 2700, ['ครบ 168 ชั่วโมงหลังปิดดีล', 'อ่านแชตได้ แต่ส่งข้อความคู่ค้าไม่ได้'], 'step', 500, 120);
connector('H_SUPPORT', 'H', 1590, 2920);
node('SUPPORT', 1340, 3020, ['เลือกห้องและหัวข้อปัญหา', 'สร้างคำร้อง OPEN']);
node('QUEUE', 1340, 3200, ['เข้าคิวตาม queued_at และ id']);
connector('Q_QUEUE', 'Q', 1270, 3255);
node('CLAIM', 1340, 3380, ['แอดมินรับคิวถัดไป', 'เปลี่ยนเป็น IN_PROGRESS']);
connector('B_CLAIM', 'B', 1270, 3435);
node('HELP', 1340, 3560, ['ผู้รับเรื่องคุยกับผู้แจ้ง', 'และตรวจหลักฐาน']);
node('RESOLVE', 1340, 3740, ['บันทึกผลแก้ไข', 'ปิดคำร้อง RESOLVED']);
node('REOPEN', 1340, 3920, ['ผู้แจ้งเปิดเรื่องซ้ำหรือไม่'], 'decision');
connector('Q_REOPEN', 'Q', 1590, 4130);
connector('Z_RESOLVE', 'Z', 1870, 3975);

// Analytics is explicitly a separate script, not an automatic posting action.
connector('S_STATS', 'S', 310, 3300);
node('REFRESH', 60, 3400, ['ผู้ดูแลเรียก stats:refresh', 'เป็นกระบวนการแยก']);
node('STATS', 60, 3590, ['สรุปราคาเสนอที่เข้าเกณฑ์', 'จากประกาศย้อนหลัง 7 วัน']);
node('DAILY', 60, 3790, ['บันทึก daily_market_stats']);
connector('Z_STATS', 'Z', 310, 4000);
connector('Z_END', 'Z', 950, 4050);

// Explicit right-angle routing. Connector pairs carry cross-section transitions.
edge('START','PUBLIC',[[950,294],[950,355]]);
edge('PUBLIC','ENTRY',[[950,465],[950,515]]);
edge('ENTRY','LOGIN',[[950,625],[950,700]],'สมาชิกเดิม',950,662);
edge('ENTRY','REG',[[700,570],[310,570],[310,700]],'สมาชิกใหม่',460,570);
edge('ENTRY','ADMINLOGIN',[[1200,570],[1590,570],[1590,700]],'เจ้าหน้าที่',1430,570);
edge('REG','OTP',[[310,810],[310,860]]);
edge('OTP','A_OTP',[[560,915],[580,915],[580,1020],[595,1020]],'สำเร็จ',575,988);
edge('OTP','RETRY',[[310,970],[310,1140]],'ไม่ผ่าน',310,1060);
edge('RETRY','O_RETRY',[[310,1250],[310,1275]]);
edge('O_OTP','OTP',[[55,915],[60,915]]);
edge('LOGIN','CHECK',[[950,810],[950,860]]);
edge('CHECK','HOME',[[950,970],[950,1140]],'ผ่าน',950,1060);
edge('CHECK','O_CHECK',[[700,915],[645,915]],'ยืนยันอีเมล',655,875);
edge('CHECK','DENY',[[1200,915],[1295,915],[1295,1105],[1340,1105]],'ไม่ผ่าน',1295,1000);
edge('ADMINLOGIN','ADMIN',[[1590,810],[1590,845]]);
edge('ADMIN','B_ADMIN',[[1590,915],[1590,940]]);
edge('A_HOME','HOME',[[645,1195],[700,1195]]);
edge('HOME','ACTION',[[950,1250],[950,1430]]);
edge('HOME','R_HOME',[[1200,1195],[1245,1195]],'',0,0,true);
edge('P_PUBLIC','PUBLIC',[[645,410],[700,410]]);
edge('ACTION','POST',[[700,1485],[310,1485],[310,1640]],'สร้างประกาศ',460,1485);
edge('ACTION','SELECT',[[950,1540],[950,1640]],'ค้นหา',950,1590);
edge('SELECT','C_SELECT',[[1200,1695],[1245,1695]],'รายงาน',1250,1655,true);
edge('POST','SAVE',[[310,1750],[310,1810]]);
edge('SAVE','P_SAVE',[[310,1920],[310,1960],[220,1960],[220,1995]]);
edge('SAVE','S_SAVE',[[310,1920],[310,1960],[450,1960],[450,1995]],'สถิติ',455,1960,true);
edge('SELECT','CHAT',[[950,1750],[950,1830]]);
edge('CHAT','AGREE',[[950,1940],[950,2040]]);
edge('CHAT','H_CHAT',[[1200,1885],[1245,1885]],'ช่วยเหลือ',1250,1848,true);
edge('AGREE','J_AGREE',[[700,2095],[645,2095]],'ยังไม่ตกลง',640,2058);
edge('J_CHAT','CHAT',[[645,1885],[700,1885]]);
edge('AGREE','DEAL',[[950,2150],[950,2250]],'ตกลงและผ่านการตรวจ',950,2200);
edge('DEAL','CLOSED',[[950,2370],[950,2460]]);
edge('CLOSED','REVIEW',[[950,2580],[950,2700]],'เลือกรีวิว',950,2640,true);
edge('REVIEW','TOTAL',[[950,2820],[950,2890]]);
edge('TOTAL','Z_TOTAL',[[950,3000],[950,3055]]);
edge('CLOSED','HISTORY',[[1200,2520],[1590,2520],[1590,2700]],'เมื่อครบกำหนด',1440,2520);
edge('R_REQUEST','REQUEST',[[310,2265],[310,2330]]);
edge('REQUEST','ROLEADMIN',[[310,2440],[310,2520]]);
edge('B_ROLE','ROLEADMIN',[[595,2575],[560,2575]]);
edge('ROLEADMIN','GRANT',[[180,2630],[180,2740]],'อนุมัติ',180,2685);
edge('ROLEADMIN','REJECT',[[440,2630],[440,2740]],'ปฏิเสธ',440,2685);
edge('GRANT','A_GRANT',[[180,2880],[180,3015]]);
edge('REJECT','Z_REJECT',[[440,2880],[440,3015]]);
edge('C_REPORT','REPORT',[[1590,1625],[1590,1700]]);
edge('REPORT','MOD',[[1590,1810],[1590,1860]]);
edge('B_MOD','MOD',[[1295,1985],[1315,1985],[1315,1940],[1340,1940]]);
edge('MOD','MOD_RESULT',[[1590,1970],[1590,2020]]);
edge('MOD_RESULT','PENALTY',[[1460,2130],[1460,2220]],'พบ',1460,2175);
edge('MOD_RESULT','DISMISS',[[1720,2130],[1720,2220]],'ไม่พบ',1720,2175);
edge('PENALTY','Z_PENALTY',[[1460,2360],[1460,2395]]);
edge('DISMISS','Z_DISMISS',[[1720,2360],[1720,2395]]);
edge('HISTORY','H_SUPPORT',[[1590,2820],[1590,2895]],'ขอความช่วยเหลือ',1590,2860,true);
edge('H_SUPPORT','SUPPORT',[[1590,2945],[1590,3020]]);
edge('SUPPORT','QUEUE',[[1590,3130],[1590,3200]]);
edge('Q_QUEUE','QUEUE',[[1295,3255],[1340,3255]]);
edge('QUEUE','CLAIM',[[1590,3310],[1590,3380]]);
edge('B_CLAIM','CLAIM',[[1295,3435],[1340,3435]]);
edge('CLAIM','HELP',[[1590,3490],[1590,3560]]);
edge('HELP','RESOLVE',[[1590,3670],[1590,3740]]);
edge('RESOLVE','REOPEN',[[1590,3850],[1590,3920]]);
edge('REOPEN','Q_REOPEN',[[1590,4030],[1590,4105]],'เปิดซ้ำ',1590,4070);
edge('REOPEN','Z_RESOLVE',[[1840,3975],[1845,3975]],'ไม่',1860,3935);
edge('S_STATS','REFRESH',[[310,3325],[310,3400]]);
edge('REFRESH','STATS',[[310,3510],[310,3590]]);
edge('STATS','DAILY',[[310,3700],[310,3790]]);
edge('DAILY','Z_STATS',[[310,3900],[310,3975]]);
edge('Z_END','END',[[950,4075],[950,4140]]);

const connectorMeaning = { A:'บัญชีสมาชิก', O:'ยืนยัน OTP', B:'งานแอดมิน', P:'ประกาศสาธารณะ', R:'ขอเพิ่มบทบาท', C:'รายงานประกาศ', J:'กลับไปเจรจา', H:'ศูนย์ช่วยเหลือ', Q:'เข้าคิวใหม่', S:'คำนวณสถิติ', Z:'สิ้นสุดขั้นตอน' };
const ids = new Set(nodes.map(n => n.id));
assert.equal(ids.size, nodes.length);
edges.forEach(e => { assert(ids.has(e.from)); assert(ids.has(e.to)); });
function text(lines, x, y, size = 27, fill = '#9dceff', weight = 600) {
  return `<text x="${x}" y="${y}" text-anchor="middle" fill="${fill}" font-size="${size}" font-weight="${weight}">${lines.map((line,i) => `<tspan x="${x}" dy="${i ? 39 : 0}">${xml(line)}</tspan>`).join('')}</text>`;
}
const svg = [`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" font-family="Tahoma, sans-serif">`,
  '<title id="title">Flowchart ภาพรวมระบบ Durian Hub</title>',
  '<desc id="desc">ผังบนลงล่าง เส้นหักมุม จุดเชื่อมตัวอักษรเดียวกันหมายถึงทางเดินต่อเนื่องระหว่างส่วน ดูคำอธิบายท้ายภาพ</desc>',
  '<defs><marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 L9 5 L1 9" fill="none" stroke="#b5becb" stroke-width="2"/></marker></defs>',
  `<rect width="${width}" height="${height}" fill="#020609"/>`,
  text(['DURIAN HUB  /  SYSTEM FLOWCHART'],950,65,18,'#698da9'),
  text(['ภาพรวมการทำงานทั้งระบบ'],950,118,38),
  text(['อ่านจากบนลงล่าง • กล่องเส้นประ = จุดตัดสินใจ • วงกลมอักษรเดียวกัน = จุดเชื่อมต่อ'],950,165,20,'#a5b6c6',400),
  '<path d="M60 1345 H1840" stroke="#183147" stroke-width="2"/>',
  text(['ประกาศ / บทบาท / สถิติ'],310,1390,20,'#698da9'),
  text(['รายงานและศูนย์ช่วยเหลือ'],1590,1390,20,'#698da9')];
for (const e of edges) {
  svg.push(`<path data-from="${e.from}" data-to="${e.to}" d="${e.points.map((p,i) => `${i ? 'L' : 'M'}${p.join(' ')}`).join(' ')}" fill="none" stroke="#b5becb" stroke-width="2" stroke-linejoin="round" ${e.optional ? 'stroke-dasharray="5 6"' : ''} marker-end="url(#arrow)"/>`);
  if(e.label) {
    const w = Math.max(44, [...e.label].length * 12 + 24);
    svg.push(`<rect x="${e.lx-w/2}" y="${e.ly-19}" width="${w}" height="36" rx="16" fill="#020609"/>`,text([e.label],e.lx,e.ly+6,20,'#b8d9f3',400));
  }
}
for (const n of nodes) {
  const cx = n.x+n.w/2, cy = n.y+n.h/2;
  svg.push(`<g id="node-${n.id}" data-node="${n.id}">`);
  if(n.type === 'connector') svg.push(`<circle cx="${cx}" cy="${cy}" r="25" fill="#031522" stroke="#326589" stroke-width="2"/>`);
  else svg.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="${n.type==='terminal' ? 32 : 26}" fill="${n.type==='decision' ? '#03131e' : '#062e50'}" stroke="#28516d" stroke-width="2" ${n.type==='decision' ? 'stroke-dasharray="5 5"' : ''}/>`);
  svg.push(text(n.lines,cx,cy - (n.lines.length-1)*19.5+9,n.w < 300 && n.type!=='connector' ? 23 : 27),'</g>');
}
svg.push('<path d="M60 4290 H1840" stroke="#183147" stroke-width="2"/>',text(['วิธีอ่านจุดเชื่อม'],950,4340,25));
const legend = Object.entries(connectorMeaning);
legend.forEach(([code,meaning],i) => {
  const col = i%4, row = Math.floor(i/4), x=105+col*460, y=4390+row*48;
  svg.push(`<circle cx="${x}" cy="${y}" r="18" fill="#031522" stroke="#326589"/>`,text([code],x,y+7,20),`<text x="${x+30}" y="${y+7}" fill="#a5b6c6" font-size="20">${xml(meaning)}</text>`);
});
svg.push('</svg>');
fs.writeFileSync(path.join(output,'system-flowchart.svg'),svg.join('\n'));

// Mermaid preserves the same steps and links; fixed SVG controls presentation.
const source = ['---','config:','  theme: base','  themeVariables:','    background: "#020609"','    primaryColor: "#062e50"','    primaryTextColor: "#9dceff"','    primaryBorderColor: "#28516d"','    lineColor: "#b5becb"','  flowchart:','    curve: stepBefore','---','flowchart TD','    %% Same-letter circles connect across sections; see legend in the document.'];
for (const n of nodes) {
  const label=n.lines.join(' / ').replace(/"/g,"'");
  source.push(`    ${n.id}${n.type==='connector' ? `((${label}))` : `("${label}")`}`);
}
for(const e of edges)source.push(`    ${e.from} ${e.optional ? '-.->' : '-->'}${e.label ? `|${e.label}|` : ''} ${e.to}`);
source.push('    classDef decision fill:#03131e,stroke:#28516d,stroke-dasharray:5 5,color:#9dceff;');
source.push(`    class ${nodes.filter(n=>n.type==='decision').map(n=>n.id).join(',')} decision;`);
const mmd=source.join('\n')+'\n';
fs.writeFileSync(path.join(output,'system-flowchart.mmd'),mmd);
const docPath=path.join(root,'docs/database-overview.md');
let count=0;
const doc=fs.readFileSync(docPath,'utf8').replace(/```mermaid\r?\n[\s\S]*?```/g,block => ++count===4 ? '```mermaid\n'+mmd+'```' : block);
assert.equal(count,4);
fs.writeFileSync(docPath,doc);

// Local file -> Chrome screenshot; no package installation or remote resources.
async function capture() {
  const scratch=path.join(root,'scratch/flowchart-render');
  fs.mkdirSync(scratch,{recursive:true});
  const profile=path.join(scratch,'chrome-'+Date.now());
  let browser,socket,session,seq=0;
  const pending=new Map();
  const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#020609}svg{display:block}</style>'+svg.join('\n'));});
  function send(method,params={},browserLevel=false) { return new Promise((resolve,reject)=>{
    const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    socket.send(JSON.stringify({id,method,params,...(!browserLevel&&session?{sessionId:session}:{})}));
  }); }
  async function evaluate(expression) {
    const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text);
    return r.result.value;
  }
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--no-first-run','--disable-background-networking','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
    let launchError;browser.on('error',e=>{launchError=e;});
    const portFile=path.join(profile,'DevToolsActivePort');
    for(let i=0;i<150&&!fs.existsSync(portFile);i++){if(launchError)throw launchError;await sleep(100);}
    const port=fs.readFileSync(portFile,'utf8').split('\n')[0];
    const version=await (await fetch(`http://127.0.0.1:${port}/json/version`,{signal:AbortSignal.timeout(10000)})).json();
    socket=new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    socket.onmessage=event=>{const m=JSON.parse(event.data),p=pending.get(m.id);if(!p)return;pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);};
    const {targetId}=await send('Target.createTarget',{url:'about:blank'},true);
    session=(await send('Target.attachToTarget',{targetId,flatten:true},true)).sessionId;
    await send('Page.enable');await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride',{width,height:1200,deviceScaleFactor:scale,mobile:false});
    await send('Page.navigate',{url:`http://127.0.0.1:${server.address().port}`});
    for(let i=0;i<80;i++){if(await evaluate('!!document.querySelector("#node-END")'))break;await sleep(100);}
    await evaluate('document.fonts.ready.then(()=>true)');
    const validation=await evaluate(`(()=>{
      const overflow=[...document.querySelectorAll('[data-node]')].filter(g=>{
        const shape=g.querySelector('rect,circle').getBBox(),label=g.querySelector('text').getBBox();
        return label.x<shape.x-1||label.x+label.width>shape.x+shape.width+1||label.y<shape.y-1||label.y+label.height>shape.y+shape.height+1;
      }).map(g=>g.dataset.node);
      return {nodes:document.querySelectorAll('[data-node]').length,edges:document.querySelectorAll('[data-from]').length,textOverflow:overflow,foreignObjects:document.querySelectorAll('foreignObject').length};
    })()`);
    assert.deepEqual(validation.textOverflow,[],'Text must fit node shapes');
    assert.equal(validation.nodes,nodes.length);assert.equal(validation.edges,edges.length);
    const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height,scale:1}});
    fs.writeFileSync(path.join(output,'system-flowchart.png'),Buffer.from(shot.data,'base64'));
    const checksPath=path.join(output,'render-checks.json');
    const checks=JSON.parse(fs.readFileSync(checksPath,'utf8'));
    checks.renderer='ER: Mermaid 11.12.2 / Flowchart: fixed SVG layout / PNG: Chrome headless';
    checks.diagrams[3]={name:'system-flowchart',renderer:'scripts/render-system-flowchart.cjs',width,height,pngWidth:width*scale,pngHeight:height*scale,...validation};
    fs.writeFileSync(checksPath,JSON.stringify(checks,null,2)+'\n');
    console.log(JSON.stringify(checks.diagrams[3],null,2));
  } finally {
    if(socket?.readyState===WebSocket.OPEN)await send('Browser.close',{},true).catch(()=>{});
    socket?.close();browser?.kill();server.close();
  }
}
capture().catch(e=>{console.error(e);process.exitCode=1;});
