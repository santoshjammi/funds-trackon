#!/bin/bash

# Test RBAC endpoints manually
# This script tests the admin settings endpoints to verify they work correctly

echo "Testing RBAC endpoints..."

# Assuming backend is running on http://localhost:8001
BASE_URL="http://localhost:8001"

# First, get a token by logging in (you'll need to adjust credentials)
echo "Testing health endpoint..."
curl -s "$BASE_URL/health" | jq .

echo -e "\n\nTesting permissions endpoint (requires auth token)..."
echo "You'll need to:"
echo "1. Start the backend server: cd backend && python main.py"
echo "2. Login through the frontend to get a valid token"
echo "3. Use that token to test these endpoints:"
echo ""
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/api/roles/permissions"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/api/roles"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/api/users/"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' $BASE_URL/api/auth/me"