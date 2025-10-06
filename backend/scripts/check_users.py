#!/usr/bin/env python3
"""Check what users exist in the database"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

async def check_users():
    from app.models.database import init_db, close_mongo_connection
    from app.models.user import User
    
    await init_db()
    print("=" * 70)
    print("CHECKING DATABASE USERS")
    print("=" * 70)
    
    users = await User.find_all().to_list()
    print(f'\nTotal users in database: {len(users)}')
    
    for i, user in enumerate(users, 1):
        print(f'\nUser #{i}:')
        print(f'  ID: {user.id}')
        print(f'  Username: {user.username}')
        print(f'  Email: {user.email}')
        print(f'  Name: {user.name}')
        print(f'  Password Hash: {user.password_hash}')
        print(f'  Active: {user.is_active}')
        print(f'  Role Assignments: {user.role_assignments}')
    
    print("\n" + "=" * 70)
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_users())
