#!/usr/bin/env python3
"""
Fix User Passwords Script
Fixes malformed password hashes and sets up proper admin user
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, UserRole, EmploymentType
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def fix_user_passwords():
    """Fix malformed password hashes and set up admin user"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Get all users
        users = await User.find_all().to_list()
        print(f"Found {len(users)} users")
        
        fixed_count = 0
        
        for user in users:
            # Check if password hash is malformed (too short or dummy hash)
            if user.password_hash and (len(user.password_hash) < 60 or "dummy.hash" in user.password_hash):
                print(f"Fixing malformed hash for: {user.email}")
                user.password_hash = None  # Clear malformed hash
                await user.save()
                fixed_count += 1
        
        print(f"✅ Fixed {fixed_count} malformed password hashes")
        
        # Set up admin user
        admin_email = "krishna.chaitanya@tnifmc.com"
        admin_user = await User.find_one({"email": admin_email})
        
        if admin_user:
            # Update admin user with proper credentials
            admin_user.username = "admin"
            admin_user.password_hash = pwd_context.hash("admin123")
            admin_user.roles = [UserRole.ADMIN, UserRole.MANAGER]
            admin_user.is_active = True
            await admin_user.save()
            print(f"✅ Set up admin user: {admin_user.email}")
        else:
            print(f"❌ Admin user not found: {admin_email}")
        
        # Set up a few test users
        test_users = [
            {
                "email": "gana.sk@tnifmc.com",
                "username": "gana.sk",
                "password": "password123",
                "roles": [UserRole.MANAGER]
            },
            {
                "email": "karthic.r@tnifmc.com", 
                "username": "karthic.r",
                "password": "password123",
                "roles": [UserRole.ANALYST]
            }
        ]
        
        for test_user in test_users:
            user = await User.find_one({"email": test_user["email"]})
            if user:
                user.username = test_user["username"]
                user.password_hash = pwd_context.hash(test_user["password"])
                user.roles = test_user["roles"]
                user.is_active = True
                await user.save()
                print(f"✅ Set up test user: {test_user['username']}")
        
        print("\n🎉 Password fix complete! You can now login with:")
        print("=" * 50)
        print("ADMIN USER:")
        print("  Username: admin")
        print("  Email: krishna.chaitanya@tnifmc.com")
        print("  Password: admin123")
        print("  Roles: Admin, Manager")
        print()
        print("TEST USERS:")
        print("  Username: gana.sk / Password: password123 (Manager)")
        print("  Username: karthic.r / Password: password123 (Analyst)")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error fixing passwords: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(fix_user_passwords())