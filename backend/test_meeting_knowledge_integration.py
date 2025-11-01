#!/usr/bin/env python3
"""
Test script to verify meeting notes and AI content are properly saved to knowledge base
"""

import asyncio
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import pymongo

# Import models
from app.models.meeting import Meeting
from app.models.fundraising import Fundraising
from app.models.contact import Contact
from app.models.organization import Organization
from app.models.document import Document
from app.services.document_service import DocumentService

async def test_meeting_knowledge_integration():
    """Test that meeting data gets properly synced to knowledge base"""
    
    # Connect to MongoDB
    try:
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        database = client["funds_tracker_db"]
        
        # Initialize Beanie with all models
        await init_beanie(
            database=database,
            document_models=[Meeting, Fundraising, Contact, Organization, Document]
        )
        
        print("✅ Connected to MongoDB and initialized models")
        
        # Find a meeting with notes or AI content
        meetings_with_content = await Meeting.find({
            "$or": [
                {"notes": {"$ne": None, "$ne": ""}},
                {"ai_summary": {"$ne": None, "$ne": ""}},
                {"ai_key_points": {"$ne": None, "$ne": []}},
                {"ai_action_items": {"$ne": None, "$ne": []}}
            ]
        }).to_list()
        
        if not meetings_with_content:
            print("❌ No meetings found with notes or AI content to test")
            return
            
        meeting = meetings_with_content[0]
        print(f"✅ Found meeting with content: {meeting.title}")
        print(f"   - Has notes: {bool(meeting.notes)}")
        print(f"   - Has AI summary: {bool(meeting.ai_summary)}")
        print(f"   - Has AI key points: {bool(meeting.ai_key_points)}")
        print(f"   - Has AI action items: {bool(meeting.ai_action_items)}")
        
        # Test the knowledge base integration
        doc_service = DocumentService()
        
        # Create/update knowledge base document
        kb_document = await doc_service.create_meeting_knowledge_document(str(meeting.id))
        
        if kb_document:
            print(f"✅ Knowledge base document created/updated:")
            print(f"   - Document ID: {kb_document.id}")
            print(f"   - Title: {kb_document.title}")
            print(f"   - Type: {kb_document.document_type}")
            print(f"   - Organization ID: {kb_document.organization_id}")
            print(f"   - Meeting ID: {kb_document.meeting_id}")
            print(f"   - Content length: {len(kb_document.content)} characters")
            print(f"   - Related fundraising: {len(kb_document.related_fundraising_ids)} campaigns")
            print(f"   - Related contacts: {len(kb_document.contact_ids)} contacts")
            
            # Verify knowledge base searchability
            if kb_document.organization_id:
                search_results = await doc_service.search_knowledge_by_organization(
                    str(kb_document.organization_id), 
                    meeting.title[:10]  # Search for part of meeting title
                )
                
                if any(doc.id == kb_document.id for doc in search_results):
                    print("✅ Knowledge base document is searchable")
                else:
                    print("⚠️  Knowledge base document not found in search (may need indexing)")
            
        else:
            print("❌ Failed to create knowledge base document")
            
        # Test organization knowledge base retrieval
        if kb_document and kb_document.organization_id:
            org_knowledge = await doc_service.get_organization_knowledge_base(str(kb_document.organization_id))
            meeting_docs = [doc for doc in org_knowledge if doc.meeting_id == str(meeting.id)]
            
            if meeting_docs:
                print(f"✅ Meeting document found in organization knowledge base")
                print(f"   - Organization has {len(org_knowledge)} total documents")
            else:
                print("❌ Meeting document not found in organization knowledge base")
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            client.close()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(test_meeting_knowledge_integration())