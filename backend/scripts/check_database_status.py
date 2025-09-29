#!/usr/bin/env python3
"""
Check Database Status - See what's currently in MongoDB
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import our modules
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User
from app.models.contact import Contact
from app.models.fundraising import Fundraising

async def check_database_status():
    """Check current state of all collections"""
    
    try:
        # Initialize database connection
        await init_db()
        print("✅ Connected to database")
        
        # Check Users collection
        users = await User.find_all().to_list()
        print(f"\n👥 USERS COLLECTION: {len(users)} users")
        for i, user in enumerate(users[:10]):  # Show first 10
            print(f"   {i+1}. {user.name} ({user.email}) - {user.roles}")
        if len(users) > 10:
            print(f"   ... and {len(users) - 10} more users")
            
        # Check for Krishna specifically
        krishna = await User.find_one({"email": "krishna.chaitanya@tnifmc.com"})
        if krishna:
            print(f"\n🎯 Krishna Chaitanya found: {krishna.name} - Roles: {krishna.roles}")
        
        # Check Contacts collection
        contacts = await Contact.find_all().to_list()
        print(f"\n📞 CONTACTS COLLECTION: {len(contacts)} contacts")
        for i, contact in enumerate(contacts[:5]):  # Show first 5
            print(f"   {i+1}. {contact.name} ({contact.email}) - {contact.organisation}")
        if len(contacts) > 5:
            print(f"   ... and {len(contacts) - 5} more contacts")
        
        # Check Fundraising collection
        fundraising = await Fundraising.find_all().to_list()
        print(f"\n💰 FUNDRAISING COLLECTION: {len(fundraising)} records")
        for i, fr in enumerate(fundraising[:5]):  # Show first 5
            print(f"   {i+1}. {fr.fund_name} - {fr.status}")
        if len(fundraising) > 5:
            print(f"   ... and {len(fundraising) - 5} more fundraising records")
            
        # Check for potential duplicates
        print(f"\n🔍 DUPLICATE ANALYSIS:")
        
        # Check user email duplicates
        user_emails = [u.email for u in users]
        duplicate_emails = [email for email in set(user_emails) if user_emails.count(email) > 1]
        if duplicate_emails:
            print(f"   ❌ Duplicate user emails found: {duplicate_emails}")
        else:
            print(f"   ✅ No duplicate user emails")
            
        # Check contact email duplicates
        contact_emails = [c.email for c in contacts if c.email]
        duplicate_contact_emails = [email for email in set(contact_emails) if contact_emails.count(email) > 1]
        if duplicate_contact_emails:
            print(f"   ❌ Duplicate contact emails found: {duplicate_contact_emails}")
        else:
            print(f"   ✅ No duplicate contact emails")
        
        print(f"\n📊 SUMMARY:")
        print(f"   Users: {len(users)}")
        print(f"   Contacts: {len(contacts)}")  
        print(f"   Fundraising: {len(fundraising)}")
        print(f"   Total records: {len(users) + len(contacts) + len(fundraising)}")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(check_database_status())