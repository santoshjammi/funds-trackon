"""
Contact controller for Lead Management System
Following SOLID principles with dependency injection
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from app.models.contact import Contact
from app.services.contact_service import ContactService

contact_router = APIRouter()

class ContactCreate(BaseModel):
    organisation: str
    name: str
    designation: Optional[str] = None
    branch_department: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    geography_region: Optional[str] = None
    country_location: Optional[str] = None
    sub_location: Optional[str] = None
    notes_comments: Optional[str] = None

class ContactUpdate(BaseModel):
    organisation: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    branch_department: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    geography_region: Optional[str] = None
    country_location: Optional[str] = None
    sub_location: Optional[str] = None
    notes_comments: Optional[str] = None

@contact_router.post("/", response_model=Contact)
async def create_contact(contact_data: ContactCreate):
    """Create a new contact"""
    try:
        contact = Contact(**contact_data.dict())
        await contact.insert()
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@contact_router.get("/", response_model=List[Contact])
async def get_contacts(
    skip: int = Query(0, ge=0),
    organisation: Optional[str] = None
):
    """Get all contacts with optional filtering"""
    try:
        query = {}
        if organisation:
            query["organisation"] = organisation
            
        contacts = await Contact.find(query).skip(skip).to_list()
        return contacts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@contact_router.get("/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str):
    """Get a specific contact by ID"""
    try:
        contact = await Contact.get(contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@contact_router.put("/{contact_id}", response_model=Contact)
async def update_contact(contact_id: str, contact_data: ContactUpdate):
    """Update a contact"""
    try:
        contact = await Contact.get(contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        update_data = contact_data.dict(exclude_unset=True)
        await contact.update({"$set": update_data})
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@contact_router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    try:
        contact = await Contact.get(contact_id)
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
            
        await contact.delete()
        return {"message": "Contact deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@contact_router.get("/search/", response_model=List[Contact])
async def search_contacts(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(500, ge=1, le=1000)
):
    """Search contacts by name or organisation"""
    try:
        contacts = await Contact.find({
            "$or": [
                {"name": {"$regex": q, "$options": "i"}},
                {"organisation": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}}
            ]
        }).limit(limit).to_list()
        return contacts
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))