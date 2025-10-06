#!/usr/bin/env python3
"""
Initialize default roles and permissions in MongoDB
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

async def init_roles_and_permissions():
    from app.models.database import init_db, close_mongo_connection
    from app.models.role import Role, Permission, PermissionType
    from datetime import datetime
    
    await init_db()
    print("=" * 70)
    print("INITIALIZING ROLES AND PERMISSIONS")
    print("=" * 70)
    
    # Create permissions first
    permissions_data = [
        {"name": PermissionType.VIEW_REPORTS, "description": "View analytics and reports", "category": "Analytics"},
        {"name": PermissionType.VIEW_TRACKER, "description": "View fundraising tracker data", "category": "Fundraising"},
        {"name": PermissionType.EDIT_TRACKER, "description": "Edit fundraising tracker entries", "category": "Fundraising"},
        {"name": PermissionType.CREATE_TRACKER, "description": "Create fundraising tracker entries", "category": "Fundraising"},
        {"name": PermissionType.VIEW_OPPORTUNITIES, "description": "View opportunities", "category": "Sales"},
        {"name": PermissionType.EDIT_OPPORTUNITIES, "description": "Edit opportunities", "category": "Sales"},
        {"name": PermissionType.CREATE_OPPORTUNITIES, "description": "Create opportunities", "category": "Sales"},
        {"name": PermissionType.VIEW_TASKS, "description": "View tasks", "category": "Tasks"},
        {"name": PermissionType.EDIT_TASKS, "description": "Edit tasks", "category": "Tasks"},
        {"name": PermissionType.CREATE_TASKS, "description": "Create tasks", "category": "Tasks"},
        {"name": PermissionType.VIEW_CONTACTS, "description": "View contacts", "category": "Contacts"},
        {"name": PermissionType.EDIT_CONTACTS, "description": "Edit contacts", "category": "Contacts"},
        {"name": PermissionType.CREATE_CONTACTS, "description": "Create contacts", "category": "Contacts"},
        {"name": PermissionType.VIEW_USERS, "description": "View users", "category": "Administration"},
        {"name": PermissionType.EDIT_USERS, "description": "Edit users", "category": "Administration"},
        {"name": PermissionType.MANAGE_ROLES, "description": "Manage roles and permissions", "category": "Administration"},
        {"name": PermissionType.SYSTEM_SETTINGS, "description": "Access system settings", "category": "Administration"},
        {"name": PermissionType.EXPORT_DATA, "description": "Export data", "category": "Data"},
    ]
    
    print("\n📝 Creating permissions...")
    created_permissions = []
    for perm_data in permissions_data:
        existing = await Permission.find_one({"name": perm_data["name"]})
        if not existing:
            permission = Permission(**perm_data)
            await permission.insert()
            created_permissions.append(permission.name)
            print(f"  ✅ Created permission: {permission.name}")
        else:
            print(f"  ⏭️  Permission already exists: {perm_data['name']}")
    
    # Create roles
    roles_data = [
        {
            "name": "Super Admin",
            "description": "Full system access with all permissions",
            "permissions": [p["name"] for p in permissions_data],
            "is_system_role": True,
            "color": "#8B5CF6"
        },
        {
            "name": "Admin",
            "description": "Administrative access to manage users and settings",
            "permissions": [
                PermissionType.VIEW_REPORTS, PermissionType.VIEW_TRACKER, 
                PermissionType.VIEW_OPPORTUNITIES, PermissionType.VIEW_TASKS, 
                PermissionType.VIEW_CONTACTS, PermissionType.VIEW_USERS, 
                PermissionType.EDIT_USERS, PermissionType.MANAGE_ROLES,
                PermissionType.SYSTEM_SETTINGS, PermissionType.EXPORT_DATA
            ],
            "is_system_role": True,
            "color": "#3B82F6"
        },
        {
            "name": "Manager",
            "description": "Manager with read/write access to core features",
            "permissions": [
                PermissionType.VIEW_REPORTS, PermissionType.VIEW_TRACKER, 
                PermissionType.EDIT_TRACKER, PermissionType.CREATE_TRACKER,
                PermissionType.VIEW_OPPORTUNITIES, PermissionType.EDIT_OPPORTUNITIES, 
                PermissionType.CREATE_OPPORTUNITIES, PermissionType.VIEW_TASKS, 
                PermissionType.EDIT_TASKS, PermissionType.CREATE_TASKS,
                PermissionType.VIEW_CONTACTS, PermissionType.EDIT_CONTACTS,
                PermissionType.CREATE_CONTACTS
            ],
            "is_system_role": True,
            "color": "#10B981"
        },
        {
            "name": "User",
            "description": "Standard user with read access",
            "permissions": [
                PermissionType.VIEW_TRACKER, PermissionType.VIEW_OPPORTUNITIES, 
                PermissionType.VIEW_TASKS, PermissionType.VIEW_CONTACTS
            ],
            "is_system_role": True,
            "color": "#6B7280"
        }
    ]
    
    print("\n👥 Creating roles...")
    for role_data in roles_data:
        existing = await Role.find_one({"name": role_data["name"]})
        if not existing:
            role = Role(**role_data)
            await role.insert()
            print(f"  ✅ Created role: {role.name} with {len(role.permissions)} permissions")
        else:
            print(f"  ⏭️  Role already exists: {role_data['name']}")
    
    # Summary
    all_permissions = await Permission.find_all().to_list()
    all_roles = await Role.find_all().to_list()
    
    print("\n" + "=" * 70)
    print(f"✅ Initialization complete!")
    print(f"   Total Permissions: {len(all_permissions)}")
    print(f"   Total Roles: {len(all_roles)}")
    print("=" * 70)
    
    await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(init_roles_and_permissions())
