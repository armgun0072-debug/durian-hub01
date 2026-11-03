# Requires the isolated production server at localhost:3112. All API data is mocked in the browser.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$output = Join-Path $root 'docs/account-ui-preview'
$profile = Join-Path $root ('.local/edge-account-' + [guid]::NewGuid().ToString('N'))
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
  $edge = Start-Process -FilePath 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' -ArgumentList @('--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port=9226',"--user-data-dir=$profile",'about:blank') -WindowStyle Hidden -PassThru
  $page = $null
  for ($i=0;$i -lt 50;$i++) {
    try { $targets = (Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:9226/json/list').Content | ConvertFrom-Json; $page = $targets | Where-Object { $_.type -eq 'page' -and $_.url -eq 'about:blank' } | Select-Object -First 1; if($page){break} } catch {}
    Start-Sleep -Milliseconds 100
  }
  if (!$page) { throw 'Edge debugging endpoint unavailable' }
  $socket = [Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync([Uri]$page.webSocketDebuggerUrl,[Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null
  Cdp 'Page.enable' | Out-Null
  Cdp 'Runtime.enable' | Out-Null
  Cdp 'Emulation.setDeviceMetricsOverride' @{width=1440;height=1000;deviceScaleFactor=1;mobile=$false} | Out-Null
  $fixture = @'
(() => {
  const user={id:10,fullName:'Account Test',avatarUrl:null,email:'account@example.test',phone:'0800000000',isEmailVerified:true,businessName:'Test Orchard',province:'จันทบุรี',primaryRole:'SELLER',activeRole:'SELLER',approvedRoles:['SELLER','BUYER'],trustScore:90,rating:4.5,ratingCount:2,
    roles:[{roleType:'SELLER',businessName:'Test Orchard',description:'Orchard description',status:'ACTIVE',isVerified:true},{roleType:'BUYER',businessName:'Test Yard',description:'Yard description',status:'ACTIVE',isVerified:false}]};
  const original=window.fetch.bind(window);window.__requests=[];window.__account=user;window.__profileFailed=false;window.__passwordFailed=false;
  window.fetch=async (input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href);if(!url.pathname.startsWith('/api/'))return original(input,options);
    const body=typeof options.body==='string'?JSON.parse(options.body):null;const method=options.method||'GET';window.__requests.push({path:url.pathname,method,body});
    let data={success:true},status=200;
    if(url.pathname==='/api/auth/me')data={authenticated:true,user};
    else if(url.pathname==='/api/user/profile'){
      if(method==='GET'){
        if(!window.__profileFailed){window.__profileFailed=true;status=500;data={error:'Fixture load failure'};}
        else data={user,provinces:['จันทบุรี','ยะลา'],requests:[{id:5,requestedRole:'CUTTER',status:'REJECTED',adminRemark:'Please resubmit documents'}]};
      } else {if(body.section==='personal'){user.fullName=body.fullName.trim();user.province=body.province;}
        else {const r=user.roles.find(r=>r.roleType===body.roleType);r.businessName=body.businessName.trim();r.description=body.description.trim();user.businessName=user.roles.find(r=>r.roleType===user.activeRole).businessName;}
        data={success:true,user};}
    }
    else if(url.pathname==='/api/user/avatar'){
      user.avatarUrl=method==='DELETE'?null:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV9kAAAAASUVORK5CYII=';data={success:true,avatarUrl:user.avatarUrl};
    }
    else if(url.pathname==='/api/user/password'){
      if(!window.__passwordFailed){window.__passwordFailed=true;status=400;data={error:'Current password rejected'};} else data={success:true};
    }
    else if(url.pathname==='/api/posts')data={posts:[]};
    else if(url.pathname==='/api/chat/rooms')data={rooms:[]};
    else if(url.pathname.includes('role-requests'))data={requests:[]};
    return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  };
  window.__setField=(id,value)=>{const e=document.getElementById(id);Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));};
})()
'@
  Cdp 'Page.addScriptToEvaluateOnNewDocument' @{source=$fixture} | Out-Null
  Cdp 'Page.navigate' @{url='http://localhost:3112'} | Out-Null
  Until '!!document.querySelector(''button[aria-label="จัดการบัญชี"]'')'
  Eval 'document.querySelector(''button[aria-label="จัดการบัญชี"]'').click()' | Out-Null
  ClickText 'จัดการบัญชี'
  Until 'document.querySelector("[role=dialog]").textContent.includes("โหลดข้อมูลไม่สำเร็จ")'
  Check 'profile load failure is visible and retryable' '!![...document.querySelectorAll("button")].find(e=>e.textContent==="ลองอีกครั้ง")'
  ClickText 'ลองอีกครั้ง'
  Until '!!document.getElementById("account-name")'
  Check 'four account sections are present' 'document.querySelectorAll("[role=dialog] nav button").length===4'
  Check 'email and phone are visible but not editable' 'document.querySelector("[role=dialog]").textContent.includes("account@example.test")&&document.querySelector("[role=dialog]").textContent.includes("0800000000")&&!document.querySelector(''[role=dialog] input[type=email], [role=dialog] input[type=tel]'')'
  Check 'no face presets are offered' '!document.querySelector("[role=dialog]").textContent.includes("preset")'
  Eval 'window.__setField("account-name","Updated Account")' | Out-Null
  Eval '(()=>{const s=document.getElementById("account-province");s.value="ยะลา";s.dispatchEvent(new Event("change",{bubbles:true}))})()' | Out-Null
  Eval 'document.querySelector("[role=dialog] form").requestSubmit()' | Out-Null
  Until 'document.querySelector("[role=dialog]").textContent.includes("บันทึกเรียบร้อยแล้ว")'
  Check 'personal save sends only personal fields' 'window.__requests.some(r=>r.path==="/api/user/profile"&&r.method==="PATCH"&&r.body.section==="personal"&&r.body.fullName==="Updated Account"&&r.body.province==="ยะลา"&&!("phone" in r.body)&&!("email" in r.body))'
  $node = Cdp 'DOM.getDocument'
  $fileInput = Cdp 'DOM.querySelector' @{nodeId=$node.root.nodeId;selector='#account-avatar'}
  Cdp 'DOM.setFileInputFiles' @{nodeId=$fileInput.nodeId;files=@((Join-Path $root 'docs/role-ui-preview/chat-light.png'))} | Out-Null
  Until '!!document.querySelector(''[role=dialog] img'')'
  Check 'avatar upload updates preview' 'window.__requests.some(r=>r.path==="/api/user/avatar"&&r.method==="POST")'
  ClickText 'ลบรูป'
  Until '!document.querySelector(''[role=dialog] img'')'
  Check 'avatar deletion restores initials' 'window.__requests.some(r=>r.path==="/api/user/avatar"&&r.method==="DELETE")'
  Capture 'personal-light-desktop'
  ClickText 'กิจการและบทบาท'
  Eval '(()=>{const s=document.getElementById("account-business-role");s.value="BUYER";s.dispatchEvent(new Event("change",{bubbles:true}))})()' | Out-Null
  Until 'document.getElementById("account-business-name").value==="Test Yard"'
  Eval 'window.__setField("account-business-name","Updated Yard");window.__setField("account-business-description","Updated buyer description")' | Out-Null
  Eval 'document.querySelector("[role=dialog] form").requestSubmit()' | Out-Null
  Until 'document.querySelector("[role=dialog]").textContent.includes("บันทึกเรียบร้อยแล้ว")'
  Check 'buyer business save leaves seller and active role unchanged' 'window.__account.roles[1].businessName==="Updated Yard"&&window.__account.roles[0].businessName==="Test Orchard"&&window.__account.activeRole==="SELLER"&&!window.__requests.some(r=>r.path==="/api/user/active-role")'
  Check 'role status, rejection feedback and real reputation are shown' 'document.querySelector("[role=dialog]").textContent.includes("Please resubmit documents")&&document.querySelector("[role=dialog]").textContent.includes("4.5/5")&&document.querySelector("[role=dialog]").textContent.includes("90/100")'
  Capture 'business-light-desktop'
  ClickText 'การตั้งค่า'
  Eval '(()=>{const s=document.getElementById("account-language");s.value="EN";s.dispatchEvent(new Event("change",{bubbles:true}))})()' | Out-Null
  Until 'document.querySelector("[role=dialog]").textContent.includes("Preferences")'
  Check 'language updates the app and persists in this browser' 'localStorage.getItem("durian-hub-language")==="EN"&&document.documentElement.lang==="en"'
  Eval 'document.querySelector(''[role=dialog] button[aria-label="Dark mode"]'').click()' | Out-Null
  Until 'document.documentElement.dataset.theme==="dark"'
  Check 'theme preference persists' 'Object.keys(localStorage).some(k=>localStorage.getItem(k)==="dark")'
  Capture 'preferences-dark-desktop'
  Cdp 'Emulation.setDeviceMetricsOverride' @{width=390;height=844;deviceScaleFactor=1;mobile=$true} | Out-Null
  ClickText 'Business & roles'
  Check 'mobile dialog stays inside viewport' '(()=>{const r=document.querySelector("[role=dialog]>div").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()'
  Check 'mobile document has no horizontal overflow' 'document.documentElement.scrollWidth<=innerWidth+1'
  Capture 'business-dark-mobile'
  ClickText 'Security'
  Eval 'window.__setField("account-current-password","wrong-password");window.__setField("account-new-password","new-password");window.__setField("account-confirm-password","mismatch-password")' | Out-Null
  Eval 'document.querySelector("[role=dialog] form").requestSubmit()' | Out-Null
  Until 'document.querySelector("[role=alert]").textContent.includes("do not match")'
  Check 'mismatched passwords are blocked before API request' '!window.__requests.some(r=>r.path==="/api/user/password")'
  Eval 'window.__setField("account-confirm-password","new-password")' | Out-Null
  Eval 'document.querySelector("[role=dialog] form").requestSubmit()' | Out-Null
  Until 'document.querySelector("[role=alert]").textContent.includes("Current password rejected")'
  Check 'server password error remains visible for correction' '!!document.getElementById("account-current-password")'
  Capture 'security-error-mobile'
  Eval 'window.__setField("account-current-password","old-password")' | Out-Null
  Eval 'document.querySelector("[role=dialog] form").requestSubmit()' | Out-Null
  Until 'document.querySelector("[role=dialog]").textContent.includes("Password changed")'
  Check 'successful password change clears password fields' '!document.querySelector(''[role=dialog] input[type=password]'')'
  ClickText 'Go to sign in'
  Until '!document.querySelector("[role=dialog]")&&!document.querySelector(''button[aria-label="Account settings"]'')'
  Check 'password completion returns to the signed-out screen' 'document.body.textContent.includes("Password changed. Please sign in again.")'
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
