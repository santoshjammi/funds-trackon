#Requires -Version 5.1

<#
.SYNOPSIS
    Start funds-trackon natively (no Docker).

.DESCRIPTION
    Starts the backend (FastAPI) and frontend (React) directly on the host.
    Requires MongoDB to already be running locally on port 27017.

.PARAMETER BackendPort
    Port for the backend API (default: 8001)

.PARAMETER FrontendPort
    Port for the frontend dev server (default: 3002)

.PARAMETER MongoUrl
    Full MongoDB connection string (default: mongodb://localhost:27017/trackon_lead_management)

.EXAMPLE
    .\start-native.ps1

.EXAMPLE
    .\start-native.ps1 -BackendPort 8001 -FrontendPort 3002
#>

[CmdletBinding()]
param(
    [int]$BackendPort    = 8001,
    [int]$FrontendPort   = 3002,
    [string]$MongoUrl    = "mongodb://localhost:27017/trackon_lead_management"
)

$ErrorActionPreference = "Stop"
$RootDir = $PSScriptRoot

# ── Helpers ────────────────────────────────────────────────────────
function Kill-Port {
    param([int]$Port)
    $pids = netstat -ano 2>$null |
        Select-String ":$Port\s" |
        ForEach-Object { ($_.ToString().Trim() -split '\s+')[-1] } |
        Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and [int]$p -gt 0) {
            try { Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue } catch {}
        }
    }
}

function Wait-ForPort {
    param([int]$Port, [string]$Label, [int]$Retries = 40)
    while ($Retries -gt 0) {
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $tcp.Connect("localhost", $Port)
            $tcp.Close()
            Write-Host "  ✓ $Label ready on port $Port" -ForegroundColor Green
            return $true
        } catch {
            $Retries--
            Start-Sleep -Milliseconds 500
        }
    }
    Write-Host "  ✗ $Label did not start on port $Port" -ForegroundColor Red
    return $false
}

# ── MongoDB check ──────────────────────────────────────────────────
Write-Host "🗄️  Checking MongoDB..." -ForegroundColor Yellow
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("localhost", 27017)
    $tcp.Close()
    Write-Host "  ✓ MongoDB running on localhost:27017" -ForegroundColor Green
} catch {
    Write-Host "  ✗ MongoDB is not running on localhost:27017" -ForegroundColor Red
    Write-Host "  Start it with: net start MongoDB" -ForegroundColor White
    Write-Host "  Or install from: https://www.mongodb.com/try/download/community" -ForegroundColor White
    exit 1
}

# ── Backend ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "🔧 Starting backend on port $BackendPort..." -ForegroundColor Yellow
Kill-Port $BackendPort

$backendLogOut = "$env:TEMP\funds-trackon-backend.log"
$backendLogErr = "$env:TEMP\funds-trackon-backend-err.log"
$pythonExe     = Join-Path $RootDir "backend\venv\Scripts\python.exe"

if (-not (Test-Path $pythonExe)) {
    Write-Host "  ✗ Python venv not found at backend\venv." -ForegroundColor Red
    Write-Host "  Run: cd backend && python -m venv venv && venv\Scripts\pip install -r requirements.txt" -ForegroundColor White
    exit 1
}

$env:MONGODB_URL = $MongoUrl
$env:PORT        = $BackendPort

$backendProcess = Start-Process `
    -FilePath $pythonExe `
    -ArgumentList "main.py" `
    -WorkingDirectory (Join-Path $RootDir "backend") `
    -RedirectStandardOutput $backendLogOut `
    -RedirectStandardError  $backendLogErr `
    -PassThru -NoNewWindow

if (-not (Wait-ForPort $BackendPort "Backend")) {
    Write-Host "  Check logs: $backendLogOut / $backendLogErr" -ForegroundColor Red
    try { $backendProcess.Kill() } catch {}
    exit 1
}

# ── Frontend ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "🌐 Starting frontend on port $FrontendPort..." -ForegroundColor Yellow
Kill-Port $FrontendPort

$frontendLogOut = "$env:TEMP\funds-trackon-frontend.log"
$frontendLogErr = "$env:TEMP\funds-trackon-frontend-err.log"

$env:PORT                  = $FrontendPort
$env:REACT_APP_API_BASE_URL = ""

$frontendProcess = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList "start" `
    -WorkingDirectory (Join-Path $RootDir "frontend") `
    -RedirectStandardOutput $frontendLogOut `
    -RedirectStandardError  $frontendLogErr `
    -PassThru -NoNewWindow

if (-not (Wait-ForPort $FrontendPort "Frontend")) {
    Write-Host "  Check logs: $frontendLogOut / $frontendLogErr" -ForegroundColor Red
    try { $backendProcess.Kill() }  catch {}
    try { $frontendProcess.Kill() } catch {}
    exit 1
}

# ── Done ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "✅ All services running!" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  →  http://localhost:$FrontendPort"  -ForegroundColor Cyan
Write-Host "  Backend   →  http://localhost:$BackendPort/docs" -ForegroundColor Cyan
Write-Host "  MongoDB   →  localhost:27017"                  -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs:" -ForegroundColor Gray
Write-Host "  $backendLogOut" -ForegroundColor Gray
Write-Host "  $frontendLogOut" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor Yellow

try {
    while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host ""
    Write-Host "Stopping services..." -ForegroundColor Yellow
    if (-not $backendProcess.HasExited)  { try { $backendProcess.Kill()  } catch {} }
    if (-not $frontendProcess.HasExited) { try { $frontendProcess.Kill() } catch {} }
    Write-Host "Done." -ForegroundColor Green
}
