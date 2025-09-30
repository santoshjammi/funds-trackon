"""
Fundraising Controller - Handles fundraising campaign endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.fundraising import Fundraising, FundraisingStatus, InvestorType
from app.utils.config import get_settings
from beanie import PydanticObjectId
from datetime import datetime

fundraising_router = APIRouter(tags=["fundraising"])
settings = get_settings()

# Response models
class FundraisingResponse(BaseModel):
    id: str
    status_open_closed: str
    date_of_first_meeting_call: Optional[datetime]
    organisation: str
    reference: str
    tnifmc_request_inr_cr: Optional[float]
    niveshya_request_inr_cr: Optional[float] = None
    investor_type: Optional[str]
    responsibility_tnifmc: str
    responsibility_niveshya: Optional[str] = None
    feeler_teaser_letter_sent: Optional[bool]
    meetings_detailed_discussions_im_sent: Optional[bool]
    initial_appraisal_evaluation_process_started: Optional[bool]
    due_diligence_queries: Optional[bool]
    commitment_letter_conclusion: Optional[bool]
    initial_final_drawdown: Optional[bool]
    commitment_amount_inr_cr: Optional[float]
    current_status: Optional[str]
    notes: Optional[str]
    contact_id: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

# Request models
class FundraisingCreate(BaseModel):
    organisation: str
    reference: str
    status_open_closed: FundraisingStatus = FundraisingStatus.OPEN
    tnifmc_request_inr_cr: Optional[float] = None
    investor_type: Optional[InvestorType] = None
    responsibility_tnifmc: str
    commitment_amount_inr_cr: Optional[float] = None
    current_status: Optional[str] = None
    notes: Optional[str] = None

class FundraisingUpdate(BaseModel):
    organisation: Optional[str] = None
    reference: Optional[str] = None
    status_open_closed: Optional[FundraisingStatus] = None
    tnifmc_request_inr_cr: Optional[float] = None
    investor_type: Optional[InvestorType] = None
    responsibility_tnifmc: Optional[str] = None
    commitment_amount_inr_cr: Optional[float] = None
    current_status: Optional[str] = None
    notes: Optional[str] = None

@fundraising_router.post("/", response_model=dict)
async def create_fundraising_campaign(campaign_data: FundraisingCreate):
    """Create a new fundraising campaign"""
    try:
        payload = campaign_data.model_dump()
        # Dual-write: set new fields if provided via legacy names
        if settings.write_compat_tnifmc_fields:
            if payload.get("tnifmc_request_inr_cr") is not None and payload.get("niveshya_request_inr_cr") is None:
                payload["niveshya_request_inr_cr"] = payload["tnifmc_request_inr_cr"]
            if payload.get("responsibility_tnifmc") and not payload.get("responsibility_niveshya"):
                payload["responsibility_niveshya"] = payload["responsibility_tnifmc"]
        campaign = Fundraising(
            **payload,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        await campaign.create()
        return {"message": "Fundraising campaign created successfully", "id": str(campaign.id)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error creating campaign: {str(e)}")

@fundraising_router.get("/", response_model=List[FundraisingResponse])
async def get_all_campaigns(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=1000),
    status: Optional[FundraisingStatus] = Query(None, description="Filter by status"),
    organisation: Optional[str] = Query(None, description="Filter by organisation")
):
    """Get all fundraising campaigns"""
    try:
        query = {}
        if status:
            query["status_open_closed"] = status
        if organisation:
            query["organisation"] = {"$regex": organisation, "$options": "i"}
        
        campaigns = await Fundraising.find(query).skip(skip).limit(limit).to_list()
        
        # Convert to response format
        response = []
        for campaign in campaigns:
            resp = FundraisingResponse(
                id=str(campaign.id),
                status_open_closed=campaign.status_open_closed,
                date_of_first_meeting_call=campaign.date_of_first_meeting_call,
                organisation=campaign.organisation,
                reference=campaign.reference,
                tnifmc_request_inr_cr=campaign.tnifmc_request_inr_cr,
                niveshya_request_inr_cr=getattr(campaign, "niveshya_request_inr_cr", None),
                investor_type=campaign.investor_type,
                responsibility_tnifmc=campaign.responsibility_tnifmc,
                responsibility_niveshya=getattr(campaign, "responsibility_niveshya", None),
                feeler_teaser_letter_sent=campaign.feeler_teaser_letter_sent,
                meetings_detailed_discussions_im_sent=campaign.meetings_detailed_discussions_im_sent,
                initial_appraisal_evaluation_process_started=campaign.initial_appraisal_evaluation_process_started,
                due_diligence_queries=campaign.due_diligence_queries,
                commitment_letter_conclusion=campaign.commitment_letter_conclusion,
                initial_final_drawdown=campaign.initial_final_drawdown,
                commitment_amount_inr_cr=campaign.commitment_amount_inr_cr,
                current_status=campaign.current_status,
                notes=campaign.notes,
                contact_id=str(campaign.contact_id) if campaign.contact_id else None,
                created_at=campaign.created_at,
                updated_at=campaign.updated_at
            )
            response.append(resp)
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campaigns: {str(e)}")

@fundraising_router.get("/{campaign_id}", response_model=FundraisingResponse)
async def get_campaign(campaign_id: str):
    """Get a specific fundraising campaign"""
    try:
        if not PydanticObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            
        campaign = await Fundraising.get(PydanticObjectId(campaign_id))
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        return FundraisingResponse(
            id=str(campaign.id),
            status_open_closed=campaign.status_open_closed,
            date_of_first_meeting_call=campaign.date_of_first_meeting_call,
            organisation=campaign.organisation,
            reference=campaign.reference,
            tnifmc_request_inr_cr=campaign.tnifmc_request_inr_cr,
            niveshya_request_inr_cr=getattr(campaign, "niveshya_request_inr_cr", None),
            investor_type=campaign.investor_type,
            responsibility_tnifmc=campaign.responsibility_tnifmc,
            responsibility_niveshya=getattr(campaign, "responsibility_niveshya", None),
            feeler_teaser_letter_sent=campaign.feeler_teaser_letter_sent,
            meetings_detailed_discussions_im_sent=campaign.meetings_detailed_discussions_im_sent,
            initial_appraisal_evaluation_process_started=campaign.initial_appraisal_evaluation_process_started,
            due_diligence_queries=campaign.due_diligence_queries,
            commitment_letter_conclusion=campaign.commitment_letter_conclusion,
            initial_final_drawdown=campaign.initial_final_drawdown,
            commitment_amount_inr_cr=campaign.commitment_amount_inr_cr,
            current_status=campaign.current_status,
            notes=campaign.notes,
            contact_id=str(campaign.contact_id) if campaign.contact_id else None,
            created_at=campaign.created_at,
            updated_at=campaign.updated_at
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching campaign: {str(e)}")

@fundraising_router.put("/{campaign_id}", response_model=dict)
async def update_campaign(campaign_id: str, update_data: FundraisingUpdate):
    """Update a fundraising campaign"""
    try:
        if not PydanticObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            
        campaign = await Fundraising.get(PydanticObjectId(campaign_id))
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        update_dict = update_data.dict(exclude_unset=True)
        # Dual-write: copy legacy fields to new names on update
        if settings.write_compat_tnifmc_fields:
            if update_dict.get("tnifmc_request_inr_cr") is not None and update_dict.get("niveshya_request_inr_cr") is None:
                update_dict["niveshya_request_inr_cr"] = update_dict["tnifmc_request_inr_cr"]
            if update_dict.get("responsibility_tnifmc") and not update_dict.get("responsibility_niveshya"):
                update_dict["responsibility_niveshya"] = update_dict["responsibility_tnifmc"]
        if update_dict:
            for field, value in update_dict.items():
                setattr(campaign, field, value)
            await campaign.save()
        
        return {"message": "Campaign updated successfully", "id": str(campaign.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating campaign: {str(e)}")

@fundraising_router.delete("/{campaign_id}", response_model=dict)
async def delete_campaign(campaign_id: str):
    """Delete a fundraising campaign"""
    try:
        if not PydanticObjectId.is_valid(campaign_id):
            raise HTTPException(status_code=400, detail="Invalid campaign ID format")
            
        campaign = await Fundraising.get(PydanticObjectId(campaign_id))
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        await campaign.delete()
        return {"message": "Campaign deleted successfully", "id": campaign_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting campaign: {str(e)}")

@fundraising_router.post("/", response_model=dict)
async def create_campaign(campaign_data: FundraisingCreate):
    """Create a new fundraising campaign"""
    try:
        campaign = Fundraising(**campaign_data.dict())
        await campaign.save()
        return {"message": "Campaign created successfully", "id": str(campaign.id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating campaign: {str(e)}")

@fundraising_router.delete("/{campaign_id}", response_model=dict)
async def delete_campaign(campaign_id: PydanticObjectId):
    """Delete a fundraising campaign"""
    campaign = await Fundraising.get(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    await campaign.delete()
    return {"message": "Campaign deleted successfully"}

@fundraising_router.get("/status/{status}", response_model=List[dict])
async def get_campaigns_by_status(status: FundraisingStatus):
    """Get campaigns by status"""
    campaigns = await Fundraising.find({"status_open_closed": status}).to_list()
    return [campaign.dict() for campaign in campaigns]