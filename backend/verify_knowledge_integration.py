#!/usr/bin/env python3
"""
Direct verification script to check if meeting knowledge base integration is working
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Import models
from app.models.meeting import Meeting
from app.models.document import Document
from app.models.fundraising import Fundraising
from app.models.organization import Organization

async def verify_knowledge_integration():
    """Verify that meeting knowledge integration is working"""
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        database = client["funds_tracker_db"]
        
        # Initialize Beanie with all models
        await init_beanie(
            database=database,
            document_models=[Meeting, Document, Fundraising, Organization]
        )
        
        print("✅ Connected to MongoDB and initialized models")
        
        # Find recent meetings with content
        recent_meetings = await Meeting.find().sort([("created_at", -1)]).limit(5).to_list()
        
        print(f"📋 Found {len(recent_meetings)} recent meetings")
        
        for meeting in recent_meetings:
            print(f"\n🔍 Checking meeting: {meeting.title}")
            print(f"   ID: {meeting.id}")
            print(f"   Has notes: {bool(meeting.notes)}")
            print(f"   Has AI summary: {bool(meeting.ai_summary)}")
            print(f"   Fundraising ID: {meeting.fundraising_id}")
            
            # Check for corresponding knowledge base documents
            meeting_docs = await Document.find({"meeting_id": str(meeting.id)}).to_list()
            
            if meeting_docs:
                print(f"✅ Found {len(meeting_docs)} knowledge base document(s)")
                for doc in meeting_docs:
                    print(f"   📄 Document: {doc.title}")
                    print(f"      Type: {doc.document_type}")
                    print(f"      Organization ID: {doc.organization_id}")
                    print(f"      Content length: {len(doc.content or '')}")
                    
                    # Check content
                    if meeting.notes and meeting.notes in doc.content:
                        print(f"      ✅ Meeting notes found in document")
                    if meeting.ai_summary and meeting.ai_summary in doc.content:
                        print(f"      ✅ AI summary found in document")
                    if meeting.ai_key_points and any(point in doc.content for point in meeting.ai_key_points):
                        print(f"      ✅ AI key points found in document")
                    if meeting.ai_action_items and any(item in doc.content for item in meeting.ai_action_items):
                        print(f"      ✅ AI action items found in document")
                        
            else:
                print(f"   ⚠️ No knowledge base documents found for this meeting")
                
        # Check total document counts
        total_docs = await Document.count()
        meeting_docs = await Document.find({"document_type": "meeting_minutes"}).count()
        
        print(f"\n📊 Database summary:")
        print(f"   Total documents: {total_docs}")
        print(f"   Meeting minutes documents: {meeting_docs}")
        
        # Check organizations
        organizations = await Organization.find().to_list()
        print(f"   Organizations: {len(organizations)}")
        
        for org in organizations[:3]:  # Show first 3
            org_docs = await Document.find({"organization_id": org.id}).count()
            print(f"      {org.name}: {org_docs} documents")
        
    except Exception as e:
        print(f"❌ Verification failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        try:
            client.close()
        except:
            pass

if __name__ == "__main__":
    asyncio.run(verify_knowledge_integration())