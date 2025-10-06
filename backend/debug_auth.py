#!/usr/bin/env python3
"""
Debug script to test RBAC endpoints manually
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import init_db
from app.models.user import User
from app.controllers.auth_controller import create_access_token
from app.utils.config import get_settings
from datetime import timedelta
import requests
import json

async def test_authentication():
    print("Testing RBAC authentication flow...")
    
    # Initialize database
    await init_db()
    
    # Get settings
    settings = get_settings()
    print(f"Using secret key: {settings.secret_key}")
    
    # Find a test user
    user = await User.find_one({"email": {"$exists": True}})
    if not user:
        print("No users found in database!")
        return
    
    print(f"Found user: {user.email} (ID: {user.id})")
    print(f"User roles: {user.get_role_names()}")
    print(f"User active: {user.is_active}")
    
    # Create a JWT token manually
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": str(user.id), "roles": user.get_role_names()}, 
        expires_delta=access_token_expires
    )
    
    print(f"Created token: {access_token[:50]}...")
    
    # Test the endpoints
    base_url = "http://localhost:8001"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    endpoints = [
        "/api/auth/me",
        "/api/roles/permissions", 
        "/api/roles",
        "/api/users/"
    ]
    
    for endpoint in endpoints:
        try:
            print(f"\nTesting {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}", headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"Success: Got {len(data)} items")
                else:
                    print(f"Success: {type(data)}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_authentication())