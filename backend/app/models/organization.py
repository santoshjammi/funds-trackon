"""
Organization model for Lead Management System
Represents organizations that contacts belong to
"""

from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class IndustryType(str, Enum):
    """Industry types enumeration"""
    BANKING = "Banking"
    INSURANCE = "Insurance"
    MUTUAL_FUNDS = "Mutual Funds"
    PENSION_FUNDS = "Pension Funds"
    ASSET_MANAGEMENT = "Asset Management"
    SOVEREIGN_WEALTH = "Sovereign Wealth Funds"
    CONSULTING = "Consulting"
    REAL_ESTATE = "Real Estate"
    INFRASTRUCTURE = "Infrastructure"
    GOVERNMENT = "Government"
    FINTECH = "FinTech"
    OTHER = "Other"


class OrganizationStatus(str, Enum):
    """Organization status enumeration"""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    PROSPECT = "Prospect"
    PARTNER = "Partner"
    COMPETITOR = "Competitor"


class Organization(Document):
    """Organization model representing companies and institutions"""
    
    # Basic Information
    name: str = Field(..., description="Organization name")
    industry: Optional[IndustryType] = Field(None, description="Industry type")
    description: Optional[str] = Field(None, description="Organization description")
    
    # Contact Information
    website: Optional[str] = Field(None, description="Organization website")
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    
    # Location Information
    address: Optional[str] = Field(None, description="Physical address")
    city: Optional[str] = Field(None, description="City")
    country: Optional[str] = Field(None, description="Country")
    region: Optional[str] = Field(None, description="Geographic region")
    
    # Business Information
    size: Optional[str] = Field(None, description="Organization size (employees)")
    founded_year: Optional[int] = Field(None, description="Year founded")
    revenue: Optional[str] = Field(None, description="Annual revenue")
    
    # Relationship Information
    status: OrganizationStatus = Field(OrganizationStatus.ACTIVE, description="Organization status")
    relationship_type: Optional[str] = Field(None, description="Type of relationship")
    priority: Optional[str] = Field("Medium", description="Priority level (High/Medium/Low)")
    
    # Additional Information
    notes: Optional[str] = Field(None, description="Additional notes")
    tags: List[str] = Field(default=[], description="Organization tags")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "organizations"
        indexes = [
            "name",
            "industry",
            "country",
            "status",
            [("name", 1), ("industry", 1)]  # Compound index
        ]
    
    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Abu Dhabi Investment Council",
                "industry": "Sovereign Wealth Funds",
                "description": "Sovereign wealth fund of Abu Dhabi",
                "website": "https://www.adic.ae",
                "email": "info@adic.ae",
                "phone": "+971 2 694 0000",
                "address": "Corniche Road West, Abu Dhabi",
                "city": "Abu Dhabi",
                "country": "UAE",
                "region": "Middle East",
                "size": "500-1000",
                "status": "Active",
                "priority": "High"
            }
        }
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name='{self.name}', industry='{self.industry}')>"