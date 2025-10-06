"""
Initialize default roles and permissions for RBAC system
Run this script to set up the initial RBAC data
"""

import asyncio
from app.models.database import init_db
from app.models.role import Role, Permission, PermissionType
from app.models.user import User


async def create_default_permissions():
    """Create default permissions"""
    permissions_data = [
        # User Management
        {"name": PermissionType.VIEW_USERS, "description": "View user profiles and information", "category": "User Management"},
        {"name": PermissionType.CREATE_USERS, "description": "Create new user accounts", "category": "User Management"},
        {"name": PermissionType.EDIT_USERS, "description": "Edit user profiles and information", "category": "User Management"},
        {"name": PermissionType.DELETE_USERS, "description": "Delete user accounts", "category": "User Management"},
        
        # Contact Management
        {"name": PermissionType.VIEW_CONTACTS, "description": "View contact information", "category": "Contact Management"},
        {"name": PermissionType.CREATE_CONTACTS, "description": "Create new contacts", "category": "Contact Management"},
        {"name": PermissionType.EDIT_CONTACTS, "description": "Edit contact information", "category": "Contact Management"},
        {"name": PermissionType.DELETE_CONTACTS, "description": "Delete contacts", "category": "Contact Management"},
        
        # Organization Management
        {"name": PermissionType.VIEW_ORGANIZATIONS, "description": "View organization information", "category": "Organization Management"},
        {"name": PermissionType.CREATE_ORGANIZATIONS, "description": "Create new organizations", "category": "Organization Management"},
        {"name": PermissionType.EDIT_ORGANIZATIONS, "description": "Edit organization information", "category": "Organization Management"},
        {"name": PermissionType.DELETE_ORGANIZATIONS, "description": "Delete organizations", "category": "Organization Management"},
        
        # Opportunity Management
        {"name": PermissionType.VIEW_OPPORTUNITIES, "description": "View investment opportunities", "category": "Opportunity Management"},
        {"name": PermissionType.CREATE_OPPORTUNITIES, "description": "Create new opportunities", "category": "Opportunity Management"},
        {"name": PermissionType.EDIT_OPPORTUNITIES, "description": "Edit opportunity information", "category": "Opportunity Management"},
        {"name": PermissionType.DELETE_OPPORTUNITIES, "description": "Delete opportunities", "category": "Opportunity Management"},
        
        # Task Management
        {"name": PermissionType.VIEW_TASKS, "description": "View tasks and assignments", "category": "Task Management"},
        {"name": PermissionType.CREATE_TASKS, "description": "Create new tasks", "category": "Task Management"},
        {"name": PermissionType.EDIT_TASKS, "description": "Edit task information", "category": "Task Management"},
        {"name": PermissionType.DELETE_TASKS, "description": "Delete tasks", "category": "Task Management"},
        {"name": PermissionType.ASSIGN_TASKS, "description": "Assign tasks to users", "category": "Task Management"},
        
        # Fundraising Management
        {"name": PermissionType.VIEW_FUNDRAISING, "description": "View fundraising activities", "category": "Fundraising Management"},
        {"name": PermissionType.CREATE_FUNDRAISING, "description": "Create fundraising records", "category": "Fundraising Management"},
        {"name": PermissionType.EDIT_FUNDRAISING, "description": "Edit fundraising information", "category": "Fundraising Management"},
        {"name": PermissionType.DELETE_FUNDRAISING, "description": "Delete fundraising records", "category": "Fundraising Management"},
        
        # Tracker Management
        {"name": PermissionType.VIEW_TRACKER, "description": "View tracking information", "category": "Tracker Management"},
        {"name": PermissionType.CREATE_TRACKER, "description": "Create tracking entries", "category": "Tracker Management"},
        {"name": PermissionType.EDIT_TRACKER, "description": "Edit tracking information", "category": "Tracker Management"},
        {"name": PermissionType.DELETE_TRACKER, "description": "Delete tracking entries", "category": "Tracker Management"},
        
        # Meeting Management
        {"name": PermissionType.VIEW_MEETINGS, "description": "View meeting information", "category": "Meeting Management"},
        {"name": PermissionType.CREATE_MEETINGS, "description": "Create and schedule meetings", "category": "Meeting Management"},
        {"name": PermissionType.EDIT_MEETINGS, "description": "Edit meeting information", "category": "Meeting Management"},
        {"name": PermissionType.DELETE_MEETINGS, "description": "Delete meetings", "category": "Meeting Management"},
        
        # Admin Functions
        {"name": PermissionType.MANAGE_ROLES, "description": "Create, edit, and assign roles", "category": "Administration"},
        {"name": PermissionType.MANAGE_PERMISSIONS, "description": "Manage system permissions", "category": "Administration"},
        {"name": PermissionType.SYSTEM_SETTINGS, "description": "Access system settings", "category": "Administration"},
        {"name": PermissionType.VIEW_AUDIT_LOGS, "description": "View system audit logs", "category": "Administration"},
        
        # Reports and Analytics
        {"name": PermissionType.VIEW_REPORTS, "description": "Access reports and analytics", "category": "Reports"},
        {"name": PermissionType.EXPORT_DATA, "description": "Export data to external formats", "category": "Reports"},
    ]
    
    for perm_data in permissions_data:
        existing = await Permission.find_one({"name": perm_data["name"]})
        if not existing:
            permission = Permission(**perm_data)
            await permission.save()
            print(f"Created permission: {perm_data['name']}")


