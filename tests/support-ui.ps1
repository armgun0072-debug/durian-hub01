# Isolated production preview on localhost:3112; all API calls use browser fixtures.
$sourceText = Get-Content -Raw -Encoding utf8 (Join-Path $PSScriptRoot 'roles-ui.ps1')
$sourceText = $sourceText.Replace('docs/role-ui-preview','docs/support-ui-preview').Replace('.local/edge-role-','.local/edge-support-').Replace('9225','9226')
$sourceText = $sourceText.Replace('[Uri]$page.webSocketDebuggerUrl', '[Uri]($page.webSocketDebuggerUrl -replace ''localhost'',''127.0.0.1'')')
$startIndex = $sourceText.IndexOf("  Cdp 'Page.addScriptToEvaluateOnNewDocument'")
$endIndex = $sourceText.IndexOf('  if($script:runtimeErrors.Count)')
$steps = Get-Content -Raw -Encoding utf8 (Join-Path $PSScriptRoot 'support-ui.steps.ps1')
$sourceText = $sourceText.Substring(0,$startIndex) + $steps + "`r`n" + $sourceText.Substring($endIndex)
# Preserve PSScriptRoot for the shared browser runner's workspace/output paths.
$sourceText = $sourceText.Replace('$root = Split-Path -Parent $PSScriptRoot', '$root = ' + "'" + (Split-Path -Parent $PSScriptRoot).Replace("'", "''") + "'")
& ([ScriptBlock]::Create($sourceText))
