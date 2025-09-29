#!/usr/bin/env python3
"""
Check Krishna User Status
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User

async def check_krishna_user():
    """Check Krishna user details"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Look for Krishna by email
        krishna_email = "krishna.chaitanya@tnifmc.com"
        user = await User.find_one({"email": krishna_email})
        
        if user:
            print(f"✅ Found user: {user.email}")
            print(f"   ID: {user.id}")
            print(f"   Name: {user.name}")
            print(f"   Username: {user.username}")
            print(f"   Password Hash: {user.password_hash}")
            print(f"   Roles: {user.roles}")
            print(f"   Active: {user.is_active}")
            print(f"   Employment Type: {user.employment_type}")
        else:
            print(f"❌ User not found: {krishna_email}")
            
        # Also check all users with similar emails
        print("\n🔍 Checking for similar emails...")
        all_users = await User.find_all().to_list()
        krishna_users = [u for u in all_users if "krishna" in u.email.lower() or "chaitanya" in u.email.lower()]
        
        if krishna_users:
            print("Found Krishna-related users:")
            for u in krishna_users:
                print(f"  - {u.email} | {u.name} | Active: {u.is_active}")
        else:
            print("No Krishna-related users found")
            
        print(f"\nTotal users in database: {len(all_users)}")
        
    except Exception as e:
        print(f"❌ Error checking user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_krishna_user())