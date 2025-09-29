#!/usr/bin/env python3
"""
Setup Krishna Chaitanya as Admin
Updates the existing user with admin role and password
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, UserRole, EmploymentType

async def setup_krishna_admin():
    """Setup Krishna Chaitanya as admin user"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Find the Krishna Chaitanya user
        admin_email = "krishna.chaitanya@tnifmc.com"
        user = await User.find_one({"email": admin_email})
        
        if user:
            # Update user with admin credentials
            user.username = "krishna.chaitanya"
            user.password_hash = "password123"  # Plain text for now
            user.roles = [UserRole.ADMIN, UserRole.MANAGER]
            user.is_active = True
            await user.save()
            
            print(f"✅ Updated Krishna Chaitanya as admin:")
            print(f"   Name: {user.name}")
            print(f"   Email: {user.email}")
            print(f"   Username: {user.username}")
            print(f"   Password: password123")
            print(f"   Roles: {user.roles}")
            print(f"   Active: {user.is_active}")
            
        else:
            print(f"❌ User not found: {admin_email}")
            
            # List all users to see what's available
            all_users = await User.find_all().limit(10).to_list()
            print("\nAvailable users:")
            for u in all_users:
                print(f"  - {u.email} ({u.name})")
        
        print("\n🎉 Setup complete! You can now login with:")
        print("=" * 60)
        print("ADMIN USER (Krishna Chaitanya):")
        print("  Username: krishna.chaitanya")
        print("  Email: krishna.chaitanya@tnifmc.com")
        print("  Password: password123")
        print("  Roles: Admin, Manager")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error setting up Krishna as admin: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(setup_krishna_admin())