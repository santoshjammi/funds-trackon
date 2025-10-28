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
    """
    Organization-centric Knowledge Base Document Model
    
    Knowledge is organized around organizations with relationships to:
    - Fundraising campaigns targeting the organization
    - Opportunities with the organization
    - Tasks related to the organization
    - Contacts within the organization
    - Users managing the organization relationship
    """

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

    # Primary Organization Relationship (REQUIRED for knowledge base)
    organization_id: str = Field(..., description="Primary organization this knowledge relates to")
    
    # Secondary Relationships - All within context of the organization
    fundraising_id: Optional[str] = Field(None, description="Related fundraising campaign targeting this organization")
    opportunity_id: Optional[str] = Field(None, description="Related opportunity with this organization")
    task_id: Optional[str] = Field(None, description="Related task concerning this organization")
    meeting_id: Optional[str] = Field(None, description="Related meeting with this organization")
    
    # People Relationships - Contacts and Users involved with this organization
    contact_ids: List[str] = Field(default=[], description="Contacts from this organization involved in this knowledge")
    user_ids: List[str] = Field(default=[], description="Internal users managing relationship with this organization")
    
    # Cross-Entity Relationships for comprehensive knowledge mapping
    related_fundraising_ids: List[str] = Field(default=[], description="All fundraising campaigns involving this organization")
    related_opportunity_ids: List[str] = Field(default=[], description="All opportunities with this organization")
    related_task_ids: List[str] = Field(default=[], description="All tasks concerning this organization")

    # Knowledge Context and Discovery
    tags: List[str] = Field(default=[], description="Document tags for search and categorization")
    keywords: List[str] = Field(default=[], description="Key terms and phrases for semantic search")
    
    # Organization Context - Auto-populated from relationships
    organization_name: Optional[str] = Field(None, description="Cached organization name for search")
    industry_sector: Optional[str] = Field(None, description="Organization's industry sector")
    
    # Business Context
    business_impact: Optional[str] = Field(None, description="Business impact or relevance of this knowledge")
    confidentiality_level: str = Field(default="INTERNAL", description="PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED")
    
    # Knowledge Relationships
    parent_document_id: Optional[str] = Field(None, description="Parent document if this is a sub-document")
    related_document_ids: List[str] = Field(default=[], description="Related documents in the knowledge base")
    
    # Custom metadata for flexible knowledge organization
    custom_metadata: Dict[str, Any] = Field(default={}, description="Custom metadata fields")

    # Status and permissions
    status: DocumentStatus = Field(default=DocumentStatus.ACTIVE, description="Document status")
    is_public: bool = Field(default=False, description="Whether document is publicly accessible")
    access_permissions: List[str] = Field(default=[], description="User IDs with access permission")
    
    # Organization-based access control
    organization_access_only: bool = Field(default=True, description="Restrict access to users working on this organization")

    # Audit fields
    created_by: str = Field(..., description="User ID who created the document")
    updated_by: Optional[str] = Field(None, description="User ID who last updated the document")

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: Optional[datetime] = Field(None, description="When this knowledge was last accessed")
    
    # Knowledge Analytics
    access_count: int = Field(default=0, description="How many times this knowledge has been accessed")
    relevance_score: Optional[float] = Field(None, description="Computed relevance score based on usage and relationships")

    class Settings:
        name = "knowledge_base"
        indexes = [
            # Core document properties
            "document_type",
            "category", 
            "status",
            "confidentiality_level",
            
            # Primary organization-centric indexing
            "organization_id",
            "organization_name",
            "industry_sector",
            
            # Entity relationships for fast lookup
            "fundraising_id",
            "opportunity_id", 
            "task_id",
            "meeting_id",
            
            # People relationships
            [("contact_ids", 1)],  # Array index for contacts
            [("user_ids", 1)],     # Array index for users
            
            # Cross-entity relationships for comprehensive search
            [("related_fundraising_ids", 1)],
            [("related_opportunity_ids", 1)], 
            [("related_task_ids", 1)],
            
            # Knowledge discovery and search
            [("tags", 1)],         # Array index for tags
            [("keywords", 1)],     # Array index for keywords
            
            # Audit and analytics
            "created_by",
            "created_at",
            "last_accessed",
            "access_count",
            "relevance_score",
            
            # Comprehensive text search across all content
            [("title", "text"), ("description", "text"), ("content", "text"), 
             ("keywords", "text"), ("organization_name", "text")]
        ]

    class Config:
        validate_by_name = True
        json_schema_extra = {
            "example": {
                "title": "Investment Discussion Summary - ABC Bank Series A",
                "description": "Comprehensive summary of Series A funding discussions with ABC Bank including key stakeholders, terms discussed, and next steps",
                "document_type": "text",
                "category": "summary",
                "content": "Meeting summary content covering investment terms, due diligence requirements, timeline expectations...",
                "organization_id": "org_abc_bank_456",
                "organization_name": "ABC Bank Limited",
                "industry_sector": "Banking",
                "fundraising_id": "series_a_round_123",
                "opportunity_id": "abc_bank_investment_opportunity_789",
                "contact_ids": ["john_doe_abc_bank", "jane_smith_abc_bank"],
                "user_ids": ["internal_relationship_manager", "ceo"],
                "related_fundraising_ids": ["series_a_round_123"],
                "related_opportunity_ids": ["abc_bank_investment_opportunity_789"],
                "related_task_ids": ["due_diligence_task_123", "term_sheet_review_456"],
                "tags": ["series-a", "banking", "investment", "due-diligence"],
                "keywords": ["investment terms", "valuation", "equity stake", "board representation"],
                "business_impact": "Critical for Series A funding - potential lead investor",
                "confidentiality_level": "CONFIDENTIAL",
                "created_by": "user_relationship_manager_123"
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

    def get_related_entity_ids(self) -> Dict[str, Any]:
        """Get all related entity IDs for comprehensive relationship mapping"""
        return {
            "organization_id": self.organization_id,
            "fundraising_id": self.fundraising_id,
            "opportunity_id": self.opportunity_id,
            "task_id": self.task_id,
            "meeting_id": self.meeting_id,
            "contact_ids": self.contact_ids,
            "user_ids": self.user_ids,
            "related_fundraising_ids": self.related_fundraising_ids,
            "related_opportunity_ids": self.related_opportunity_ids,
            "related_task_ids": self.related_task_ids,
            "related_document_ids": self.related_document_ids
        }
    
    def get_organization_context(self) -> Dict[str, Any]:
        """Get organization-specific context for knowledge base queries"""
        return {
            "organization_id": self.organization_id,
            "organization_name": self.organization_name,
            "industry_sector": self.industry_sector,
            "all_contacts": self.contact_ids,
            "all_users": self.user_ids,
            "all_fundraising": self.related_fundraising_ids,
            "all_opportunities": self.related_opportunity_ids,
            "all_tasks": self.related_task_ids
        }
    
    async def update_access_analytics(self) -> None:
        """Update access tracking for knowledge analytics"""
        self.access_count += 1
        self.last_accessed = datetime.utcnow()
        await self.save()
    
    def calculate_relevance_score(self, context_weights: Dict[str, float] = None) -> float:
        """Calculate relevance score based on relationships and usage"""
        if context_weights is None:
            context_weights = {
                "access_count": 0.3,
                "relationship_depth": 0.4,  
                "recency": 0.2,
                "content_richness": 0.1
            }
        
        # Access frequency score
        access_score = min(self.access_count / 100.0, 1.0)
        
        # Relationship depth (more relationships = higher relevance)
        relationship_count = (
            len(self.contact_ids) + len(self.user_ids) +
            len(self.related_fundraising_ids) + len(self.related_opportunity_ids) +
            len(self.related_task_ids) + len(self.related_document_ids)
        )
        relationship_score = min(relationship_count / 20.0, 1.0)
        
        # Recency score (more recent = higher relevance)
        if self.last_accessed:
            days_since_access = (datetime.utcnow() - self.last_accessed).days
            recency_score = max(0, 1.0 - (days_since_access / 365.0))
        else:
            recency_score = 0.5
        
        # Content richness (tags, keywords, content length)
        content_indicators = len(self.tags) + len(self.keywords)
        if self.content:
            content_indicators += min(len(self.content) / 1000.0, 5.0)
        content_score = min(content_indicators / 10.0, 1.0)
        
        # Weighted final score
        final_score = (
            access_score * context_weights["access_count"] +
            relationship_score * context_weights["relationship_depth"] +
            recency_score * context_weights["recency"] +
            content_score * context_weights["content_richness"]
        )
        
        return round(final_score, 3)
