"""
Document/Attachment model for Knowledge Base System
Handles various types of content including text, audio, image, video, documents, presentations
"""

from beanie import Document
from pydantic import Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import os


class DocumentType(str, Enum):
    """Document type enumeration"""
    TEXT = "text"
    AUDIO = "audio"
    IMAGE = "image"
    VIDEO = "video"
    DOCUMENT = "document"  # PDF, DOC, DOCX, XLS, XLSX
    PRESENTATION = "presentation"  # PPT, PPTX
    SPREADSHEET = "spreadsheet"
    OTHER = "other"


class DocumentCategory(str, Enum):
    """Document category for knowledge base organization"""
    SUMMARY = "summary"
    NOTES = "notes"
    DISCUSSION = "discussion"
    MEETING_MINUTES = "meeting_minutes"
    PRESENTATION = "presentation"
    CONTRACT = "contract"
    RESEARCH = "research"
    CORRESPONDENCE = "correspondence"
    OTHER = "other"


class DocumentStatus(str, Enum):
    """Document status enumeration"""
    ACTIVE = "active"
    ARCHIVED = "archived"
    DELETED = "deleted"


class DocumentMetadata(Document):
    """Document model for storing various types of content and attachments"""

    # Basic Information
    title: str = Field(..., description="Document title")
    description: Optional[str] = Field(None, description="Document description")
    document_type: DocumentType = Field(..., description="Type of document")
    category: DocumentCategory = Field(default=DocumentCategory.OTHER, description="Document category")

    # File Information (for uploaded files)
    filename: Optional[str] = Field(None, description="Original filename")
    file_path: Optional[str] = Field(None, description="Path to stored file")
    file_size: Optional[int] = Field(None, description="File size in bytes")
    mime_type: Optional[str] = Field(None, description="MIME type of the file")
    file_hash: Optional[str] = Field(None, description="File hash for integrity checking")

    # Content (for text-based documents)
    content: Optional[str] = Field(None, description="Text content of the document")

    # Relationships - Link to various entities
    fundraising_id: Optional[str] = Field(None, description="Related fundraising campaign ID")
    organization_id: Optional[str] = Field(None, description="Related organization ID")
    contact_id: Optional[str] = Field(None, description="Related contact ID")
    task_id: Optional[str] = Field(None, description="Related task ID")
    opportunity_id: Optional[str] = Field(None, description="Related opportunity ID")
    meeting_id: Optional[str] = Field(None, description="Related meeting ID")

    # Additional metadata
    tags: List[str] = Field(default=[], description="Document tags for search")
    custom_metadata: Dict[str, Any] = Field(default={}, description="Custom metadata fields")

    # Status and permissions
    status: DocumentStatus = Field(default=DocumentStatus.ACTIVE, description="Document status")
    is_public: bool = Field(default=False, description="Whether document is publicly accessible")
    access_permissions: List[str] = Field(default=[], description="User IDs with access permission")

    # Audit fields
    created_by: str = Field(..., description="User ID who created the document")
    updated_by: Optional[str] = Field(None, description="User ID who last updated the document")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "documents"
        indexes = [
            "document_type",
            "category",
            "status",
            "fundraising_id",
            "organization_id",
            "contact_id",
            "task_id",
            "opportunity_id",
            "meeting_id",
            "created_by",
            "created_at",
            [("tags", 1)],  # Array index for tags
            [("title", "text"), ("description", "text"), ("content", "text")]  # Text search index
        ]

    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Investment Discussion Summary - ABC Bank",
                "description": "Summary of discussion with ABC Bank regarding Series A investment",
                "document_type": "text",
                "category": "summary",
                "content": "Meeting summary content here...",
                "fundraising_id": "fundraising_id_123",
                "organization_id": "org_id_456",
                "contact_id": "contact_id_789",
                "tags": ["investment", "discussion", "ABC Bank"],
                "created_by": "user_id_123"
            }
        }

    def __repr__(self):
        return f"<Document(id={self.id}, title='{self.title}', type='{self.document_type}', category='{self.category}')>"

    @property
    def file_extension(self) -> Optional[str]:
        """Get file extension from filename"""
        if self.filename:
            return os.path.splitext(self.filename)[1].lower()
        return None

    @property
    def is_file_based(self) -> bool:
        """Check if document is file-based (has file_path)"""
        return self.file_path is not None

    @property
    def is_text_based(self) -> bool:
        """Check if document is text-based (has content)"""
        return self.content is not None

    def get_related_entity_ids(self) -> Dict[str, Optional[str]]:
        """Get all related entity IDs"""
        return {
            "fundraising_id": self.fundraising_id,
            "organization_id": self.organization_id,
            "contact_id": self.contact_id,
            "task_id": self.task_id,
            "opportunity_id": self.opportunity_id,
            "meeting_id": self.meeting_id
        }
