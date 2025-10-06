"""
RBAC Controller - Role-Based Access Control management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from app.models.user import User
from app.utils.rbac import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/roles", tags=["rbac"])

class RoleResponse(BaseModel):
    id: str
    name: str
    description: str
    permissions: List[str]

class PermissionResponse(BaseModel):
    id: str
    name: str
    description: str
    category: str

# Predefined roles and permissions for the system
SYSTEM_ROLES = [
    {
        "id": "super_admin",
        "name": "Super Admin",
        "description": "Full system access with all permissions",
        "permissions": ["*"]  # All permissions
    },
    {
        "id": "admin",
        "name": "Admin",
        "description": "Administrative access to manage users and settings",
        "permissions": [
            "read_analytics", "read_tracker", "read_opportunities", 
            "read_tasks", "read_contacts", "manage_users", "admin_access"
        ]
    },
    {
        "id": "manager",
        "name": "Manager",
        "description": "Manager with read/write access to core features",
        "permissions": [
            "read_analytics", "read_tracker", "write_tracker",
            "read_opportunities", "write_opportunities",
            "read_tasks", "write_tasks", "read_contacts", "write_contacts"
        ]
    },
    {
        "id": "user",
        "name": "User",
        "description": "Standard user with read access",
        "permissions": [
            "read_tracker", "read_opportunities", "read_tasks", "read_contacts"
        ]
    }
]

SYSTEM_PERMISSIONS = [
    {"id": "read_analytics", "name": "Read Analytics", "description": "View analytics and reports", "category": "Analytics"},
    {"id": "read_tracker", "name": "Read Tracker", "description": "View fundraising tracker data", "category": "Fundraising"},
    {"id": "write_tracker", "name": "Write Tracker", "description": "Create and edit fundraising tracker entries", "category": "Fundraising"},
    {"id": "read_opportunities", "name": "Read Opportunities", "description": "View opportunities", "category": "Sales"},
    {"id": "write_opportunities", "name": "Write Opportunities", "description": "Create and edit opportunities", "category": "Sales"},
    {"id": "read_tasks", "name": "Read Tasks", "description": "View tasks", "category": "Tasks"},
    {"id": "write_tasks", "name": "Write Tasks", "description": "Create and edit tasks", "category": "Tasks"},
    {"id": "read_contacts", "name": "Read Contacts", "description": "View contacts", "category": "Contacts"},
    {"id": "write_contacts", "name": "Write Contacts", "description": "Create and edit contacts", "category": "Contacts"},
    {"id": "manage_users", "name": "Manage Users", "description": "Create, edit, and delete users", "category": "Administration"},
    {"id": "admin_access", "name": "Admin Access", "description": "Access admin settings and configurations", "category": "Administration"},
]

@router.get("/", response_model=List[RoleResponse])
async def get_roles(current_user: User = Depends(get_current_user)):
    """Get all available roles in the system"""
    return SYSTEM_ROLES

@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(role_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific role by ID"""
    role = next((r for r in SYSTEM_ROLES if r["id"] == role_id), None)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id '{role_id}' not found"
        )
    return role

@router.get("/permissions/all", response_model=List[PermissionResponse])
async def get_permissions(current_user: User = Depends(get_current_user)):
    """Get all available permissions in the system"""
    return SYSTEM_PERMISSIONS
