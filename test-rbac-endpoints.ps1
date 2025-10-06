#Requires -Version 5.1

<#
.SYNOPSIS
    Test RBAC endpoints manually
    This script tests the admin settings endpoints to verify they work correctly

.DESCRIPTION
    Tests various RBAC (Role-Based Access Control) endpoints in the funds-trackon backend.
    Can test both public endpoints and authenticated endpoints that require JWT tokens.

.PARAMETER BaseUrl
    Base URL of the backend API (default: http://localhost:8000)

.PARAMETER Token
    JWT authentication token for testing protected endpoints

.PARAMETER SkipAuthTests
    Skip tests that require authentication

.EXAMPLE
    .\test-rbac-endpoints.ps1

.EXAMPLE
    .\test-rbac-endpoints.ps1 -BaseUrl "http://localhost:8001"

.EXAMPLE
    .\test-rbac-endpoints.ps1 -Token "your-jwt-token-here"
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8000",
    [string]$Token,
    [switch]$SkipAuthTests
)

# Remove trailing slash from BaseUrl
$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "Testing RBAC endpoints..." -ForegroundColor Green
Write-Host "Base URL: $BaseUrl" -ForegroundColor Cyan
Write-Host ""

# Function to make HTTP requests
function Invoke-HttpRequest {
    param(
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body
    )

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            Headers = $Headers
        }

        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }

        $response = Invoke-WebRequest @params
        return @{
            StatusCode = $response.StatusCode
            Content = $response.Content
            Success = $true
        }
    } catch {
        return @{
            StatusCode = $_.Exception.Response.StatusCode.value__
            Content = $_.Exception.Message
            Success = $false
        }
    }
}

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Uri,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body,
        [bool]$RequiresAuth = $false
    )

    Write-Host "Testing $Name..." -ForegroundColor Yellow

    if ($RequiresAuth -and -not $Token) {
        Write-Host "  ⏭️  Skipped (requires authentication token)" -ForegroundColor Gray
        return
    }

    $result = Invoke-HttpRequest -Uri $Uri -Method $Method -Headers $Headers -Body $Body

    if ($result.Success) {
        Write-Host "  ✅ $($result.StatusCode) - Success" -ForegroundColor Green
        try {
            $jsonContent = $result.Content | ConvertFrom-Json
            Write-Host "  📄 Response: $($jsonContent | ConvertTo-Json -Compress)" -ForegroundColor Gray
        } catch {
            Write-Host "  📄 Response: $($result.Content)" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ $($result.StatusCode) - Failed" -ForegroundColor Red
        Write-Host "  📄 Error: $($result.Content)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test public endpoints
Write-Host "🌐 Testing public endpoints..." -ForegroundColor Magenta
Write-Host ""

Test-Endpoint -Name "Health Check" -Uri "$BaseUrl/health"
Test-Endpoint -Name "Root Endpoint" -Uri "$BaseUrl/"

# Test authenticated endpoints
if (-not $SkipAuthTests) {
    Write-Host "🔐 Testing authenticated endpoints..." -ForegroundColor Magenta
    Write-Host ""

    $authHeaders = @{}
    if ($Token) {
        $authHeaders.Authorization = "Bearer $Token"
    }

    Test-Endpoint -Name "Current User" -Uri "$BaseUrl/api/auth/me" -Headers $authHeaders -RequiresAuth $true
    Test-Endpoint -Name "User Permissions" -Uri "$BaseUrl/api/roles/permissions" -Headers $authHeaders -RequiresAuth $true
    Test-Endpoint -Name "Roles List" -Uri "$BaseUrl/api/roles" -Headers $authHeaders -RequiresAuth $true
    Test-Endpoint -Name "Users List" -Uri "$BaseUrl/api/users" -Headers $authHeaders -RequiresAuth $true
    Test-Endpoint -Name "Contacts List" -Uri "$BaseUrl/api/contacts" -Headers $authHeaders -RequiresAuth $true
}

# Instructions for getting token
if (-not $Token -and -not $SkipAuthTests) {
    Write-Host "💡 To test authenticated endpoints:" -ForegroundColor Cyan
    Write-Host "1. Start the backend server: cd backend; python main.py" -ForegroundColor White
    Write-Host "2. Login through the frontend to get a valid JWT token" -ForegroundColor White
    Write-Host "3. Run this script with the token:" -ForegroundColor White
    Write-Host "   .\test-rbac-endpoints.ps1 -Token 'YOUR_JWT_TOKEN'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or skip auth tests:" -ForegroundColor White
    Write-Host "   .\test-rbac-endpoints.ps1 -SkipAuthTests" -ForegroundColor White
}

Write-Host "🎉 RBAC endpoint testing completed!" -ForegroundColor Green