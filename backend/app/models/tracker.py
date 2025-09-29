"""
Tracker model for Lead Management System
Using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TrackerType(str, Enum):
    """Tracker type enumeration"""
    CONTACT = "Contact"
    FUNDRAISING = "Fundraising"
    OPPORTUNITY = "Opportunity"
    TASK = "Task"
    MEETING = "Meeting"
    EVENT = "Event"
    OTHER = "Other"


class Tracker(Document):
    """Tracker model for miscellaneous tracking data"""
    
    title: str = Field(..., description="Tracker title")
    category: str = Field(..., description="Tracker category")
    
    # Flexible data storage
    data: Dict[str, Any] = Field(default={}, description="Flexible tracking data")
    
    # Relationships
    contact_id: Optional[str] = Field(None, description="Related contact ID")
    fundraising_id: Optional[str] = Field(None, description="Related fundraising ID")
    opportunity_id: Optional[str] = Field(None, description="Related opportunity ID")
    user_id: Optional[str] = Field(None, description="Related user ID")
    
    # Metadata
    source: Optional[str] = Field(None, description="Data source")
    status: str = Field(default="Active", description="Tracker status")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tracker"
        indexes = [
            "category",
            "status",
            "contact_id",
            "fundraising_id",
            "opportunity_id",
            "user_id"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Meeting Follow-up Tracker",
                "category": "Meeting",
                "data": {
                    "meeting_date": "2024-01-10",
                    "attendees": ["John Doe", "Jane Smith"],
                    "action_items": ["Send proposal", "Schedule next meeting"]
                },
                "status": "Active"
            }
        }
    
    def __repr__(self):
        return f"<Tracker(id={self.id}, title='{self.title}', category='{self.category}')>"