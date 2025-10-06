#!/usr/bin/env python3
"""
Update admin user password to asd123
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

async def update_admin_password():
    from app.models.database import init_db, close_mongo_connection
    from app.models.user import User
    
    await init_db()
    print("=" * 70)
    print("UPDATING ADMIN PASSWORD")
    print("=" * 70)
    
    # Find admin user
    admin_user = await User.find_one({"username": "admin"})
    
    if admin_user:
        print(f'\nFound admin user:')
        print(f'  ID: {admin_user.id}')
        print(f'  Username: {admin_user.username}')
        print(f'  Email: {admin_user.email}')
        print(f'  Old Password: {admin_user.password_hash}')
        
        # Update password to asd123
        admin_user.password_hash = "asd123"
        await admin_user.save()
        
        print(f'  New Password: {admin_user.password_hash}')
        print('\n✅ Password updated successfully!')
        
        print("\n" + "=" * 70)
        print("✅ Use these credentials to login:")
        print("   Username: admin")
        print("   Password: asd123")
        print("=" * 70)
    else:
        print("❌ Admin user not found!")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(update_admin_password())
