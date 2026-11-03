  $fixture += @'
;(() => {
 const oldFetch=window.fetch;
 const room={id:1,status:'ACTIVE',createdAt:'2026-11-01T05:00:00Z',partnerName:'Partner Yard',post:{id:1,title:'หมอนทองจันทบุรี ล็อตทดสอบ',postType:'SELL',location:{province:'จันทบุรี'}},ticket:null};
 const second={...room,id:2,status:'DEAL_CLOSED',partnerName:'Second Partner',post:{...room.post,id:2,title:'รายการปิดดีลในประวัติ'}};
 let created=false;
 const ticket={id:7,status:'OPEN',category:'PAYMENT',requester:{fullName:'Role Test'},room:{post:{title:room.post.title}}};
 const messages=[{id:1,isAdmin:false,content:'ทดสอบปัญหาการชำระเงิน',createdAt:new Date().toISOString(),sender:{fullName:'Role Test'}}];
 window.fetch=async(input,options={})=>{
  const url=new URL(typeof input==='string'?input:input.url,location.href); let data;
  if(url.pathname==='/api/support/rooms')data={rooms:url.searchParams.has('roomId')?[room]:url.searchParams.has('cursor')?[second]:[room],nextCursor:url.searchParams.has('cursor')||url.searchParams.has('roomId')?null:1};
  else if(url.pathname==='/api/support'){
   if(options.method==='POST'){created=true;window.__supportCreated=JSON.parse(options.body);data={ticket};}else data={tickets:created?[ticket]:[],nextCursor:null};
  }else if(url.pathname==='/api/support/7')data={ticket,messages,nextBefore:null,ahead:2,handler:null,canManage:false};
  else return oldFetch(input,options);
  return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
 };
})()
'@
  Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source=$fixture} | Out-Null
  Cdp 'Page.navigate' @{url='http://localhost:3112'} | Out-Null
  Until '!!document.querySelector(''button[aria-label="จัดการบัญชี"]'')'
  Eval 'document.querySelector(''button[aria-label="จัดการบัญชี"]'').click()' | Out-Null
  ClickText 'ศูนย์ช่วยเหลือ / ติดต่อแอดมิน'
  Until 'document.body.textContent.includes("คุณต้องการแจ้งปัญหารายการไหน?")&&document.body.textContent.includes("หมอนทองจันทบุรี ล็อตทดสอบ")'
  Check 'help center opens from account menu with participant listing' 'document.querySelector("[role=dialog]").textContent.includes("Partner Yard")'
  Capture 'desktop-help-home'
  ClickText 'ดูรายการเพิ่มเติม'
  Until 'document.body.textContent.includes("รายการปิดดีลในประวัติ")'
  Check 'load more includes closed history listings' 'document.querySelector("[role=dialog]").textContent.includes("Second Partner")'
  Eval '(()=>{const b=[...document.querySelectorAll("[role=dialog] button")].find(e=>e.textContent.includes("หมอนทองจันทบุรี ล็อตทดสอบ"));b.click()})()' | Out-Null
  Until '!!document.querySelector("#support-initial-detail")'
  ClickText 'มีปัญหาเรื่องราคา / การชำระเงิน'
  Eval '(()=>{const t=document.querySelector("#support-initial-detail");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(t,"ทดสอบปัญหาการชำระเงิน");t.dispatchEvent(new Event("input",{bubbles:true}))})()' | Out-Null
  Capture 'desktop-help-topic'
  Eval 'document.querySelector(''button[aria-label="ส่งคำร้อง"]'').click()' | Out-Null
  Until 'document.body.textContent.includes("มีอีก 2 เรื่องก่อนคุณ")'
  Check 'topic submission preserves category and queue feedback' 'window.__supportCreated.category==="PAYMENT"&&window.__supportCreated.roomId===1'
  Check 'conversation shows submitted message' 'document.querySelector("[role=dialog]").textContent.includes("ทดสอบปัญหาการชำระเงิน")'
  Capture 'desktop-help-chat'
  Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true} | Out-Null
  foreach($theme in @('light','dark')) {
    Eval "document.documentElement.dataset.theme='$theme'" | Out-Null
    Check "mobile no horizontal overflow in $theme" 'document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector("[role=dialog]").scrollWidth<=innerWidth+1'
    Check "mobile message composer visible in $theme" '(()=>{const t=document.querySelector(''textarea[aria-label="ข้อความถึงศูนย์ช่วยเหลือ"]'');t.scrollIntoView({block:"end"});const r=t.getBoundingClientRect();return r.bottom<=innerHeight&&r.top>=0})()'
    Capture "mobile-help-chat-$theme"
  }
