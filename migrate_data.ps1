#Requires -Version 5.1

<#
.SYNOPSIS
    Migrate all JSON/CSV data into MongoDB for funds-trackon.

.DESCRIPTION
    Imports all data files from the data\ directory into MongoDB using the
    backend Python import script. Works with both native MongoDB and Docker.

.PARAMETER NoClear
    Append to existing data instead of clearing first (default: clear before import)

.PARAMETER Docker
    Verify the Docker MongoDB container is running instead of native MongoDB

.EXAMPLE
    .\migrate_data.ps1

.EXAMPLE
    .\migrate_data.ps1 -NoClear

.EXAMPLE
    .\migrate_data.ps1 -Docker
#>

[CmdletBinding()]
param(
    [switch]$NoClear,
    [switch]$Docker
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot

Write-Host "🚀 Starting Funds-Trackon Data Migration" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# ── Check MongoDB ──────────────────────────────────────────────────
if ($Docker) {
    $running = docker ps --format "{{.Names}}" 2>$null | Select-String "niveshya-mongo"
    if (-not $running) {
        Write-Host "❌ MongoDB container is not running. Please start the services first:" -ForegroundColor Red
        Write-Host "   .\start.ps1" -ForegroundColor White
        exit 1
    }
    Write-Host "✅ MongoDB Docker container detected." -ForegroundColor Green
} else {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 27017)
        $tcp.Close()
        Write-Host "✅ MongoDB running on localhost:27017" -ForegroundColor Green
    } catch {
        Write-Host "❌ MongoDB is not running on localhost:27017." -ForegroundColor Red
        Write-Host "   Start native: net start MongoDB" -ForegroundColor White
        Write-Host "   Start Docker: .\start.ps1" -ForegroundColor White
        Write-Host "   Then re-run:  .\migrate_data.ps1 -Docker" -ForegroundColor White
        exit 1
    }
}

# ── Check data directory ───────────────────────────────────────────
if (-not (Test-Path "$RootDir\data")) {
    Write-Host "❌ Data directory not found. Ensure data files are in the 'data\' folder." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📁 Checking data files..." -ForegroundColor Yellow

$dataFiles = @(
    "rearrangedContacts.json",
    "people.json",
    "summary_FR.json",
    "users.json",
    "opportunity.json",
    "tasks.json",
    "tracker.json"
)

$missingFiles = @()
foreach ($file in $dataFiles) {
    if (Test-Path "$RootDir\data\$file") {
        Write-Host "   ✅ Found: $file" -ForegroundColor Green
    } else {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing data files:" -ForegroundColor Yellow
    foreach ($f in $missingFiles) { Write-Host "   - $f" -ForegroundColor Yellow }
    Write-Host "   Continuing with available files..." -ForegroundColor Yellow
}

# ── Check Python venv ──────────────────────────────────────────────
$pythonExe = "$RootDir\backend\venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host ""
    Write-Host "❌ Python virtual environment not found at backend\venv." -ForegroundColor Red
    Write-Host "   Run: cd backend && python -m venv venv && venv\Scripts\pip install -r requirements.txt" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔧 Python environment ready." -ForegroundColor Green

# ── Run import ─────────────────────────────────────────────────────
$importScript = "$RootDir\backend\scripts\import_data.py"
$importArgs   = @($importScript)

if (-not $NoClear) {
    Write-Host "🗑️  Clearing existing data before import..." -ForegroundColor Yellow
    $importArgs += "--clear"
} else {
    Write-Host "➕ Appending to existing data (--no-clear mode)..." -ForegroundColor Yellow
}

Write-Host "📊 Running data import..." -ForegroundColor Yellow
Write-Host ""

& $pythonExe $importArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Data import failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "✅ Data migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your data is now available in MongoDB." -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Start your application:" -ForegroundColor Yellow
Write-Host "   Docker:  .\start.ps1"        -ForegroundColor White
Write-Host "   Native:  .\start-native.ps1" -ForegroundColor White
