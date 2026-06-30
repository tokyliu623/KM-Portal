$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot | Split-Path -Parent
Set-Location $projectRoot

$env:PORT = "5053"
$env:LLM_API_KEY = "app-o9H3eKSdVRMxDH8KaVWqdboe"
$env:LLM_BOT_ID = "746898549"
$env:LLM_API_URL = "http://jiuwen-api.vmic.xyz/v1/chat-messages"
$env:KM_API_KEY = "km-test-key"
$env:WIKI_BASE_URL = "https://wiki.vivo.xyz"

Write-Host "=== Starting v1.7.1 binary ==="
$proc = Start-Process -FilePath "npx" -ArgumentList "tsx","src/server/index.ts" -RedirectStandardOutput ".\server.log" -RedirectStandardError ".\server.err.log" -NoNewWindow -PassThru
Write-Host "Started PID: $($proc.Id)"
Start-Sleep -Seconds 5

Write-Host "=== [1] Health Check ==="
try {
  $h = Invoke-RestMethod "http://127.0.0.1:5053/api/health" -TimeoutSec 5
  Write-Host "  status: $($h.status), service: $($h.service), version: $($h.version)"
} catch {
  Write-Host "  FAIL: $_"
}

Write-Host "=== [2] Translate Health ==="
try {
  $t = Invoke-RestMethod "http://127.0.0.1:5053/api/diag/translate-health" -TimeoutSec 15
  Write-Host "  llm_configured: $($t.data.llm_configured), bot_id: $($t.data.bot_id), reachable: $($t.data.reachable), latency_ms: $($t.data.latency_ms)"
} catch {
  Write-Host "  FAIL: $_"
}

Write-Host "=== [3] Boot credential log ==="
if (Test-Path .\server.log) {
  Get-Content .\server.log | Where-Object { $_ -match '\[Boot\]' } | ForEach-Object { Write-Host "  $_" }
} else {
  Write-Host "  No server.log"
}

Write-Host "=== [4] Field compat: kb_id (snake) ==="
try {
  $r1 = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5053/api/kb/tree" -Body (ConvertTo-Json @{kb_id="99999"}) -ContentType "application/json" -TimeoutSec 5
  Write-Host "  snake_case kb_id response: success=$($r1.success)"
} catch {
  Write-Host "  snake_case response (may be 401/404, NOT 400): $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "=== [5] Field compat: kbId (camel) ==="
try {
  $r2 = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5053/api/kb/tree" -Body (ConvertTo-Json @{kbId="99999"}) -ContentType "application/json" -TimeoutSec 5
  Write-Host "  camelCase kbId response: success=$($r2.success)"
} catch {
  Write-Host "  camelCase response (may be 401/404, NOT 400): $($_.Exception.Response.StatusCode.value__)"
}

Write-Host "=== [6] Empty body should return 400 ==="
try {
  $r3 = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:5053/api/kb/tree" -Body "{}" -ContentType "application/json" -TimeoutSec 5
  Write-Host "  empty body: UNEXPECTED success=$($r3.success)"
} catch {
  Write-Host "  empty body: status=$($_.Exception.Response.StatusCode.value__) (expected 400)"
}

Write-Host "=== [7] Skills list ==="
try {
  $s = Invoke-RestMethod "http://127.0.0.1:5053/api/skill/" -TimeoutSec 5
  Write-Host "  skills count: $($s.data.Count)"
} catch {
  Write-Host "  FAIL: $_"
}

Write-Host "=== [8] Tokens list ==="
try {
  $tk = Invoke-RestMethod "http://127.0.0.1:5053/api/admin/tokens" -TimeoutSec 5
  Write-Host "  tokens count: $($tk.data.Count)"
} catch {
  Write-Host "  FAIL: $_"
}

Write-Host "=== [9] Cleanup: kill test process ==="
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "  PID $($proc.Id) stopped"
Write-Host "=== ALL E2E TESTS DONE ==="
