#Requires -Version 5.1

<#
.SYNOPSIS
    Export all MongoDB collections to dated JSON snapshots.

.DESCRIPTION
    Connects to MongoDB (native or Docker), activates the backend Python venv,
    and runs export_data.py which writes each collection to
    data\exports\<timestamp>\<collection>.json plus a _manifest.json.

    The latest symlink / junction is updated after each successful export.

.PARAMETER Docker
    Verify the Docker MongoDB container is running instead of native MongoDB.

.PARAMETER Out
    Custom output directory. Defaults to data\exports\<timestamp>.

.PARAMETER Collections
    Comma-separated list of collection names to export (default: all).

.EXAMPLE
    .\export_data.ps1

.EXAMPLE
    .\export_data.ps1 -Docker

.EXAMPLE
    .\export_data.ps1 -Out C:\backups\mongo -Collections contacts,users
#>

[CmdletBinding()]
param(
    [switch]$Docker,
    [string]$Out,
    [string]$Collections
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot

Write-Host "📦 Funds-Trackon — Data Export" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# ── MongoDB check ──────────────────────────────────────────────────
if ($Docker) {
    $running = docker ps --format "{{.Names}}" 2>$null | Select-String "niveshya-mongo"
    if (-not $running) {
        Write-Host "❌ MongoDB Docker container 'niveshya-mongo' is not running." -ForegroundColor Red
        Write-Host "   Start it with: .\start.ps1" -ForegroundColor White
        exit 1
    }
    Write-Host "✅ MongoDB Docker container detected." -ForegroundColor Green
} else {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("localhost", 27017)
        $tcp.Close()
        Write-Host "✅ MongoDB running on localhost:27017." -ForegroundColor Green
    } catch {
        Write-Host "❌ MongoDB is not running on localhost:27017." -ForegroundColor Red
        Write-Host "   Start with: net start MongoDB" -ForegroundColor White
        Write-Host "   Or use -Docker if running in Docker." -ForegroundColor White
        exit 1
    }
}

# ── Python venv check ──────────────────────────────────────────────
$pythonExe = "$RootDir\backend\venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    Write-Host "❌ Python virtual environment not found at backend\venv." -ForegroundColor Red
    Write-Host "   Run: cd backend; python -m venv venv; venv\Scripts\pip install -r requirements.txt" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🔧 Python environment ready." -ForegroundColor Green

# ── Build script args ──────────────────────────────────────────────
$scriptArgs = @()
if ($Out)         { $scriptArgs += "--out";         $scriptArgs += $Out }
if ($Collections) { $scriptArgs += "--collections"; $scriptArgs += $Collections }

$exportScript = "$RootDir\backend\scripts\export_data.py"

# ── Run export ─────────────────────────────────────────────────────
Write-Host "📊 Running export..." -ForegroundColor Yellow
Write-Host ""

Set-Location "$RootDir\backend"
& $pythonExe $exportScript $scriptArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Export failed (exit code $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}
