"""
Contact model for Lead Management System
Based on rearrangedContacts.json structure using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field, EmailStr
from typing import Optional
from datetime import datetime


class Contact(Document):
    """Contact model representing external contacts"""
    
    organisation: str = Field(..., description="Organization name")
    name: str = Field(..., description="Contact person name")
    designation: Optional[str] = Field(None, description="Job title/designation")
    branch_department: Optional[str] = Field(None, alias="Branch__Deprtment")
    email: Optional[EmailStr] = Field(None, description="Email address")
    address: Optional[str] = Field(None, description="Physical address")
    phone: Optional[str] = Field(None, description="Phone number")
    mobile: Optional[str] = Field(None, description="Mobile number")
    geography_region: Optional[str] = Field(None, alias="Geography__Region")
    country_location: Optional[str] = Field(None, alias="Country__Location")
    sub_location: Optional[str] = Field(None, description="Sub location")
    notes_comments: Optional[str] = Field(None, alias="Notes__Comments")
    status: Optional[str] = Field("Active", description="Contact status (Active, Inactive, etc.)")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "contacts"
        indexes = [
            "organisation",
            "name",
            "email",
            [("organisation", 1), ("name", 1)]  # Compound index
        ]
    
    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "organisation": "Abu Dhabi Investment Council",
                "name": "Sinha MK",
                "designation": "CIO",
                "email": "sinha.mk@adic.ae",
                "phone": "+91 98672 00782",
                "geography_region": "Middle East",
                "country_location": "UAE"
            }
        }
    
    def __repr__(self):
        return f"<Contact(id={self.id}, name='{self.name}', organisation='{self.organisation}')>"