"""
Task model for Lead Management System
Using MongoDB with Beanie ODM
"""

from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class TaskStatus(str, Enum):
    """Task status enumeration"""
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class TaskType(str, Enum):
    """Task type enumeration"""
    CALL = "Call"
    MEETING = "Meeting"
    EMAIL = "Email"
    FOLLOW_UP = "Follow Up"
    RESEARCH = "Research"
    PRESENTATION = "Presentation"
    OTHER = "Other"


class TaskPriority(str, Enum):
    """Task priority enumeration"""
    low = "Low"
    medium = "Medium"
    high = "High"
    urgent = "Urgent"


class Task(Document):
    """Task model for tracking activities"""
    
    title: str = Field(..., description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    task_type: TaskType = Field(default=TaskType.OTHER)
    status: TaskStatus = Field(default=TaskStatus.TODO)
    
    # Relationships
    contact_id: Optional[str] = Field(None, description="Related contact ID")
    opportunity_id: Optional[str] = Field(None, description="Related opportunity ID")
    fundraising_id: Optional[str] = Field(None, description="Related fundraising ID")
    
    # Assignment
    assigned_to: str = Field(..., description="Assigned user ID")
    assigned_by: Optional[str] = Field(None, description="User who assigned the task")
    
    # Timeline
    due_date: Optional[datetime] = Field(None, description="Task due date")
    completed_date: Optional[datetime] = Field(None, description="Task completion date")
    
    # Priority and tags
    priority: str = Field(default="Medium", description="Task priority")
    tags: List[str] = Field(default=[], description="Task tags")
    
    # Notes
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        name = "tasks"
        indexes = [
            "status",
            "assigned_to",
            "task_type",
            "contact_id",
            "opportunity_id",
            "due_date"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Follow up call with XYZ Bank",
                "description": "Discuss investment terms and next steps",
                "task_type": "Call",
                "status": "To Do",
                "assigned_to": "user_id_123",
                "due_date": "2024-01-15T10:00:00Z",
                "priority": "High"
            }
        }
    
    def __repr__(self):
        return f"<Task(id={self.id}, title='{self.title}', status='{self.status}')>"