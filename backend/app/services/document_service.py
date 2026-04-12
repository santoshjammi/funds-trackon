"""
Document Service - Business logic for document management
Following SOLID principles with dependency injection
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.document import DocumentMetadata, DocumentType, DocumentCategory, DocumentStatus
from beanie import PydanticObjectId

Document = DocumentMetadata  # alias for brevity


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
        """Get documents related to a specific entity with organization-centric approach"""
        
        if entity_type == "organization":
            # For organizations, get all knowledge related to this organization
            return await Document.find({"organization_id": entity_id}).to_list()
        
        elif entity_type == "fundraising":
            # Get documents directly linked or in related arrays
            return await Document.find({
                "$or": [
                    {"fundraising_id": entity_id},
                    {"related_fundraising_ids": entity_id}
                ]
            }).to_list()
        
        elif entity_type == "opportunity":
            return await Document.find({
                "$or": [
                    {"opportunity_id": entity_id},
                    {"related_opportunity_ids": entity_id}
                ]
            }).to_list()
        
        elif entity_type == "task":
            return await Document.find({
                "$or": [
                    {"task_id": entity_id},
                    {"related_task_ids": entity_id}
                ]
            }).to_list()
            
        elif entity_type == "contact":
            return await Document.find({"contact_ids": entity_id}).to_list()
            
        elif entity_type == "user":
            return await Document.find({"user_ids": entity_id}).to_list()
            
        elif entity_type == "meeting":
            return await Document.find({"meeting_id": entity_id}).to_list()

        return []

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

    async def get_organization_knowledge_base(self, organization_id: str, 
                                            include_related: bool = True) -> List[Document]:
        """Get comprehensive knowledge base for an organization"""
        query = {"organization_id": organization_id}
        documents = await Document.find(query).to_list()
        
        # Update access analytics for retrieved documents
        for doc in documents:
            await doc.update_access_analytics()
        
        # Sort by relevance score if available
        documents.sort(key=lambda x: x.relevance_score or 0, reverse=True)
        
        return documents

    async def get_cross_entity_knowledge(self, entity_type: str, entity_id: str, 
                                       organization_id: str) -> List[Document]:
        """Get knowledge that connects specific entity to organization context"""
        base_query = {"organization_id": organization_id}
        
        if entity_type == "fundraising":
            base_query["$or"] = [
                {"fundraising_id": entity_id},
                {"related_fundraising_ids": entity_id}
            ]
        elif entity_type == "opportunity":
            base_query["$or"] = [
                {"opportunity_id": entity_id}, 
                {"related_opportunity_ids": entity_id}
            ]
        elif entity_type == "task":
            base_query["$or"] = [
                {"task_id": entity_id},
                {"related_task_ids": entity_id}
            ]
        elif entity_type == "contact":
            base_query["contact_ids"] = entity_id
        elif entity_type == "user":
            base_query["user_ids"] = entity_id
        
        return await Document.find(base_query).to_list()

    async def search_knowledge_by_organization(self, organization_id: str, 
                                             query: str, 
                                             document_type: Optional[DocumentType] = None,
                                             category: Optional[DocumentCategory] = None) -> List[Document]:
        """Search knowledge base with organization context"""
        search_filter = {
            "organization_id": organization_id,
            "$text": {"$search": query}
        }

        if document_type:
            search_filter["document_type"] = document_type
        if category:
            search_filter["category"] = category

        documents = await Document.find(search_filter).to_list()
        
        # Update access analytics and sort by relevance
        for doc in documents:
            await doc.update_access_analytics()
            # Recalculate relevance score based on search context
            doc.relevance_score = doc.calculate_relevance_score()
            
        documents.sort(key=lambda x: x.relevance_score or 0, reverse=True)
        return documents

    async def update_document_relationships(self, document_id: PydanticObjectId,
                                          relationships: Dict[str, Any]) -> Optional[Document]:
        """Update document relationships for knowledge base connectivity"""
        document = await Document.get(document_id)
        if not document:
            return None
            
        # Update relationship arrays safely
        if "contact_ids" in relationships:
            document.contact_ids = list(set(document.contact_ids + relationships["contact_ids"]))
        if "user_ids" in relationships:
            document.user_ids = list(set(document.user_ids + relationships["user_ids"]))
        if "related_fundraising_ids" in relationships:
            document.related_fundraising_ids = list(set(document.related_fundraising_ids + relationships["related_fundraising_ids"]))
        if "related_opportunity_ids" in relationships:
            document.related_opportunity_ids = list(set(document.related_opportunity_ids + relationships["related_opportunity_ids"]))
        if "related_task_ids" in relationships:
            document.related_task_ids = list(set(document.related_task_ids + relationships["related_task_ids"]))
        if "related_document_ids" in relationships:
            document.related_document_ids = list(set(document.related_document_ids + relationships["related_document_ids"]))
            
        document.updated_at = datetime.utcnow()
        await document.save()
        return document

    async def create_meeting_knowledge_document(self, meeting_id: str) -> Optional[Document]:
        """Create or update knowledge base document from meeting data"""
        from app.models.meeting import Meeting
        from app.models.fundraising import Fundraising
        from app.models.contact import Contact
        
        meeting = await Meeting.get(meeting_id)
        if not meeting:
            return None
            
        # Get related data for context
        fundraising = await Fundraising.get(meeting.fundraising_id) if meeting.fundraising_id else None
        contact = await Contact.get(meeting.contact_id) if meeting.contact_id else None
        
        if not fundraising:
            # Cannot create knowledge document without organization context
            return None
            
        # Find or create organization by name from fundraising
        from app.models.organization import Organization
        organization = await Organization.find_one({"name": fundraising.organisation})
        
        if not organization:
            # Create organization if it doesn't exist
            organization = Organization(
                name=fundraising.organisation,
                status="Active",
                relationship_type="Client"
            )
            await organization.insert()
            
        # Check if document already exists for this meeting
        existing_docs = await Document.find({"meeting_id": meeting_id}).to_list()
        
        # Prepare document content
        content_parts = []
        
        # Add meeting basic info
        content_parts.append(f"# Meeting: {meeting.title}")
        content_parts.append(f"**Date:** {meeting.scheduled_date or meeting.actual_date}")
        content_parts.append(f"**Type:** {meeting.meeting_type}")
        content_parts.append(f"**Status:** {meeting.status}")
        
        if meeting.location:
            content_parts.append(f"**Location:** {meeting.location}")
            
        if meeting.agenda:
            content_parts.append(f"\n## Agenda\n{meeting.agenda}")
            
        # Add manual notes if present
        if meeting.notes:
            content_parts.append(f"\n## Notes\n{meeting.notes}")
            
        # Add AI-generated content
        if meeting.ai_summary:
            content_parts.append(f"\n## AI Summary\n{meeting.ai_summary}")
            
        if meeting.ai_key_points:
            content_parts.append(f"\n## Key Points\n" + "\n".join([f"- {point}" for point in meeting.ai_key_points]))
            
        if meeting.ai_action_items:
            content_parts.append(f"\n## Action Items\n" + "\n".join([f"- {item}" for item in meeting.ai_action_items]))
            
        # Add transcript if available
        if meeting.audio_recording and meeting.audio_recording.transcript:
            content_parts.append(f"\n## Transcript\n{meeting.audio_recording.transcript}")
            
        content = "\n\n".join(content_parts)
        
        # Determine document title
        title = f"Meeting: {meeting.title} - {fundraising.organisation}"
        
        # Prepare relationship data
        contact_ids = [str(contact.id)] if contact else []
        user_ids = []
        if meeting.created_by:
            user_ids.append(meeting.created_by)
            
        # Create or update document
        if existing_docs:
            # Update existing document
            doc = existing_docs[0]
            doc.title = title
            doc.content = content
            doc.contact_ids = list(set(doc.contact_ids + contact_ids))
            doc.user_ids = list(set(doc.user_ids + user_ids))
            doc.related_fundraising_ids = list(set(doc.related_fundraising_ids + [str(fundraising.id)]))
            doc.updated_at = datetime.utcnow()
            await doc.save()
            return doc
        else:
            # Create new document
            doc = Document(
                title=title,
                content=content,
                document_type=DocumentType.MEETING_MINUTES,
                category=DocumentCategory.MEETING_MINUTES,
                status=DocumentStatus.ACTIVE,
                organization_id=organization.id,
                organization_name=organization.name,
                meeting_id=meeting_id,
                contact_ids=contact_ids,
                user_ids=user_ids,
                related_fundraising_ids=[str(fundraising.id)],
                created_by=meeting.created_by or "system"
            )
            await doc.insert()
            return doc