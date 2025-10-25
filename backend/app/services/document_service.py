"""
Document Service - Business logic for document management
Following SOLID principles with dependency injection
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.document import Document, DocumentType, DocumentCategory, DocumentStatus
from beanie import PydanticObjectId


class DocumentService:
    """Service class for document business logic"""

    async def create_document(self, document_data: dict) -> Document:
        """Create a new document"""
        document = Document(**document_data)
        return await document.insert()

    async def get_document_by_id(self, document_id: PydanticObjectId) -> Optional[Document]:
        """Get document by ID"""
        return await Document.get(document_id)

    async def get_all_documents(self, skip: int = 0, limit: int = 100) -> List[Document]:
        """Get all documents with pagination"""
        return await Document.find_all().skip(skip).limit(limit).to_list()

    async def update_document(self, document_id: PydanticObjectId, update_data: dict) -> Optional[Document]:
        """Update document by ID"""
        document = await Document.get(document_id)
        if document:
            for key, value in update_data.items():
                if hasattr(document, key):
                    setattr(document, key, value)
            document.updated_at = datetime.utcnow()
            await document.save()
            return document
        return None

    async def delete_document(self, document_id: PydanticObjectId) -> bool:
        """Delete document by ID"""
        document = await Document.get(document_id)
        if document:
            await document.delete()
            return True
        return False

    async def search_documents(self, query: str, document_type: Optional[DocumentType] = None,
                             category: Optional[DocumentCategory] = None) -> List[Document]:
        """Search documents by title, description, content, or tags"""
        search_filter = {
            "$text": {"$search": query}
        }

        if document_type:
            search_filter["document_type"] = document_type
        if category:
            search_filter["category"] = category

        return await Document.find(search_filter).to_list()

    async def get_documents_by_entity(self, entity_type: str, entity_id: str) -> List[Document]:
        """Get documents related to a specific entity (organization, contact, etc.)"""
        entity_field_map = {
            "fundraising": "fundraising_id",
            "organization": "organization_id",
            "contact": "contact_id",
            "task": "task_id",
            "opportunity": "opportunity_id",
            "meeting": "meeting_id"
        }

        if entity_type not in entity_field_map:
            return []

        field_name = entity_field_map[entity_type]
        return await Document.find({field_name: entity_id}).to_list()

    async def get_documents_by_type(self, document_type: DocumentType) -> List[Document]:
        """Get documents by type"""
        return await Document.find({"document_type": document_type}).to_list()

    async def get_documents_by_category(self, category: DocumentCategory) -> List[Document]:
        """Get documents by category"""
        return await Document.find({"category": category}).to_list()

    async def get_documents_by_status(self, status: DocumentStatus) -> List[Document]:
        """Get documents by status"""
        return await Document.find({"status": status}).to_list()

    async def get_documents_by_user(self, user_id: str) -> List[Document]:
        """Get documents created by a specific user"""
        return await Document.find({"created_by": user_id}).to_list()

    async def update_document_status(self, document_id: PydanticObjectId, status: DocumentStatus) -> Optional[Document]:
        """Update document status"""
        document = await Document.get(document_id)
        if document:
            document.status = status
            document.updated_at = datetime.utcnow()
            await document.save()
            return document
        return None

    async def add_tags_to_document(self, document_id: PydanticObjectId, tags: List[str]) -> Optional[Document]:
        """Add tags to a document"""
        document = await Document.get(document_id)
        if document:
            for tag in tags:
                if tag not in document.tags:
                    document.tags.append(tag)
            document.updated_at = datetime.utcnow()
            await document.save()
            return document
        return None

    async def remove_tags_from_document(self, document_id: PydanticObjectId, tags: List[str]) -> Optional[Document]:
        """Remove tags from a document"""
        document = await Document.get(document_id)
        if document:
            document.tags = [tag for tag in document.tags if tag not in tags]
            document.updated_at = datetime.utcnow()
            await document.save()
            return document
        return None