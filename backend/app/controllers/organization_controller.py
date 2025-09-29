"""
Organization Controller for Lead Management System
Handles CRUD operations for organizations
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from beanie import PydanticObjectId

from ..models.organization import Organization, IndustryType, OrganizationStatus


# Request/Response models
class OrganizationCreate(BaseModel):
    """Organization creation model"""
    name: str
    industry: Optional[IndustryType] = None
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    size: Optional[str] = None
    founded_year: Optional[int] = None
    revenue: Optional[str] = None
    status: OrganizationStatus = OrganizationStatus.ACTIVE
    relationship_type: Optional[str] = None
    priority: Optional[str] = "Medium"
    notes: Optional[str] = None
    tags: List[str] = []


class OrganizationUpdate(BaseModel):
    """Organization update model"""
    name: Optional[str] = None
    industry: Optional[IndustryType] = None
    description: Optional[str] = None
    website: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    size: Optional[str] = None
    founded_year: Optional[int] = None
    revenue: Optional[str] = None
    status: Optional[OrganizationStatus] = None
    relationship_type: Optional[str] = None
    priority: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class OrganizationResponse(BaseModel):
    """Organization response model"""
    message: str
    id: Optional[str] = None


# Create router
organization_router = APIRouter(tags=["organizations"])


@organization_router.post("/", response_model=OrganizationResponse)
async def create_organization(organization: OrganizationCreate):
    """Create a new organization"""
    try:
        org_doc = Organization(**organization.dict())
        await org_doc.insert()
        return OrganizationResponse(message="Organization created successfully", id=str(org_doc.id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating organization: {str(e)}")


@organization_router.get("/", response_model=List[Organization])
async def get_all_organizations(
    skip: int = Query(0, ge=0, description="Number of organizations to skip"),
    limit: int = Query(500, ge=1, le=1000, description="Number of organizations to return"),
    industry: Optional[IndustryType] = Query(None, description="Filter by industry"),
    status: Optional[OrganizationStatus] = Query(None, description="Filter by status"),
    country: Optional[str] = Query(None, description="Filter by country"),
    search: Optional[str] = Query(None, description="Search in name, description, or city")
):
    """Get all organizations with optional filtering"""
    try:
        query = {}
        
        # Apply filters
        if industry:
            query["industry"] = industry
        if status:
            query["status"] = status
        if country:
            query["country"] = {"$regex": country, "$options": "i"}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"city": {"$regex": search, "$options": "i"}}
            ]
        
        organizations = await Organization.find(query).skip(skip).limit(limit).to_list()
        return organizations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching organizations: {str(e)}")


@organization_router.get("/{organization_id}", response_model=Organization)
async def get_organization(organization_id: str):
    """Get a specific organization by ID"""
    try:
        if not PydanticObjectId.is_valid(organization_id):
            raise HTTPException(status_code=400, detail="Invalid organization ID format")
        
        organization = await Organization.get(PydanticObjectId(organization_id))
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        return organization
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching organization: {str(e)}")


@organization_router.put("/{organization_id}", response_model=OrganizationResponse)
async def update_organization(organization_id: str, organization: OrganizationUpdate):
    """Update an existing organization"""
    try:
        if not PydanticObjectId.is_valid(organization_id):
            raise HTTPException(status_code=400, detail="Invalid organization ID format")
        
        org_doc = await Organization.get(PydanticObjectId(organization_id))
        if not org_doc:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        # Update fields that are provided
        update_data = organization.dict(exclude_unset=True)
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await org_doc.update({"$set": update_data})
        
        return OrganizationResponse(message="Organization updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating organization: {str(e)}")


@organization_router.delete("/{organization_id}", response_model=OrganizationResponse)
async def delete_organization(organization_id: str):
    """Delete an organization"""
    try:
        if not PydanticObjectId.is_valid(organization_id):
            raise HTTPException(status_code=400, detail="Invalid organization ID format")
        
        organization = await Organization.get(PydanticObjectId(organization_id))
        if not organization:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        await organization.delete()
        return OrganizationResponse(message="Organization deleted successfully")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting organization: {str(e)}")


@organization_router.get("/search/by-name", response_model=List[Organization])
async def search_organizations_by_name(
    name: str = Query(..., description="Organization name to search for"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return")
):
    """Search organizations by name (for autocomplete/lookup)"""
    try:
        organizations = await Organization.find(
            {"name": {"$regex": name, "$options": "i"}}
        ).limit(limit).to_list()
        return organizations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching organizations: {str(e)}")