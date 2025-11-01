#!/usr/bin/env python3
"""
Simple API test for meeting knowledge base integration
Tests the actual running API endpoints
"""

import asyncio
import aiohttp
import json
from datetime import datetime

BASE_URL = "http://localhost:8001"

async def test_meeting_knowledge_api():
    """Test meeting creation and knowledge base integration via API"""
    
    async with aiohttp.ClientSession() as session:
        print("🔐 Logging in...")
        
        # Login to get token
        login_data = {
            "email": "admin@tnifmc.com",
            "password": "admin123"
        }
        
        async with session.post(f"{BASE_URL}/api/auth/login", json=login_data) as resp:
            if resp.status != 200:
                print(f"❌ Login failed: {resp.status}")
                return
            
            auth_result = await resp.json()
            token = auth_result.get("access_token")
            
        if not token:
            print("❌ No token received")
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ Login successful")
        
        # Get organizations to find one for testing
        print("🏢 Getting organizations...")
        async with session.get(f"{BASE_URL}/api/organizations", headers=headers) as resp:
            if resp.status != 200:
                print(f"❌ Failed to get organizations: {resp.status}")
                return
            organizations = await resp.json()
            
        if not organizations:
            print("❌ No organizations found")
            return
            
        org = organizations[0]
        print(f"✅ Using organization: {org.get('name', 'Unknown')}")
        
        # Get fundraising campaigns
        print("💰 Getting fundraising campaigns...")
        async with session.get(f"{BASE_URL}/api/fundraising", headers=headers) as resp:
            if resp.status != 200:
                print(f"❌ Failed to get fundraising: {resp.status}")
                return
            fundraising_campaigns = await resp.json()
            
        if not fundraising_campaigns:
            print("❌ No fundraising campaigns found")
            return
            
        fundraising = fundraising_campaigns[0]
        print(f"✅ Using fundraising: {fundraising.get('organisation', 'Unknown')}")
        print(f"   Fundraising data keys: {list(fundraising.keys())}")
        
        # Create a test meeting with notes
        print("📝 Creating meeting with notes...")
        meeting_data = {
            "title": "Knowledge Base Integration Test Meeting",
            "meeting_type": "Initial Meeting",
            "fundraising_id": str(fundraising['id']),
            "scheduled_date": datetime.utcnow().isoformat(),
            "agenda": "Test meeting agenda for knowledge base integration",
            "location": "Virtual",
            "is_virtual": True,
            "attendees": [
                {"name": "Test User 1", "organisation": "TNIFMC"},
                {"name": "Test User 2", "organisation": "Client"}
            ],
            "niveshya_representatives": ["Admin User"]
        }
        
        async with session.post(f"{BASE_URL}/api/meetings", json=meeting_data, headers=headers) as resp:
            if resp.status != 200:
                print(f"❌ Failed to create meeting: {resp.status}")
                print(await resp.text())
                return
            
            meeting_result = await resp.json()
            meeting_id = meeting_result.get('meeting_id')
            
        print(f"✅ Meeting created with ID: {meeting_id}")
        
        # Update meeting with additional notes and AI-like content
        print("🔄 Updating meeting with additional content...")
        update_data = {
            "notes": "Updated meeting notes with additional insights and action items. This should trigger knowledge base sync.",
            "ai_summary": "Test AI-generated summary of the meeting discussion",
            "ai_key_points": [
                "Key point 1: Important decision made",
                "Key point 2: Follow-up actions identified", 
                "Key point 3: Next steps outlined"
            ],
            "ai_action_items": [
                "Action 1: Prepare proposal document",
                "Action 2: Schedule follow-up meeting",
                "Action 3: Send meeting summary to stakeholders"
            ]
        }
        
        async with session.put(f"{BASE_URL}/api/meetings/{meeting_id}", json=update_data, headers=headers) as resp:
            if resp.status != 200:
                print(f"❌ Failed to update meeting: {resp.status}")
                print(await resp.text())
                return
                
        print("✅ Meeting updated with notes and AI content")
        
        # Wait a moment for async knowledge base processing
        await asyncio.sleep(2)
        
        # Check if knowledge base documents were created
        print("📚 Checking knowledge base documents...")
        
        # Find organization by name from fundraising
        org_name = fundraising.get('organisation')
        org_id = None
        
        if org_name:
            # Get organization by name
            async with session.get(f"{BASE_URL}/api/organizations", headers=headers) as resp:
                if resp.status == 200:
                    orgs = await resp.json()
                    matching_orgs = [o for o in orgs if o.get('name') == org_name]
                    if matching_orgs:
                        org_id = matching_orgs[0].get('_id') or matching_orgs[0].get('id')
                        print(f"   Found organization '{org_name}' with ID: {org_id}")
                        print(f"   Organization keys: {list(matching_orgs[0].keys())}")
        
        # Check all documents to see if any were created
        async with session.get(f"{BASE_URL}/api/documents/", headers=headers) as resp:
            if resp.status == 200:
                all_docs = await resp.json()
                print(f"✅ Found {len(all_docs)} total documents in system")
                
                # Look for meeting documents created recently
                recent_meeting_docs = [
                    doc for doc in all_docs 
                    if doc.get('document_type') == 'meeting_minutes' and 
                    meeting_id in str(doc.get('meeting_id', ''))
                ]
                
                if recent_meeting_docs:
                    print(f"🎯 Found meeting knowledge document!")
                    doc = recent_meeting_docs[0]
                    print(f"   Title: {doc.get('title')}")
                    print(f"   Type: {doc.get('document_type')}")
                    print(f"   Meeting ID: {doc.get('meeting_id')}")
                    print(f"   Organization ID: {doc.get('organization_id')}")
                    print(f"   Content length: {len(doc.get('content', ''))}")
                    
                    # Check if our notes and AI content are in the document
                    content = doc.get('content', '')
                    if "Updated meeting notes" in content:
                        print("✅ Manual notes found in knowledge base")
                    if "Test AI-generated summary" in content:
                        print("✅ AI summary found in knowledge base")
                    if "Key point 1" in content:
                        print("✅ AI key points found in knowledge base")
                    if "Action 1" in content:
                        print("✅ AI action items found in knowledge base")
                        
                else:
                    print("⚠️ Meeting document not found in knowledge base")
                    print("   Checking what meeting documents exist...")
                    meeting_docs = [doc for doc in all_docs if doc.get('document_type') == 'meeting_minutes']
                    print(f"   Found {len(meeting_docs)} meeting documents total")
            else:
                error_text = await resp.text()
                print(f"❌ Failed to get documents: {resp.status}")
                print(f"   Error: {error_text}")
        
        # Clean up - delete the test meeting
        print("🧹 Cleaning up test meeting...")
        async with session.delete(f"{BASE_URL}/api/meetings/{meeting_id}", headers=headers) as resp:
            if resp.status == 200:
                print("✅ Test meeting deleted")
            else:
                print(f"⚠️ Failed to delete test meeting: {resp.status}")
        
        print("\n🎉 Knowledge base integration test completed!")

if __name__ == "__main__":
    asyncio.run(test_meeting_knowledge_api())