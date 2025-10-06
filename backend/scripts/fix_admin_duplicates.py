#!/usr/bin/env python3
"""
Fix duplicate admin users - keep only one
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

async def fix_duplicates():
    from app.models.database import init_db, close_mongo_connection
    from app.models.user import User
    
    await init_db()
    print("=" * 70)
    print("FIXING DUPLICATE ADMIN USERS")
    print("=" * 70)
    
    # Find all admin users
    admin_users = await User.find({"username": "admin"}).to_list()
    print(f'\nFound {len(admin_users)} admin users')
    
    if len(admin_users) > 1:
        # Delete all but keep the first one
        for i, user in enumerate(admin_users):
            if i == 0:
                print(f'\nKeeping admin user #{i+1}:')
                print(f'  ID: {user.id}')
                print(f'  Username: {user.username}')
                print(f'  Email: {user.email}')
                print(f'  Password: {user.password_hash}')
            else:
                print(f'\nDeleting duplicate admin user #{i+1}: {user.id}')
                await user.delete()
    
    # Verify
    remaining_admins = await User.find({"username": "admin"}).to_list()
    print(f'\n✅ Now have {len(remaining_admins)} admin user(s)')
    
    print("\n" + "=" * 70)
    print("FINAL ADMIN USER:")
    print("=" * 70)
    for user in remaining_admins:
        print(f'  ID: {user.id}')
        print(f'  Username: {user.username}')
        print(f'  Email: {user.email}')
        print(f'  Name: {user.name}')
        print(f'  Password Hash: {user.password_hash}')
        print(f'  Active: {user.is_active}')
    
    print("\n" + "=" * 70)
    print("✅ Use these credentials to login:")
    print("   Username: admin")
    print("   Password: admin123")
    print("=" * 70)
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(fix_duplicates())
