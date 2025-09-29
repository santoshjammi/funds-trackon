"""
Contact Service - Business logic for contact management
Following SOLID principles with dependency injection
"""

from typing import List, Optional
from app.models.contact import Contact
from beanie import PydanticObjectId


class ContactService:
    """Service class for contact business logic"""
    
    async def create_contact(self, contact_data: dict) -> Contact:
        """Create a new contact"""
        contact = Contact(**contact_data)
        return await contact.insert()
    
    async def get_contact_by_id(self, contact_id: PydanticObjectId) -> Optional[Contact]:
        """Get contact by ID"""
        return await Contact.get(contact_id)
    
    async def get_all_contacts(self, skip: int = 0, limit: int = 100) -> List[Contact]:
        """Get all contacts with pagination"""
        return await Contact.find_all().skip(skip).limit(limit).to_list()
    
    async def update_contact(self, contact_id: PydanticObjectId, update_data: dict) -> Optional[Contact]:
        """Update contact by ID"""
        contact = await Contact.get(contact_id)
        if contact:
            for key, value in update_data.items():
                if hasattr(contact, key):
                    setattr(contact, key, value)
            await contact.save()
            return contact
        return None
    
    async def delete_contact(self, contact_id: PydanticObjectId) -> bool:
        """Delete contact by ID"""
        contact = await Contact.get(contact_id)
        if contact:
            await contact.delete()
            return True
        return False
    
    async def search_contacts(self, query: str) -> List[Contact]:
        """Search contacts by name, email, or company"""
        return await Contact.find({
            "$or": [
                {"first_name": {"$regex": query, "$options": "i"}},
                {"last_name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"company": {"$regex": query, "$options": "i"}}
            ]
        }).to_list()
    
    async def get_contacts_by_status(self, status: str) -> List[Contact]:
        """Get contacts by status"""
        return await Contact.find({"status": status}).to_list()