#!/usr/bin/env python3
"""
Setup test users for development and testing
"""
import asyncio
from app.models.database import init_db
from app.models.user import User
from datetime import datetime

async def setup_test_users():
    """Create test users for development"""
    
    # Initialize database
    await init_db()
    
    # Test users to create
    test_users = [
        {
            "username": "admin",
            "password": "admin",
            "email": "admin@niveshya.com",
            "name": "Admin User",
            "designation": "Administrator",
            "employment_type": "Employee",
            "organisation": "Niveshya",
            "roles": ["admin"],
            "is_active": True
        },
        {
            "username": "user", 
            "password": "user",
            "email": "user@niveshya.com",
            "name": "Test User",
            "designation": "Analyst", 
            "employment_type": "Employee",
            "organisation": "Niveshya",
            "roles": ["user"],
            "is_active": True
        },
        {
            "username": "manager",
            "password": "manager", 
            "email": "manager@niveshya.com",
            "name": "Manager User",
            "designation": "Manager",
            "employment_type": "Employee", 
            "organisation": "Niveshya",
            "roles": ["manager"],
            "is_active": True
        }
    ]
    
    for user_data in test_users:
        # Check if user already exists
        existing = await User.find_one({
            "$or": [
                {"username": user_data["username"]},
                {"email": user_data["email"]}
            ]
        })
        
        if existing:
            print(f"User {user_data['username']} already exists, updating...")
            # Update existing user
            existing.password_hash = user_data["password"]  # Plain text for testing
            existing.name = user_data["name"]
            existing.designation = user_data["designation"] 
            existing.is_active = user_data["is_active"]
            existing.roles = user_data["roles"]
            existing.updated_at = datetime.utcnow()
            await existing.save()
        else:
            print(f"Creating user {user_data['username']}...")
            # Create new user
            user = User(
                username=user_data["username"],
                password_hash=user_data["password"],  # Plain text for testing
                email=user_data["email"],
                name=user_data["name"],
                designation=user_data["designation"],
                employment_type=user_data["employment_type"],
                organisation=user_data["organisation"], 
                roles=user_data["roles"],
                is_active=user_data["is_active"],
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            await user.insert()
        
        print(f"✅ User '{user_data['username']}' ready - password: '{user_data['password']}'")

    print("\n🎉 Test users setup complete!")
    print("\nAvailable test users:")
    print("- admin/admin (Administrator)")
    print("- user/user (Regular User)")  
    print("- manager/manager (Manager)")
    print("- test/test123 (Existing Test User)")

if __name__ == "__main__":
    asyncio.run(setup_test_users())