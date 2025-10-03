"""
User model for Lead Management System
Based on users.json structure using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field, EmailStr, BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EmploymentType(str, Enum):
    """Employment type enumeration"""
    EMPLOYEE = "Employee"
    CONTRACTOR = "Contractor"
    CONSULTANT = "Consultant"


class UserRoleAssignment(BaseModel):
    """User-Role assignment embedded in User"""
    role_id: str
    role_name: str
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    assigned_by: Optional[str] = None  # User ID who assigned this role


class User(Document):
    """User model representing TNIFMC employees"""
    
    organisation: str = Field(default="TNIFMC", description="Organization name")
    employment_type: EmploymentType = Field(..., description="Type of employment")
    name: str = Field(..., description="Full name")
    designation: str = Field(..., description="Job designation")
    email: Optional[EmailStr] = Field(None, description="Email address", unique=True)
    phone: Optional[str] = Field(None, description="Phone number")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Authentication fields
    username: Optional[str] = Field(None, description="Username for login", unique=True)
    password_hash: Optional[str] = Field(None, description="Hashed password")
    role_assignments: List[UserRoleAssignment] = Field(default_factory=list, description="Assigned roles")
    is_active: bool = Field(default=True, description="User active status")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = Field(None)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "username", 
            "designation",
            "employment_type",
            "is_active"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "organisation": "TNIFMC",
                "employment_type": "Employee",
                "name": "J. Prashanthi",
                "designation": "Company Secretary",
                "email": "prashanthi.j@tnifmc.com",
                "phone": "9941476214",
                "username": "prashanthi.j",
                "roles": ["user"]
            }
        }
    
    def has_role(self, role_name: str) -> bool:
        """Check if user has a specific role"""
        return any(assignment.role_name == role_name for assignment in self.role_assignments)
    
    def get_role_names(self) -> List[str]:
        """Get list of role names assigned to user"""
        return [assignment.role_name for assignment in self.role_assignments]
    
    def add_role(self, role_id: str, role_name: str, assigned_by: Optional[str] = None):
        """Add a role to the user"""
        if not self.has_role(role_name):
            assignment = UserRoleAssignment(
                role_id=role_id,
                role_name=role_name,
                assigned_by=assigned_by
            )
            self.role_assignments.append(assignment)
    
    def remove_role(self, role_name: str):
        """Remove a role from the user"""
        self.role_assignments = [
            assignment for assignment in self.role_assignments 
            if assignment.role_name != role_name
        ]
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"