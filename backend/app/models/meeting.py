"""
Meeting model for fundraising campaigns with audio recording capabilities
"""

from beanie import Document
from pydantic import Field, BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MeetingType(str, Enum):
    """Meeting types enumeration"""
    INITIAL_MEETING = "Initial Meeting"
    FOLLOW_UP = "Follow-up"
    DUE_DILIGENCE = "Due Diligence"
    CLOSING = "Closing"
    GENERAL_DISCUSSION = "General Discussion"


class MeetingStatus(str, Enum):
    """Meeting status enumeration"""
    SCHEDULED = "Scheduled"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    POSTPONED = "Postponed"


class AudioProcessingStatus(str, Enum):
    """Audio processing status enumeration"""
    NOT_STARTED = "Not Started"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"


class MeetingAttendee(BaseModel):
    """Meeting attendee information"""
    name: str
    designation: Optional[str] = None
    organisation: str
    email: Optional[str] = None
    is_internal: bool = False  # True for TNIFMC staff, False for external contacts


class AudioRecording(BaseModel):
    """Audio recording information"""
    filename: str
    original_filename: str
    file_size: int
    duration_seconds: Optional[float] = None
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    processing_status: AudioProcessingStatus = AudioProcessingStatus.NOT_STARTED
    transcript: Optional[str] = None
    transcript_summary: Optional[str] = None
    ai_insights: Optional[dict] = None  # Store AI-generated insights and tasks


class Meeting(Document):
    """Meeting model for fundraising campaigns with audio recording"""

    # Basic meeting information
    title: str = Field(..., description="Meeting title/subject")
    meeting_type: MeetingType = Field(..., description="Type of meeting")
    status: MeetingStatus = Field(MeetingStatus.SCHEDULED, description="Current meeting status")

    # Relationships
    fundraising_id: str = Field(..., description="Reference to fundraising campaign")
    contact_id: Optional[str] = Field(None, description="Reference to primary contact")

    # Scheduling
    scheduled_date: datetime = Field(..., description="Scheduled meeting date and time")
    actual_date: Optional[datetime] = Field(None, description="Actual meeting date and time")
    duration_minutes: Optional[int] = Field(None, description="Meeting duration in minutes")

    # Location and format
    location: Optional[str] = Field(None, description="Meeting location or virtual meeting link")
    is_virtual: bool = Field(False, description="Whether the meeting is virtual")

    # Attendees
    attendees: List[MeetingAttendee] = Field(default_factory=list, description="List of meeting attendees")
    tnifmc_representatives: List[str] = Field(default_factory=list, description="TNIFMC staff who attended")

    # Audio recording
    audio_recording: Optional[AudioRecording] = Field(None, description="Audio recording information")

    # Meeting content
    agenda: Optional[str] = Field(None, description="Meeting agenda")
    discussion_points: Optional[str] = Field(None, description="Key discussion points")
    action_items: Optional[str] = Field(None, description="Action items and follow-ups")
    notes: Optional[str] = Field(None, description="Additional meeting notes")

    # AI-generated content
    ai_summary: Optional[str] = Field(None, description="AI-generated meeting summary")
    ai_key_points: Optional[List[str]] = Field(None, description="AI-extracted key points")
    ai_action_items: Optional[List[str]] = Field(None, description="AI-suggested action items")
    ai_sentiment: Optional[str] = Field(None, description="AI-detected sentiment analysis")

    # Metadata
    created_by: str = Field(..., description="User ID who created the meeting")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "meetings"
        indexes = [
            "fundraising_id",
            "contact_id",
            "scheduled_date",
            "status",
            "meeting_type",
            "created_by",
            [("fundraising_id", 1), ("scheduled_date", -1)],  # Compound index for campaign meetings
            [("status", 1), ("scheduled_date", 1)]  # For upcoming meetings
        ]

    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Initial Investment Discussion with IOB",
                "meeting_type": "Initial Meeting",
                "status": "Completed",
                "fundraising_id": "60f1b2b3c4d5e6f7g8h9i0j1",
                "contact_id": "60f1b2b3c4d5e6f7g8h9i0j2",
                "scheduled_date": "2024-03-15T10:00:00Z",
                "actual_date": "2024-03-15T10:00:00Z",
                "duration_minutes": 90,
                "location": "Conference Room A, TNIFMC Office",
                "is_virtual": False,
                "attendees": [
                    {
                        "name": "Rajesh Kumar",
                        "designation": "Branch Manager",
                        "organisation": "IOB",
                        "email": "rajesh.kumar@iob.in",
                        "is_internal": False
                    }
                ],
                "tnifmc_representatives": ["K. Ganapathy Subramanian", "Krishna Chaitanya K"],
                "agenda": "Discuss investment opportunities in TNIFMC",
                "discussion_points": "Reviewed investment proposal, discussed terms",
                "action_items": "Send detailed proposal by next week",
                "created_by": "60f1b2b3c4d5e6f7g8h9i0j3"
            }
        }

    def __repr__(self):
        return f"<Meeting(id={self.id}, title='{self.title}', type='{self.meeting_type}', status='{self.status}')>"