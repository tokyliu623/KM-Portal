$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$BASE_URL = "http://127.0.0.1:5053"
$TEST_KB_ID = 999
$TEST_KB_NAME = "TestKB"
$TEST_SKILL_NAME = "QualityFuture"
$SKILL_ID = $null
$OUTPUT_DIR = Join-Path $env:TEMP "km-portal-e2e-$(Get-Date -Format yyyyMMdd-HHmmss)"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "=== $msg ===" -ForegroundColor Cyan
}

function Assert-Success($label, $condition) {
    if (-not $condition) {
        Write-Host "[FAIL] $label" -ForegroundColor Red
        exit 1
    }
    Write-Host "[PASS] $label" -ForegroundColor Green
}

New-Item -ItemType Directory -Path $OUTPUT_DIR -Force | Out-Null

Write-Step "Step 1: Health Check"
$health = Invoke-RestMethod "$BASE_URL/api/health" -Method GET -TimeoutSec 5
Assert-Success "Health check" ($health.status -eq "ok")
Write-Host "  Service: $($health.service) v$($health.version)"

Write-Step "Step 2: Cleanup old test data"
$existing = Invoke-RestMethod "$BASE_URL/api/skill" -Method GET -TimeoutSec 5
if ($existing.success -and $existing.data) {
    foreach ($s in $existing.data) {
        if ($s.nameOriginal -eq $TEST_SKILL_NAME -or $s.name -eq "quality-future") {
            Write-Host "  Delete old test Skill: $($s.id)"
            Invoke-RestMethod "$BASE_URL/api/skill/$($s.id)" -Method DELETE -TimeoutSec 5 | Out-Null
        }
    }
}

Write-Step "Step 3: Create Skill (trigger Jiuwen translation)"
$body = @{
    name = $TEST_SKILL_NAME
    description = "E2E test knowledge base"
    kbId = $TEST_KB_ID
    kbName = $TEST_KB_NAME
    permission = "read"
} | ConvertTo-Json -Compress

$create = Invoke-RestMethod "$BASE_URL/api/skill" -Method POST `
    -ContentType "application/json" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
    -TimeoutSec 60

Assert-Success "Create skill response" ($create.success -eq $true)
Assert-Success "Skill data exists" ($null -ne $create.data)
$SKILL_ID = $create.data.id
$SKILL_NAME = $create.data.name
$SKILL_NAME_ORIGINAL = $create.data.nameOriginal

Write-Host "  ID: $SKILL_ID"
Write-Host "  Name: $SKILL_NAME"
Write-Host "  Original: $SKILL_NAME_ORIGINAL"

Write-Step "Step 4: Export Skill zip"
$zipPath = Join-Path $OUTPUT_DIR "skill-export.zip"
try {
    Invoke-WebRequest "$BASE_URL/api/skill/$SKILL_ID/export" -TimeoutSec 30 -OutFile $zipPath
} catch {
    Write-Host "[FAIL] Download failed: $_" -ForegroundColor Red
    exit 1
}

$zipSize = (Get-Item $zipPath).Length
Write-Host "  File size: $zipSize bytes"
Assert-Success "Zip file not empty" ($zipSize -gt 1000)

Write-Step "Step 5: Verify zip content"
$7zExe = Get-Command 7z -ErrorAction SilentlyContinue
if (-not $7zExe) {
    $7zExe = Get-Command "C:\Program Files\7-Zip\7z.exe" -ErrorAction SilentlyContinue
}
if ($7zExe) {
    $listOutput = & $7zExe.Source l $zipPath 2>&1 | Out-String
    Write-Host $listOutput
    Assert-Success "Zip contains SKILL.md" ($listOutput -match "SKILL\.md")
    Assert-Success "Zip contains README.md" ($listOutput -match "README\.md")
    Assert-Success "Zip contains kb_client.py" ($listOutput -match "kb_client\.py")
    Assert-Success "Zip contains user.json" ($listOutput -match "user\.json")
} else {
    Write-Host "  [WARN] 7z not installed, skip zip content verification"
}

Write-Step "Step 6: Cleanup test data"
Invoke-RestMethod "$BASE_URL/api/skill/$SKILL_ID" -Method DELETE -TimeoutSec 5 | Out-Null
Write-Host "  Deleted test Skill"

Write-Step "Step 7: Cleanup temp files"
Remove-Item -LiteralPath $OUTPUT_DIR -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "  Cleaned $OUTPUT_DIR"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All 7 steps passed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green