#!/usr/bin/env python3
"""
Add admin role assignments to the admin user
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

async def add_admin_roles():
    from app.models.database import init_db, close_mongo_connection
    from app.models.user import User, UserRoleAssignment
    from datetime import datetime
    
    await init_db()
    print("=" * 70)
    print("ADDING ADMIN ROLE ASSIGNMENTS")
    print("=" * 70)
    
    # Find admin user
    admin_user = await User.find_one({"username": "admin"})
    
    if admin_user:
        print(f'\nFound admin user:')
        print(f'  ID: {admin_user.id}')
        print(f'  Username: {admin_user.username}')
        print(f'  Email: {admin_user.email}')
        print(f'  Current Role Assignments: {admin_user.role_assignments}')
        
        # Clear existing role assignments
        admin_user.role_assignments = []
        
        # Add Admin and Super Admin roles
        admin_role = UserRoleAssignment(
            role_id="admin_role_id",
            role_name="Admin",
            assigned_at=datetime.utcnow()
        )
        
        super_admin_role = UserRoleAssignment(
            role_id="super_admin_role_id",
            role_name="Super Admin",
            assigned_at=datetime.utcnow()
        )
        
        admin_user.role_assignments.append(admin_role)
        admin_user.role_assignments.append(super_admin_role)
        
        await admin_user.save()
        
        print(f'\n✅ Updated role assignments:')
        for assignment in admin_user.role_assignments:
            print(f'  - {assignment.role_name} (ID: {assignment.role_id})')
        
        print("\n" + "=" * 70)
        print("✅ Admin user now has Admin and Super Admin roles!")
        print("=" * 70)
        print("\nThe Admin Settings menu should now be visible.")
    else:
        print("❌ Admin user not found!")
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(add_admin_roles())