async def create_default_roles():
    """Create default system roles"""
    
    # Super Admin Role
    super_admin_permissions = [perm for perm in PermissionType]
    super_admin = await Role.find_one({"name": "Super Admin"})
    if not super_admin:
        super_admin = Role(
            name="Super Admin",
            description="Full system access with all permissions",
            permissions=super_admin_permissions,
            is_system_role=True,
            color="#DC2626"  # Red
        )
        await super_admin.save()
        print("Created Super Admin role")
    
    # Admin Role
    admin_permissions = [
        # User Management
        PermissionType.VIEW_USERS, PermissionType.CREATE_USERS, 
        PermissionType.EDIT_USERS, PermissionType.DELETE_USERS,
        
        # All business entities
        PermissionType.VIEW_CONTACTS, PermissionType.CREATE_CONTACTS, 
        PermissionType.EDIT_CONTACTS, PermissionType.DELETE_CONTACTS,
        PermissionType.VIEW_ORGANIZATIONS, PermissionType.CREATE_ORGANIZATIONS, 
        PermissionType.EDIT_ORGANIZATIONS, PermissionType.DELETE_ORGANIZATIONS,
        PermissionType.VIEW_OPPORTUNITIES, PermissionType.CREATE_OPPORTUNITIES, 
        PermissionType.EDIT_OPPORTUNITIES, PermissionType.DELETE_OPPORTUNITIES,
        PermissionType.VIEW_TASKS, PermissionType.CREATE_TASKS, 
        PermissionType.EDIT_TASKS, PermissionType.DELETE_TASKS, PermissionType.ASSIGN_TASKS,
        PermissionType.VIEW_FUNDRAISING, PermissionType.CREATE_FUNDRAISING, 
        PermissionType.EDIT_FUNDRAISING, PermissionType.DELETE_FUNDRAISING,
        PermissionType.VIEW_TRACKER, PermissionType.CREATE_TRACKER, 
        PermissionType.EDIT_TRACKER, PermissionType.DELETE_TRACKER,
        PermissionType.VIEW_MEETINGS, PermissionType.CREATE_MEETINGS, 
        PermissionType.EDIT_MEETINGS, PermissionType.DELETE_MEETINGS,
        
        # Reports
        PermissionType.VIEW_REPORTS, PermissionType.EXPORT_DATA,
        
        # Some admin functions
        PermissionType.MANAGE_ROLES, PermissionType.VIEW_AUDIT_LOGS
    ]
    
    admin = await Role.find_one({"name": "Admin"})
    if not admin:
        admin = Role(
            name="Admin",
            description="Administrative access with role management capabilities",
            permissions=admin_permissions,
            is_system_role=True,
            color="#DC2626"  # Red
        )
        await admin.save()
        print("Created Admin role")
    
    # Manager Role
    manager_permissions = [
        # View and manage business entities
        PermissionType.VIEW_CONTACTS, PermissionType.CREATE_CONTACTS, 
        PermissionType.EDIT_CONTACTS,
        PermissionType.VIEW_ORGANIZATIONS, PermissionType.CREATE_ORGANIZATIONS, 
        PermissionType.EDIT_ORGANIZATIONS,
        PermissionType.VIEW_OPPORTUNITIES, PermissionType.CREATE_OPPORTUNITIES, 
        PermissionType.EDIT_OPPORTUNITIES,
        PermissionType.VIEW_TASKS, PermissionType.CREATE_TASKS, 
        PermissionType.EDIT_TASKS, PermissionType.ASSIGN_TASKS,
        PermissionType.VIEW_FUNDRAISING, PermissionType.CREATE_FUNDRAISING, 
        PermissionType.EDIT_FUNDRAISING,
        PermissionType.VIEW_TRACKER, PermissionType.CREATE_TRACKER, 
        PermissionType.EDIT_TRACKER,
        PermissionType.VIEW_MEETINGS, PermissionType.CREATE_MEETINGS, 
        PermissionType.EDIT_MEETINGS,
        
        # View users and reports
        PermissionType.VIEW_USERS,
        PermissionType.VIEW_REPORTS, PermissionType.EXPORT_DATA
    ]
    
    manager = await Role.find_one({"name": "Manager"})
    if not manager:
        manager = Role(
            name="Manager",
            description="Management access with ability to oversee operations",
            permissions=manager_permissions,
            is_system_role=True,
            color="#F59E0B"  # Amber
        )
        await manager.save()
        print("Created Manager role")
    
    # Analyst Role
    analyst_permissions = [
        # View and create/edit business entities
        PermissionType.VIEW_CONTACTS, PermissionType.CREATE_CONTACTS, PermissionType.EDIT_CONTACTS,
        PermissionType.VIEW_ORGANIZATIONS, PermissionType.CREATE_ORGANIZATIONS, PermissionType.EDIT_ORGANIZATIONS,
        PermissionType.VIEW_OPPORTUNITIES, PermissionType.CREATE_OPPORTUNITIES, PermissionType.EDIT_OPPORTUNITIES,
        PermissionType.VIEW_TASKS, PermissionType.CREATE_TASKS, PermissionType.EDIT_TASKS,
        PermissionType.VIEW_FUNDRAISING, PermissionType.CREATE_FUNDRAISING, PermissionType.EDIT_FUNDRAISING,
        PermissionType.VIEW_TRACKER, PermissionType.CREATE_TRACKER, PermissionType.EDIT_TRACKER,
        PermissionType.VIEW_MEETINGS, PermissionType.CREATE_MEETINGS, PermissionType.EDIT_MEETINGS,
        
        # Reports and analytics
        PermissionType.VIEW_REPORTS, PermissionType.EXPORT_DATA
    ]
    
    analyst = await Role.find_one({"name": "Analyst"})
    if not analyst:
        analyst = Role(
            name="Analyst",
            description="Analytical access with data entry and reporting capabilities",
            permissions=analyst_permissions,
            is_system_role=True,
            color="#3B82F6"  # Blue
        )
        await analyst.save()
        print("Created Analyst role")
    
    # User Role (Basic)
    user_permissions = [
        # View access to most entities
        PermissionType.VIEW_CONTACTS, PermissionType.VIEW_ORGANIZATIONS,
        PermissionType.VIEW_OPPORTUNITIES, PermissionType.VIEW_TASKS,
        PermissionType.VIEW_FUNDRAISING, PermissionType.VIEW_TRACKER,
        PermissionType.VIEW_MEETINGS,
        
        # Limited creation for own tasks
        PermissionType.CREATE_TASKS, PermissionType.EDIT_TASKS,
        PermissionType.CREATE_MEETINGS, PermissionType.EDIT_MEETINGS,
        
        # Basic reporting
        PermissionType.VIEW_REPORTS
    ]
    
    user = await Role.find_one({"name": "User"})
    if not user:
        user = Role(
            name="User",
            description="Basic user access with view permissions",
            permissions=user_permissions,
            is_system_role=True,
            color="#6B7280"  # Gray
        )
        await user.save()
        print("Created User role")


async def assign_default_admin_role():
    """Assign Super Admin role to the first user or create a default admin"""
    super_admin_role = await Role.find_one({"name": "Super Admin"})
    if not super_admin_role:
        print("Super Admin role not found!")
        return
    
    # Try to find existing users
    existing_users = await User.find_all().to_list()
    
    if existing_users:
        # Assign Super Admin to the first user if they don't have any roles
        first_user = existing_users[0]
        if not first_user.role_assignments:
            first_user.add_role(str(super_admin_role.id), super_admin_role.name)
            await first_user.save()
            print(f"Assigned Super Admin role to existing user: {first_user.name}")
    else:
        print("No existing users found. Please create a user and assign the Super Admin role manually.")


async def main():
    """Initialize RBAC system"""
    print("Initializing RBAC system...")
    
    # Initialize database connection
    await init_db()
    
    # Create permissions
    print("\nCreating default permissions...")
    await create_default_permissions()
    
    # Create roles
    print("\nCreating default roles...")
    await create_default_roles()
    
    # Assign admin role
    print("\nAssigning default admin role...")
    await assign_default_admin_role()
    
    print("\nRBAC initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())