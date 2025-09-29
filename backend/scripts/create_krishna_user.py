#!/usr/bin/env python3
"""
Create Krishna Chaitanya User
Creates the specific user with email krishna.chaitanya@tnifmc.com
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, UserRole, EmploymentType

async def create_krishna_user():
    """Create Krishna Chaitanya user with specified credentials"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Check if user already exists and delete if found
        existing_user = await User.find_one({"email": "krishna.chaitanya@tnifmc.com"})
        if existing_user:
            await existing_user.delete()
            print("✅ Deleted existing Krishna user")
        
        # Create Krishna Chaitanya user
        krishna_user = User(
            organisation="TNIFMC",
            employment_type=EmploymentType.EMPLOYEE,
            name="Krishna Chaitanya K",
            designation="CEO",
            email="krishna.chaitanya@tnifmc.com",
            username="admin",  # Username is admin as per your request
            password_hash="password123",  # Plain text password for testing
            roles=[UserRole.ADMIN, UserRole.MANAGER],
            is_active=True
        )
        
        await krishna_user.insert()
        print("✅ Created Krishna Chaitanya user")
        
        # Verify the user was created
        verify_user = await User.find_one({"email": "krishna.chaitanya@tnifmc.com"})
        if verify_user:
            print(f"✅ Verification successful:")
            print(f"   Name: {verify_user.name}")
            print(f"   Email: {verify_user.email}")
            print(f"   Username: {verify_user.username}")
            print(f"   Password: {verify_user.password_hash}")
            print(f"   Roles: {verify_user.roles}")
            print(f"   Active: {verify_user.is_active}")
        else:
            print("❌ Verification failed - user not found after creation")
        
        print("\n🎉 Setup complete! Login credentials:")
        print("=" * 50)
        print("Email: krishna.chaitanya@tnifmc.com")
        print("Username: admin")
        print("Password: password123")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error creating Krishna user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(create_krishna_user())