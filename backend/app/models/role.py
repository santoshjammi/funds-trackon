"""
Role-Based Access Control Models
"""

from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import BaseModel, Field
from enum import Enum


class PermissionType(str, Enum):
    """Standard permission types"""
    # User Management
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    
    # Contact Management
    VIEW_CONTACTS = "view_contacts"
    CREATE_CONTACTS = "create_contacts"
    EDIT_CONTACTS = "edit_contacts"
    DELETE_CONTACTS = "delete_contacts"
    
    # Organization Management
    VIEW_ORGANIZATIONS = "view_organizations"
    CREATE_ORGANIZATIONS = "create_organizations"
    EDIT_ORGANIZATIONS = "edit_organizations"
    DELETE_ORGANIZATIONS = "delete_organizations"
    
    # Opportunity Management
    VIEW_OPPORTUNITIES = "view_opportunities"
    CREATE_OPPORTUNITIES = "create_opportunities"
    EDIT_OPPORTUNITIES = "edit_opportunities"
    DELETE_OPPORTUNITIES = "delete_opportunities"
    
    # Task Management
    VIEW_TASKS = "view_tasks"
    CREATE_TASKS = "create_tasks"
    EDIT_TASKS = "edit_tasks"
    DELETE_TASKS = "delete_tasks"
    ASSIGN_TASKS = "assign_tasks"
    
    # Fundraising Management
    VIEW_FUNDRAISING = "view_fundraising"
    CREATE_FUNDRAISING = "create_fundraising"
    EDIT_FUNDRAISING = "edit_fundraising"
    DELETE_FUNDRAISING = "delete_fundraising"
    
    # Tracker Management
    VIEW_TRACKER = "view_tracker"
    CREATE_TRACKER = "create_tracker"
    EDIT_TRACKER = "edit_tracker"
    DELETE_TRACKER = "delete_tracker"
    
    # Meeting Management
    VIEW_MEETINGS = "view_meetings"
    CREATE_MEETINGS = "create_meetings"
    EDIT_MEETINGS = "edit_meetings"
    DELETE_MEETINGS = "delete_meetings"
    
    # Admin Functions
    MANAGE_ROLES = "manage_roles"
    MANAGE_PERMISSIONS = "manage_permissions"
    SYSTEM_SETTINGS = "system_settings"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    
    # Reports and Analytics
    VIEW_REPORTS = "view_reports"
    EXPORT_DATA = "export_data"


class Permission(Document):
    """Permission model"""
    name: PermissionType
    description: str
    category: str  # e.g., "User Management", "Contact Management"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "permissions"


class Role(Document):
    """Role model with permissions"""
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    permissions: List[PermissionType] = Field(default_factory=list)
    is_system_role: bool = Field(default=False)  # System roles can't be deleted
    color: Optional[str] = Field(default="#6B7280")  # For UI display
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    
    class Settings:
        name = "roles"
        
    def has_permission(self, permission: PermissionType) -> bool:
        """Check if role has a specific permission"""
        return permission in self.permissions
    
    def add_permission(self, permission: PermissionType):
        """Add permission to role"""
        if permission not in self.permissions:
            self.permissions.append(permission)
    
    def remove_permission(self, permission: PermissionType):
        """Remove permission from role"""
        if permission in self.permissions:
            self.permissions.remove(permission)


class UserRole(BaseModel):
    """User-Role association model (embedded in User)"""
    role_id: str
    role_name: str
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = None  # User ID who assigned this role


# Response models for API
class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: List[PermissionType]
    is_system_role: bool
    color: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]


class PermissionResponse(BaseModel):
    name: PermissionType
    description: str
    category: str
    created_at: datetime


class RoleCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    permissions: List[PermissionType] = Field(default_factory=list)
    color: Optional[str] = "#6B7280"


class RoleUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    description: Optional[str] = None
    permissions: Optional[List[PermissionType]] = None
    color: Optional[str] = None


class AssignRoleRequest(BaseModel):
    user_id: str
    role_id: str