#Requires -Version 5.1

<#
.SYNOPSIS
    Stop script for funds-trackon development environment
    This script stops and removes the Docker containers

.DESCRIPTION
    Stops and removes all Docker containers, networks, and optionally volumes
    for the funds-trackon development environment.

.PARAMETER RemoveVolumes
    Also remove Docker volumes (this will delete all data)

.PARAMETER Force
    Force stop containers without confirmation

.EXAMPLE
    .\stop.ps1

.EXAMPLE
    .\stop.ps1 -RemoveVolumes

.EXAMPLE
    .\stop.ps1 -Force
#>

[CmdletBinding()]
param(
    [switch]$RemoveVolumes,
    [switch]$Force
)

Write-Host "🛑 Stopping funds-trackon development environment..." -ForegroundColor Red

# Confirm if not forced
if (-not $Force) {
    $confirmation = Read-Host "Are you sure you want to stop the Docker containers? (y/N)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Stop and remove containers, networks
$dockerArgs = @("compose", "down")

if ($RemoveVolumes) {
    $dockerArgs += "-v"
    Write-Host "⚠️  Removing volumes (this will delete all data)..." -ForegroundColor Yellow
}

& docker $dockerArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to stop Docker containers"
    exit $LASTEXITCODE
}

Write-Host "✅ Services stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To start again, run: .\start.ps1" -ForegroundColor Cyan