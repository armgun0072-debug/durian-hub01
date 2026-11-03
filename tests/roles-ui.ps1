# Requires the isolated production server at localhost:3112. All API data is mocked in the browser.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root 'docs/role-ui-preview'
$profile = Join-Path $root ('.local/edge-role-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force $output,$profile | Out-Null
$edge = $null
$socket = $null
$script:sequence = 0
$script:checks = @()
$script:runtimeErrors = @()
function Cdp($method, $params = @{}) {
  $script:sequence++
  $id = $script:sequence
  $payload = @{id=$id;method=$method;params=$params} | ConvertTo-Json -Depth 40 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($payload)
  $socket.SendAsync([ArraySegment[byte]]::new($bytes),[Net.WebSockets.WebSocketMessageType]::Text,$true,[Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  do {
    $stream = [IO.MemoryStream]::new()
    do {
      $buffer = [byte[]]::new(65536)
      $received = $socket.ReceiveAsync([ArraySegment[byte]]::new($buffer),[Threading.CancellationToken]::None).GetAwaiter().GetResult()
      $stream.Write($buffer,0,$received.Count)
    } until ($received.EndOfMessage)
    $message = [Text.Encoding]::UTF8.GetString($stream.ToArray()) | ConvertFrom-Json
    $stream.Dispose()
    if ($message.method -eq 'Runtime.exceptionThrown') { $script:runtimeErrors += $message.params.exceptionDetails.text }
  } until ($message.id -eq $id)
  if ($message.error) { throw ($message.error | ConvertTo-Json -Compress) }
  return $message.result
}
function Eval($expression) {
  $result = Cdp 'Runtime.evaluate' @{expression=$expression;returnByValue=$true;awaitPromise=$true}
  if ($result.exceptionDetails) { throw ($result.exceptionDetails | ConvertTo-Json -Depth 8) }
  return $result.result.value
}
function Until($expression) {
  for ($i=0;$i -lt 80;$i++) { if (Eval $expression) { return }; Start-Sleep -Milliseconds 100 }
  throw "Timed out: $expression"
}
function Check($label,$expression) {
  if (!(Eval $expression)) { throw "Check failed: $label" }
  $script:checks += $label
}
function ClickText($text) {
  $literal = ConvertTo-Json -InputObject $text -Compress
  Eval "(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.getClientRects().length&&e.textContent.trim()===$literal);if(!e)throw Error('Missing button '+$literal);e.click();return true})()" | Out-Null
  Start-Sleep -Milliseconds 200
}
function Capture($name) {
  Start-Sleep -Milliseconds 250
  $shot = Cdp 'Page.captureScreenshot' @{format='png';captureBeyondViewport=$false}
  [IO.File]::WriteAllBytes((Join-Path $output "$name.png"),[Convert]::FromBase64String($shot.data))
}
try {
  $edge = Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9225',"--user-data-dir=$profile",'about:blank') -WindowStyle Hidden -PassThru
  $page = $null
  for ($i=0;$i -lt 50;$i++) {
    try { $targets = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:9225/json/list').Content | ConvertFrom-Json; $page = $targets | Where-Object { $_.type -eq 'page' -and $_.url -eq 'about:blank' } | Select-Object -First 1; if($page){break} } catch {}
    Start-Sleep -Milliseconds 100
  }
  if (!$page) { throw 'Edge debugging endpoint unavailable' }
  $socket = [Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync([Uri]$page.webSocketDebuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult()
  Cdp 'Page.enable' | Out-Null
  Cdp 'Runtime.enable' | Out-Null
  Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false} | Out-Null
  $fixture = @'
(() => {
  const user={id:10,fullName:'Role Test',businessName:'Test Orchard',phone:'0800000000',province:'จันทบุรี',primaryRole:'SELLER',activeRole:'SELLER',approvedRoles:['SELLER','BUYER'],trustScore:100,rating:5,ratingCount:0};
  const post={id:1,userId:10,authorName:'Role Test',businessName:'Test Orchard',authorRole:'SELLER',postType:'SELL',title:'Old Sell Listing',price:100,pricePerKg:100,priceUnit:'PER_KG',quantityKg:1000,variety:'หมอนทอง',grade:'AB',province:'จันทบุรี',regionTag:'ภาคตะวันออก',rating:5,reviewCount:0,trustScore:100,status:'CLOSED',createdAt:'2020-01-01',availableDate:'2020-01-01'};
  const posts=[post,{...post,id:2,postType:'BUY',authorRole:'BUYER',businessName:'Test Yard',title:'Buy Listing',status:'OPEN'}];
  const messages=[{id:1,sender:'ME',text:'Sent contrast sample',time:'07:53',isRead:false},{id:2,sender:'ME',text:'Read contrast sample',time:'07:54',isRead:true},{id:3,sender:'ME',text:'Sending contrast sample',time:'07:55',status:'SENDING'},{id:4,sender:'PARTNER',text:'Incoming sample',time:'07:56'}];
  const room={id:1,postId:1,partnerId:11,partnerName:'Chat Partner',partnerBusiness:'Partner Yard',partnerRating:5,partnerRatingCount:0,lastActive:'Online',lastMessage:'Incoming sample',lastTime:'07:56',unreadCount:0,post,messages,status:'ACTIVE'};
  const original=window.fetch.bind(window);window.__requests=[];window.__fixtureUser=user;
  window.fetch=async (input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href); if(!url.pathname.startsWith('/api/'))return original(input,options);
    window.__requests.push({path:url.pathname,query:url.search,method:options.method||'GET'});
    let data={success:true};
    if(url.pathname==='/api/auth/me')data={authenticated:true,user};
    else if(url.pathname==='/api/user/active-role'){
      await new Promise(r=>setTimeout(r,150));user.activeRole=JSON.parse(options.body).activeRole;user.businessName=user.activeRole==='BUYER'?'Test Yard':'Test Orchard';data={success:true,activeRole:user.activeRole,businessName:user.businessName};
    }
    else if(url.pathname==='/api/posts/mine'){
      const type=url.searchParams.get('postType'),status=url.searchParams.get('status');const filtered=posts.filter(p=>(!type||p.postType===type)&&(!status||p.status===status));data={posts:filtered,total:filtered.length,page:1,hasMore:false};
    }
    else if(url.pathname==='/api/posts')data={posts};
    else if(url.pathname==='/api/chat/rooms')data={rooms:[room]};
    else if(url.pathname.includes('/messages'))data={messages};
    else if(url.pathname.includes('role-requests'))data={requests:[]};
    return new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
  };
})()
'@
  Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source=$fixture} | Out-Null
  Cdp 'Page.navigate' @{url='http://localhost:3112'} | Out-Null
  Until "!!document.querySelector('button[aria-label=`"จัดการบัญชี`"]')"
  ClickText 'ตลาดกลาง'
  Eval '(()=>{const b=[...document.querySelectorAll("button")].find(e=>e.getClientRects().length&&e.textContent.includes("ประกาศรับซื้อ"));b.click()})()' | Out-Null
  Check 'seller can browse buying category without changing role' 'document.body.textContent.includes("Buy Listing")&&window.__fixtureUser.activeRole==="SELLER"&&!window.__requests.some(r=>r.path==="/api/user/active-role")'
  Eval 'document.querySelector(''button[aria-label="จัดการบัญชี"]'').click()' | Out-Null
  Until "!!document.querySelector('select[aria-label=`"สลับบทบาทในเมนูบัญชี`"]')"
  Check 'desktop account switch offers only approved roles' '(()=>{const s=document.querySelector(''select[aria-label="สลับบทบาทในเมนูบัญชี"]'');return s.getClientRects().length>0&&[...s.options].map(o=>o.value).join()==="SELLER,BUYER"})()'
  Eval '(()=>{const s=document.querySelector(''select[aria-label="สลับบทบาทในเมนูบัญชี"]'');s.value="BUYER";s.dispatchEvent(new Event("change",{bubbles:true}))})()' | Out-Null
  Until 'document.querySelector(''select[aria-label="สลับบทบาทในเมนูบัญชี"]'').value==="BUYER"'
  Check 'switch refreshes business identity without logout' 'document.body.textContent.includes("Test Yard")&&!window.__requests.some(r=>r.path.includes("logout"))'
  Capture 'desktop-role-menu'
  ClickText 'ประวัติการโพสต์ของคุณ'
  Until "document.querySelectorAll('[role=dialog] article').length===2"
  Eval '(()=>{const s=document.querySelector(''select[aria-label="กรองประเภทประกาศ"]'');s.value="SELL";s.dispatchEvent(new Event("change",{bubbles:true}))})()' | Out-Null
  Until "document.querySelectorAll('[role=dialog] article').length===1"
  Check 'history filters old sell posts while buyer role is active' 'document.querySelector("[role=dialog] article").textContent.includes("Old Sell Listing")&&window.__requests.some(r=>r.path==="/api/posts/mine"&&r.query.includes("postType=SELL"))'
  ClickText 'ปิดดีลแล้ว'
  Until 'window.__requests.some(r=>r.query.includes("postType=SELL")&&r.query.includes("status=CLOSED"))'
  Capture 'history-type-and-status'
  ClickText 'ปิดหน้าต่าง'
  ClickText 'ตลาดกลาง'
  ClickText 'ลงประกาศในบทบาท: ล้งรับซื้อ'
  Until '!!document.querySelector(''form button[type="submit"]'')'
  Check 'buyer listing form has a buy category' 'document.querySelector("[role=dialog]").textContent.includes("ตั้งประกาศรับซื้อ")'
  Check 'role switches are disabled while the listing form is open' '[...document.querySelectorAll(''select[aria-label*="สลับบทบาท"]'')].every(e=>e.disabled)'
  Eval 'document.querySelector("[role=dialog] button").click()' | Out-Null
  ClickText 'ข้อความ'
  Eval '(()=>{const b=[...document.querySelectorAll("button")].find(e=>e.textContent.includes("Chat Partner"));b.click()})()' | Out-Null
  Until 'document.body.textContent.includes("Sent contrast sample")'
  foreach ($theme in @('light','dark')) {
    Eval "document.documentElement.dataset.theme='$theme'" | Out-Null
    Start-Sleep -Milliseconds 300
    $colors = Eval '(()=>{return ["Sent contrast sample","Read contrast sample","Sending contrast sample"].map(text=>{const e=[...document.querySelectorAll("div")].find(e=>e.textContent===text),bubble=e.parentElement;const status=e.nextElementSibling;return {text,fg:getComputedStyle(status).color,bg:getComputedStyle(bubble).backgroundColor,child:[...status.querySelectorAll("span,svg")].map(e=>getComputedStyle(e).color)}})})()'
    foreach ($color in $colors) {
      if($color.fg -ne 'rgb(255, 255, 255)' -or $color.bg -ne 'rgb(4, 120, 87)' -or @($color.child | Where-Object {$_ -ne 'rgb(255, 255, 255)'}).Count) { throw "Chat contrast failed in $theme" }
    }
    $script:checks += "chat status, time and icons white on emerald in $theme (5.48:1)"
    Capture "chat-$theme"
  }
  Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true} | Out-Null
  Eval 'document.querySelector(''button[aria-label="จัดการบัญชี"]'').click()' | Out-Null
  Until '!!document.querySelector(''select[aria-label="สลับบทบาทในเมนูบัญชี"]'')'
  Check 'mobile account switch visible in chat' 'document.querySelector(''select[aria-label="สลับบทบาทในเมนูบัญชี"]'').getClientRects().length>0'
  Check 'mobile viewport has no horizontal page overflow' 'document.documentElement.scrollWidth<=innerWidth+1'
  Capture 'mobile-role-menu'
  if($script:runtimeErrors.Count){throw ($script:runtimeErrors -join ', ')}
  @{checks=$script:checks;runtimeErrors=$script:runtimeErrors;api='browser fixtures; no database access'} | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 (Join-Path $output 'checks.json')
  $script:checks | ForEach-Object {Write-Output "PASS $_"}
} finally {
  if($socket -and $socket.State -eq 'Open') { try { Cdp 'Browser.close' | Out-Null } catch {} }
  if($socket){$socket.Dispose()}
  if($edge -and !$edge.HasExited){Stop-Process -Id $edge.Id -ErrorAction SilentlyContinue}
  $resolvedProfile=[IO.Path]::GetFullPath($profile)
  $allowedRoot=[IO.Path]::GetFullPath((Join-Path $root '.local'))+[IO.Path]::DirectorySeparatorChar
  if($resolvedProfile.StartsWith($allowedRoot,[StringComparison]::OrdinalIgnoreCase)) {Remove-Item -LiteralPath $resolvedProfile -Recurse -Force -ErrorAction SilentlyContinue}
}
