"""
Tracker Controller - Handles tracking and analytics endpoints
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.tracker import Tracker, TrackerType
from beanie import PydanticObjectId

tracker_router = APIRouter(prefix="/tracker", tags=["tracker"])

# Request/Response models
class TrackerCreate(BaseModel):
    name: str
    tracker_type: TrackerType
    entity_id: str
    data: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

class TrackerUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

@tracker_router.post("/", response_model=dict)
async def create_tracker_entry(tracker_data: TrackerCreate):
    """Create a new tracker entry"""
    tracker = Tracker(**tracker_data.dict())
    await tracker.insert()
    return {"message": "Tracker entry created successfully", "id": str(tracker.id)}

@tracker_router.get("/", response_model=List[dict])
async def get_all_tracker_entries(
    skip: int = Query(0, ge=0)
):
    """Get all tracker entries"""
    trackers = await Tracker.find_all().skip(skip).to_list()
    return [tracker.dict() for tracker in trackers]

@tracker_router.get("/{tracker_id}", response_model=dict)
async def get_tracker_entry(tracker_id: PydanticObjectId):
    """Get a specific tracker entry"""
    tracker = await Tracker.get(tracker_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker entry not found")
    return tracker.dict()

@tracker_router.put("/{tracker_id}", response_model=dict)
async def update_tracker_entry(tracker_id: PydanticObjectId, update_data: TrackerUpdate):
    """Update a tracker entry"""
    tracker = await Tracker.get(tracker_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker entry not found")
    
    update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
    for key, value in update_dict.items():
        setattr(tracker, key, value)
    
    await tracker.save()
    return {"message": "Tracker entry updated successfully"}

@tracker_router.delete("/{tracker_id}", response_model=dict)
async def delete_tracker_entry(tracker_id: PydanticObjectId):
    """Delete a tracker entry"""
    tracker = await Tracker.get(tracker_id)
    if not tracker:
        raise HTTPException(status_code=404, detail="Tracker entry not found")
    
    await tracker.delete()
    return {"message": "Tracker entry deleted successfully"}

@tracker_router.get("/type/{tracker_type}", response_model=List[dict])
async def get_trackers_by_type(tracker_type: TrackerType):
    """Get tracker entries by type"""
    trackers = await Tracker.find({"tracker_type": tracker_type}).to_list()
    return [tracker.dict() for tracker in trackers]

@tracker_router.get("/entity/{entity_id}", response_model=List[dict])
async def get_trackers_by_entity(entity_id: str):
    """Get tracker entries by entity ID"""
    trackers = await Tracker.find({"entity_id": entity_id}).to_list()
    return [tracker.dict() for tracker in trackers]