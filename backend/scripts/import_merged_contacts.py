#!/usr/bin/env python3
"""
Merged Contact Import Script
Imports and merges contacts from both rearrangedContacts.json and people.json
Handles duplicates by matching on (name, organisation) and merging data
"""

import json
import asyncio
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.contact import Contact


class MergedContactImporter:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self.stats = {
            'rearranged_loaded': 0,
            'people_loaded': 0,
            'duplicates_merged': 0,
            'total_imported': 0,
            'errors': 0,
            'skipped': 0
        }
        self.contact_map: Dict[tuple, Dict[str, Any]] = {}  # (name, org) -> merged data

    def clean_string(self, value: Any) -> Optional[str]:
        """Clean and validate string values"""
        if value is None or value == "" or str(value).strip() in ['null', 'None', '']:
            return None
        return str(value).strip()

    def clean_phone(self, phone: Any) -> Optional[str]:
        """Clean phone number format"""
        if phone is None:
            return None
        phone_str = str(phone).strip()
        if phone_str in ['', 'null', 'None', '0']:
            return None
        return phone_str

    def clean_email(self, email: Any) -> Optional[str]:
        """Clean and validate email"""
        if email is None:
            return None
        email_str = str(email).strip().lower()
        if '@' not in email_str or email_str in ['', 'null', 'none']:
            return None
        return email_str

    def normalize_name(self, name: str) -> str:
        """Normalize name for matching - remove extra spaces"""
        return ' '.join(name.split()).strip().lower()

    def normalize_org(self, org: str) -> str:
        """Normalize organization name for matching"""
        return org.strip().lower()

    def merge_contact_data(self, existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
        """Merge two contact records, preferring non-null values"""
        merged = existing.copy()
        
        # For each field, use new value if it exists and old value is None
        for key, new_value in new.items():
            if key in ['name', 'organisation']:  # Always use from existing for consistency
                continue
            
            if new_value is not None and (merged.get(key) is None or merged.get(key) == ''):
                merged[key] = new_value
            elif new_value is not None and merged.get(key) is not None:
                # Both have values - check if they're different
                if str(new_value) != str(merged.get(key)):
                    # Store both in notes if different
                    if 'merged_notes' not in merged:
                        merged['merged_notes'] = []
                    merged['merged_notes'].append(f"{key}: {new_value} (alternative)")
        
        return merged

    def load_rearranged_contacts(self) -> None:
        """Load contacts from rearrangedContacts.json"""
        print("\n📄 Loading rearrangedContacts.json...")
        
        file_path = self.data_dir / 'rearrangedContacts.json'
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"   Found {len(data)} records")
            
            for record in data:
                name = self.clean_string(record.get('Name'))
                org = self.clean_string(record.get('Organisation'))
                
                if not name or not org:
                    self.stats['skipped'] += 1
                    continue
                
                # Create normalized key
                key = (self.normalize_name(name), self.normalize_org(org))
                
                contact_data = {
                    'name': name,
                    'organisation': org,
                    'designation': self.clean_string(record.get('Designation')),
                    'branch_department': self.clean_string(record.get('Branch__Deprtment')),
                    'email': self.clean_email(record.get('Email')),
                    'address': self.clean_string(record.get('Address')),
                    'phone': self.clean_phone(record.get('Phone')),
                    'mobile': self.clean_phone(record.get('Mobile')),
                    'geography_region': self.clean_string(record.get('Geography__Region')),
                    'country_location': self.clean_string(record.get('Country__Location')),
                    'sub_location': self.clean_string(record.get('Sub_Location')),
                    'notes_comments': self.clean_string(record.get('Notes__Comments')),
                    'status': 'Active',
                    'source': 'rearrangedContacts'
                }
                
                self.contact_map[key] = contact_data
                self.stats['rearranged_loaded'] += 1
            
            print(f"   ✅ Loaded {self.stats['rearranged_loaded']} contacts")
        
        except Exception as e:
            print(f"   ❌ Error loading file: {e}")
            self.stats['errors'] += 1

    def load_people_contacts(self) -> None:
        """Load contacts from people.json and merge with existing"""
        print("\n📄 Loading people.json...")
        
        file_path = self.data_dir / 'people.json'
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            print(f"   Found {len(data)} records")
            
            for record in data:
                name = self.clean_string(record.get('Name'))
                org = self.clean_string(record.get('Organisation'))
                
                if not name or not org:
                    self.stats['skipped'] += 1
                    continue
                
                # Create normalized key
                key = (self.normalize_name(name), self.normalize_org(org))
                
                contact_data = {
                    'name': name,
                    'organisation': org,
                    'designation': self.clean_string(record.get('Designation')),
                    'email': self.clean_email(record.get('Email')),
                    'phone': self.clean_phone(record.get('Phone')),
                    'linkedin_url': self.clean_string(record.get('Linkedin Connect')),
                    'contact_type': self.clean_string(record.get('Type')),
                    'meeting_status': self.clean_string(record.get('Met / Connected')),
                    'status': 'Active',
                    'source': 'people'
                }
                
                # Check if contact already exists (from rearrangedContacts)
                if key in self.contact_map:
                    # Merge data
                    self.contact_map[key] = self.merge_contact_data(
                        self.contact_map[key], 
                        contact_data
                    )
                    self.stats['duplicates_merged'] += 1
                else:
                    # New contact
                    self.contact_map[key] = contact_data
                
                self.stats['people_loaded'] += 1
            
            print(f"   ✅ Loaded {self.stats['people_loaded']} contacts")
            print(f"   🔄 Merged {self.stats['duplicates_merged']} duplicates")
        
        except Exception as e:
            print(f"   ❌ Error loading file: {e}")
            self.stats['errors'] += 1

    async def import_to_mongodb(self) -> None:
        """Import merged contacts into MongoDB"""
        print(f"\n💾 Importing {len(self.contact_map)} unique contacts to MongoDB...")
        
        # Clear existing contacts
        print("   🗑️  Clearing existing contacts...")
        await Contact.delete_all()
        
        imported = 0
        for key, contact_data in self.contact_map.items():
            try:
                # Build notes if there are merged notes
                merged_notes = contact_data.pop('merged_notes', [])
                notes_parts = []
                
                if contact_data.get('notes_comments'):
                    notes_parts.append(contact_data['notes_comments'])
                
                if merged_notes:
                    notes_parts.append("Merged data: " + "; ".join(merged_notes))
                
                final_notes = " | ".join(notes_parts) if notes_parts else None
                
                # Add extra fields to notes_comments if they exist
                extra_notes = []
                if contact_data.get('linkedin_url'):
                    extra_notes.append(f"LinkedIn: {contact_data['linkedin_url']}")
                if contact_data.get('contact_type'):
                    extra_notes.append(f"Type: {contact_data['contact_type']}")
                if contact_data.get('meeting_status'):
                    extra_notes.append(f"Meeting: {contact_data['meeting_status']}")
                if contact_data.get('source'):
                    extra_notes.append(f"Source: {contact_data['source']}")
                
                if extra_notes:
                    if final_notes:
                        final_notes += " | " + " | ".join(extra_notes)
                    else:
                        final_notes = " | ".join(extra_notes)
                
                # Remove extra fields that aren't in Contact model
                for key in ['linkedin_url', 'contact_type', 'meeting_status', 'source']:
                    contact_data.pop(key, None)
                
                # Update notes_comments in contact_data
                contact_data['notes_comments'] = final_notes
                
                # Create contact
                contact = Contact(
                    **contact_data,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                await contact.insert()
                imported += 1
                
                if imported % 50 == 0:
                    print(f"   📥 Imported {imported} contacts...")
            
            except Exception as e:
                print(f"   ❌ Error importing {contact_data.get('name', 'Unknown')}: {e}")
                self.stats['errors'] += 1
        
        self.stats['total_imported'] = imported
        print(f"   ✅ Successfully imported {imported} contacts")

    async def run(self) -> None:
        """Run the complete import process"""
        print("="*60)
        print("🚀 MERGED CONTACT IMPORT TOOL")
        print("="*60)
        
        # Initialize database
        print("\n🔌 Connecting to MongoDB...")
        await init_db()
        print("   ✅ Connected")
        
        # Load data from both files
        self.load_rearranged_contacts()
        self.load_people_contacts()
        
        # Import to MongoDB
        await self.import_to_mongodb()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 IMPORT SUMMARY")
        print("="*60)
        print(f"   Loaded from rearrangedContacts.json: {self.stats['rearranged_loaded']}")
        print(f"   Loaded from people.json:            {self.stats['people_loaded']}")
        print(f"   Duplicates merged:                  {self.stats['duplicates_merged']}")
        print(f"   Unique contacts:                    {len(self.contact_map)}")
        print(f"   Successfully imported:              {self.stats['total_imported']}")
        print(f"   Skipped (missing data):             {self.stats['skipped']}")
        print(f"   Errors:                             {self.stats['errors']}")
        print("="*60)
        
        # Close connection
        await close_mongo_connection()
        print("\n✅ Import completed successfully!")


async def main():
    """Main entry point"""
    try:
        importer = MergedContactImporter()
        await importer.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Import cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
