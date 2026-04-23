#Requires -Version 5.1

<#
.SYNOPSIS
    Stop natively-running funds-trackon services (backend + frontend).

.DESCRIPTION
    Kills any processes occupying the backend (8001), frontend (3002),
    and fallback frontend (3000) ports. Use this when you started the
    application with .\start-native.ps1 rather than Docker.

.PARAMETER Force
    Skip the confirmation prompt before killing processes.

.EXAMPLE
    .\stop-native.ps1

.EXAMPLE
    .\stop-native.ps1 -Force
#>

[CmdletBinding()]
param(
    [switch]$Force
)

$ErrorActionPreference = "Stop"

Write-Host "🛑 Stopping funds-trackon native services..." -ForegroundColor Red

# Confirm if not forced
if (-not $Force) {
    $confirmation = Read-Host "Kill processes on ports 8001, 3002, 3000? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

function Stop-Port {
    param([int]$Port)
    $killed = $false
    try {
        $entries = netstat -ano 2>$null |
            Select-String ":$Port\s" |
            ForEach-Object { ($_.ToString().Trim() -split '\s+')[-1] } |
            Where-Object { $_ -match '^\d+$' -and [int]$_ -gt 0 } |
            Sort-Object -Unique

        foreach ($p in $entries) {
            try {
                Stop-Process -Id ([int]$p) -Force -ErrorAction Stop
                $killed = $true
            } catch {
                # Process may have already exited
            }
        }
    } catch {}

    if ($killed) {
        Write-Host "  ✓ Stopped process on port $Port" -ForegroundColor Green
    } else {
        Write-Host "  – Nothing running on port $Port" -ForegroundColor Gray
    }
}

Stop-Port 8001
Stop-Port 3002
Stop-Port 3000

Write-Host ""
Write-Host "✅ Done." -ForegroundColor Green
