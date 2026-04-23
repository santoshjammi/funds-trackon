"""
Document controller for Lead Management System
Following SOLID principles with dependency injection
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from pydantic import BaseModel
from app.models.document import DocumentMetadata as Document, DocumentType, DocumentCategory, DocumentStatus
from app.services.document_service import DocumentService

document_router = APIRouter()

class DocumentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    category: DocumentCategory = DocumentCategory.OTHER
    content: Optional[str] = None
    
    # Organization is required for knowledge base
    organization_id: str
    organization_name: Optional[str] = None
    industry_sector: Optional[str] = None
    
    # Entity relationships
    fundraising_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    task_id: Optional[str] = None
    meeting_id: Optional[str] = None
    
    # People relationships
    contact_ids: List[str] = []
    user_ids: List[str] = []
    
    # Cross-entity relationships
    related_fundraising_ids: List[str] = []
    related_opportunity_ids: List[str] = []
    related_task_ids: List[str] = []
    related_document_ids: List[str] = []
    
    # Knowledge metadata
    tags: List[str] = []
    keywords: List[str] = []
    business_impact: Optional[str] = None
    confidentiality_level: str = "INTERNAL"
    custom_metadata: dict = {}
    
    # Access control
    is_public: bool = False
    organization_access_only: bool = True
    access_permissions: List[str] = []
    
    created_by: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[DocumentType] = None
    category: Optional[DocumentCategory] = None
    content: Optional[str] = None
    fundraising_id: Optional[str] = None
    organization_id: Optional[str] = None
    contact_id: Optional[str] = None
    task_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    meeting_id: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_metadata: Optional[dict] = None
    is_public: Optional[bool] = None
    access_permissions: Optional[List[str]] = None
    updated_by: Optional[str] = None

@document_router.post("", response_model=Document)
async def create_document(document_data: DocumentCreate):
    """Create a new document with organization context"""
    try:
        # Auto-populate organization context if not provided
        from app.models.organization import Organization
        
        data_dict = document_data.dict()
        
        if not data_dict.get("organization_name") or not data_dict.get("industry_sector"):
            org = await Organization.get(document_data.organization_id)
            if org:
                data_dict["organization_name"] = org.name
                data_dict["industry_sector"] = org.industry.value if org.industry else None
        
        # Calculate initial relevance score
        service = DocumentService()
        document = await service.create_document(data_dict)
        
        # Set initial relevance score
        if hasattr(document, 'calculate_relevance_score'):
            document.relevance_score = document.calculate_relevance_score()
            await document.save()
        
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/{document_id}", response_model=Document)
async def get_document(document_id: str):
    """Get document by ID"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.get_document_by_id(PydanticObjectId(document_id))
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("", response_model=List[Document])
async def get_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get all documents with pagination"""
    try:
        service = DocumentService()
        return await service.get_all_documents(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.put("/{document_id}", response_model=Document)
async def update_document(document_id: str, document_data: DocumentUpdate):
    """Update document by ID"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.update_document(PydanticObjectId(document_id), document_data.dict(exclude_unset=True))
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Delete document by ID"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        deleted = await service.delete_document(PydanticObjectId(document_id))
        if not deleted:
            raise HTTPException(status_code=404, detail="Document not found")
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/search/", response_model=List[Document])
async def search_documents(
    q: str = Query(..., description="Search query"),
    document_type: Optional[DocumentType] = None,
    category: Optional[DocumentCategory] = None
):
    """Search documents by title, description, content, or tags"""
    try:
        service = DocumentService()
        return await service.search_documents(q, document_type, category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/entity/{entity_type}/{entity_id}", response_model=List[Document])
async def get_documents_by_entity(entity_type: str, entity_id: str):
    """Get documents related to a specific entity"""
    try:
        service = DocumentService()
        return await service.get_documents_by_entity(entity_type, entity_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/organization/{organization_id}/knowledge-base", response_model=List[Document])
async def get_organization_knowledge_base(organization_id: str, include_related: bool = True):
    """Get comprehensive knowledge base for an organization"""
    try:
        service = DocumentService()
        return await service.get_organization_knowledge_base(organization_id, include_related)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/organization/{organization_id}/entity/{entity_type}/{entity_id}", response_model=List[Document])
async def get_cross_entity_knowledge(organization_id: str, entity_type: str, entity_id: str):
    """Get knowledge connecting specific entity to organization context"""
    try:
        service = DocumentService()
        return await service.get_cross_entity_knowledge(entity_type, entity_id, organization_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/organization/{organization_id}/search", response_model=List[Document])
async def search_organization_knowledge(
    organization_id: str,
    q: str = Query(..., description="Search query"),
    document_type: Optional[DocumentType] = None,
    category: Optional[DocumentCategory] = None
):
    """Search knowledge base within organization context"""
    try:
        service = DocumentService()
        return await service.search_knowledge_by_organization(organization_id, q, document_type, category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.put("/{document_id}/relationships", response_model=Document)
async def update_document_relationships(document_id: str, relationships: dict):
    """Update document relationships for knowledge connectivity"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.update_document_relationships(PydanticObjectId(document_id), relationships)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/type/{document_type}", response_model=List[Document])
async def get_documents_by_type(document_type: DocumentType):
    """Get documents by type"""
    try:
        service = DocumentService()
        return await service.get_documents_by_type(document_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/category/{category}", response_model=List[Document])
async def get_documents_by_category(category: DocumentCategory):
    """Get documents by category"""
    try:
        service = DocumentService()
        return await service.get_documents_by_category(category)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/status/{status}", response_model=List[Document])
async def get_documents_by_status(status: DocumentStatus):
    """Get documents by status"""
    try:
        service = DocumentService()
        return await service.get_documents_by_status(status)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.get("/user/{user_id}", response_model=List[Document])
async def get_documents_by_user(user_id: str):
    """Get documents created by a specific user"""
    try:
        service = DocumentService()
        return await service.get_documents_by_user(user_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.patch("/{document_id}/status", response_model=Document)
async def update_document_status(document_id: str, status: DocumentStatus):
    """Update document status"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.update_document_status(PydanticObjectId(document_id), status)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.post("/{document_id}/tags", response_model=Document)
async def add_tags_to_document(document_id: str, tags: List[str]):
    """Add tags to a document"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.add_tags_to_document(PydanticObjectId(document_id), tags)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@document_router.delete("/{document_id}/tags", response_model=Document)
async def remove_tags_from_document(document_id: str, tags: List[str]):
    """Remove tags from a document"""
    try:
        from beanie import PydanticObjectId
        service = DocumentService()
        document = await service.remove_tags_from_document(PydanticObjectId(document_id), tags)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))