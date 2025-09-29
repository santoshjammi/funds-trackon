"""
Opportunity model for Lead Management System
Using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field
from typing import Optional
from datetime import datetime
from enum import Enum


class OpportunityStatus(str, Enum):
    """Opportunity status enumeration"""
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    CLOSED_WON = "Closed Won"
    CLOSED_LOST = "Closed Lost"


class Priority(str, Enum):
    """Priority levels"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Opportunity(Document):
    """Opportunity model for tracking business opportunities"""
    
    title: str = Field(..., description="Opportunity title")
    description: Optional[str] = Field(None, description="Detailed description")
    organisation: str = Field(..., description="Target organization")
    contact_id: Optional[str] = Field(None, description="Related contact ID")
    
    # Financial details
    estimated_value: Optional[float] = Field(None, description="Estimated value in INR Crores")
    probability: Optional[float] = Field(None, ge=0, le=100, description="Success probability (0-100%)")
    
    # Status and priority
    status: OpportunityStatus = Field(default=OpportunityStatus.OPEN)
    priority: Priority = Field(default=Priority.MEDIUM)
    
    # Assigned user
    assigned_to: Optional[str] = Field(None, description="Assigned user ID")
    
    # Timeline
    target_close_date: Optional[datetime] = Field(None, description="Target closure date")
    actual_close_date: Optional[datetime] = Field(None, description="Actual closure date")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "opportunities"
        indexes = [
            "organisation",
            "status",
            "priority", 
            "assigned_to",
            "contact_id"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Investment Opportunity - XYZ Bank",
                "organisation": "XYZ Bank",
                "estimated_value": 10.0,
                "probability": 75.0,
                "status": "In Progress",
                "priority": "High"
            }
        }
    
    def __repr__(self):
        return f"<Opportunity(id={self.id}, title='{self.title}', status='{self.status}')>"