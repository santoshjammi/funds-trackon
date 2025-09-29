"""
User model for Lead Management System
Based on users.json structure using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class EmploymentType(str, Enum):
    """Employment type enumeration"""
    EMPLOYEE = "Employee"
    CONTRACTOR = "Contractor"
    CONSULTANT = "Consultant"


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "admin"
    MANAGER = "manager"
    ANALYST = "analyst"
    USER = "user"


class User(Document):
    """User model representing TNIFMC employees"""
    
    organisation: str = Field(default="TNIFMC", description="Organization name")
    employment_type: EmploymentType = Field(..., description="Type of employment")
    name: str = Field(..., description="Full name")
    designation: str = Field(..., description="Job designation")
    email: EmailStr = Field(..., description="Email address", unique=True)
    phone: Optional[str] = Field(None, description="Phone number")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Authentication fields
    username: Optional[str] = Field(None, description="Username for login", unique=True)
    password_hash: Optional[str] = Field(None, description="Hashed password")
    roles: List[UserRole] = Field(default=[UserRole.USER], description="User roles")
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
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"