#Requires -Version 5.1

<#
.SYNOPSIS
    Start script for funds-trackon development environment
    This script starts the Docker containers for the application

.DESCRIPTION
    Starts the funds-trackon development environment using Docker Compose.
    Builds and starts all services defined in docker-compose.yml.

.PARAMETER NoBuild
    Skip building the Docker images (use existing images)

.PARAMETER NoWait
    Don't wait for services to be ready

.EXAMPLE
    .\start.ps1

.EXAMPLE
    .\start.ps1 -NoBuild

.EXAMPLE
    .\start.ps1 -NoWait
#>

[CmdletBinding()]
param(
    [switch]$NoBuild,
    [switch]$NoWait
)

# Set error action preference
$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting funds-trackon development environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Error "❌ Error: .env file not found. Please create one based on .env.example"
    exit 1
}

# Load environment variables from .env file
try {
    $envContent = Get-Content ".env" | Where-Object { $_ -notmatch '^#' -and $_.Trim() -ne '' }
    foreach ($line in $envContent) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded from .env" -ForegroundColor Green
} catch {
    Write-Warning "⚠️  Could not load .env file: $($_.Exception.Message)"
}

# Build and start Docker containers
$dockerArgs = @("compose", "up", "-d")
if (-not $NoBuild) {
    $dockerArgs += "--build"
}

Write-Host "📦 Building and starting Docker containers..." -ForegroundColor Yellow
& docker $dockerArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to start Docker containers"
    exit $LASTEXITCODE
}

# Wait for services to be ready (unless NoWait is specified)
if (-not $NoWait) {
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Get port values from environment or use defaults
$frontendPort = $env:FRONTEND_PORT
if (-not $frontendPort) { $frontendPort = "3000" }

$backendPort = $env:BACKEND_PORT
if (-not $backendPort) { $backendPort = "8000" }

$mongoPort = $env:MONGO_PORT
if (-not $mongoPort) { $mongoPort = "27017" }

Write-Host "✅ Services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:$backendPort" -ForegroundColor Cyan
Write-Host "🗄️  MongoDB: localhost:$mongoPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Useful commands:" -ForegroundColor Yellow
Write-Host "  docker compose logs -f          # View logs" -ForegroundColor Gray
Write-Host "  docker compose down             # Stop services" -ForegroundColor Gray
Write-Host "  docker compose restart backend  # Restart backend only" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy coding! 🎉" -ForegroundColor Magenta