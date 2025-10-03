"""
Opportunity Controller - Handles investment opportunity endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.opportunity import Opportunity, OpportunityStatus
from beanie import PydanticObjectId

opportunity_router = APIRouter(tags=["opportunities"])

# Request/Response models
class OpportunityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    organisation: str
    estimated_value: Optional[float] = None
    probability: Optional[float] = None
    status: OpportunityStatus = OpportunityStatus.OPEN
    priority: str = "Medium"
    contact_id: Optional[str] = None
    assigned_to: Optional[str] = None
    target_close_date: Optional[str] = None

class OpportunityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    organisation: Optional[str] = None
    estimated_value: Optional[float] = None
    probability: Optional[float] = None
    status: Optional[OpportunityStatus] = None
    priority: Optional[str] = None
    contact_id: Optional[str] = None
    assigned_to: Optional[str] = None
    target_close_date: Optional[str] = None

@opportunity_router.post("/", response_model=dict)
async def create_opportunity(opportunity_data: OpportunityCreate):
    """Create a new investment opportunity"""
    opportunity = Opportunity(**opportunity_data.dict())
    await opportunity.insert()
    return {"message": "Opportunity created successfully", "id": str(opportunity.id)}

@opportunity_router.get("/", response_model=List[dict])
async def get_all_opportunities(
    skip: int = Query(0, ge=0)
):
    """Get all investment opportunities"""
    opportunities = await Opportunity.find_all().skip(skip).to_list()
    return [opportunity.dict() for opportunity in opportunities]

@opportunity_router.get("/{opportunity_id}", response_model=dict)
async def get_opportunity(opportunity_id: PydanticObjectId):
    """Get a specific investment opportunity"""
    opportunity = await Opportunity.get(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity.dict()

@opportunity_router.put("/{opportunity_id}", response_model=dict)
async def update_opportunity(opportunity_id: PydanticObjectId, update_data: OpportunityUpdate):
    """Update an investment opportunity"""
    opportunity = await Opportunity.get(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    for key, value in update_dict.items():
        setattr(opportunity, key, value)
    
    await opportunity.save()
    return {"message": "Opportunity updated successfully"}

@opportunity_router.delete("/{opportunity_id}", response_model=dict)
async def delete_opportunity(opportunity_id: PydanticObjectId):
    """Delete an investment opportunity"""
    opportunity = await Opportunity.get(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    await opportunity.delete()
    return {"message": "Opportunity deleted successfully"}

@opportunity_router.get("/sector/{sector}", response_model=List[dict])
async def get_opportunities_by_sector(sector: str):
    """Get opportunities by sector"""
    opportunities = await Opportunity.find({"sector": sector}).to_list()
    return [opportunity.dict() for opportunity in opportunities]