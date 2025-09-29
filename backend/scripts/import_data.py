#!/usr/bin/env python3
"""
Data Import Script for TNIFMC Lead Management System
Imports JSON data into MongoDB collections
"""

import json
import asyncio
import sys
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any, Optional

# Add parent directory to Python path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.contact import Contact
from app.models.fundraising import Fundraising, FundraisingStatus, InvestorType
from app.models.user import User, UserRole


class DataImporter:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self.imported_counts = {
            'contacts': 0,
            'fundraising': 0,
            'users': 0,
            'skipped': 0,
            'errors': 0
        }

    def load_json_file(self, filename: str) -> List[Dict[str, Any]]:
        """Load and parse JSON file"""
        file_path = self.data_dir / filename
        if not file_path.exists():
            print(f"⚠️  File not found: {file_path}")
            return []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print(f"📄 Loaded {len(data)} records from {filename}")
            return data
        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")
            return []

    def clean_string(self, value: Any) -> Optional[str]:
        """Clean and validate string values"""
        if value is None or value == "":
            return None
        return str(value).strip() if str(value).strip() else None

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

    def convert_timestamp(self, timestamp: Any) -> Optional[datetime]:
        """Convert timestamp to datetime"""
        if timestamp is None:
            return None
        try:
            if isinstance(timestamp, (int, float)):
                # Convert milliseconds to seconds if needed
                if timestamp > 1e10:  # Likely milliseconds
                    timestamp = timestamp / 1000
                return datetime.fromtimestamp(timestamp, tz=timezone.utc)
            return None
        except Exception:
            return None

    async def import_contacts(self) -> None:
        """Import contacts from rearrangedContacts.json"""
        print("\n🔄 Importing contacts...")
        
        contacts_data = self.load_json_file('rearrangedContacts.json')
        if not contacts_data:
            return

        for contact_data in contacts_data:
            try:
                # Clean and map the data
                organisation = self.clean_string(contact_data.get('Organisation'))
                name = self.clean_string(contact_data.get('Name'))
                
                if not organisation or not name:
                    self.imported_counts['skipped'] += 1
                    continue

                # Map the contact data to our model
                contact = Contact(
                    organisation=organisation,
                    name=name,
                    designation=self.clean_string(contact_data.get('Designation', '')),
                    email=self.clean_email(contact_data.get('Email')),
                    phone=self.clean_phone(contact_data.get('Phone')),
                    mobile=self.clean_phone(contact_data.get('Mobile')),
                    address=self.clean_string(contact_data.get('Address')),
                    geography_region=self.clean_string(contact_data.get('Geography__Region', 'Unknown')),
                    category=self.clean_string(contact_data.get('Category', 'External')),
                    status='Active',
                    notes=self.clean_string(contact_data.get('Notes')),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await contact.insert()
                self.imported_counts['contacts'] += 1
                
                if self.imported_counts['contacts'] % 10 == 0:
                    print(f"   📥 Imported {self.imported_counts['contacts']} contacts...")

            except Exception as e:
                print(f"   ❌ Error importing contact {contact_data.get('Name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

    async def import_fundraising(self) -> None:
        """Import fundraising data from summary_FR.json"""
        print("\n🔄 Importing fundraising data...")
        
        fundraising_data = self.load_json_file('summary_FR.json')
        if not fundraising_data:
            return

        for fund_data in fundraising_data:
            try:
                organisation = self.clean_string(fund_data.get('Organisation'))
                if not organisation:
                    self.imported_counts['skipped'] += 1
                    continue

                # Map status
                status_str = self.clean_string(fund_data.get('Status_Open__Closed', 'Open'))
                try:
                    status = FundraisingStatus(status_str)
                except ValueError:
                    status = FundraisingStatus.OPEN

                # Map investor type
                investor_type_str = self.clean_string(fund_data.get('Investor_Type'))
                investor_type = None
                if investor_type_str:
                    try:
                        investor_type = InvestorType(investor_type_str)
                    except ValueError:
                        investor_type = InvestorType.OTHERS

                # Create fundraising record
                fundraising = Fundraising(
                    status_open_closed=status,
                    date_of_first_meeting_call=self.convert_timestamp(fund_data.get('Date_of_first_meeting__call')),
                    organisation=organisation,
                    reference=self.clean_string(fund_data.get('Reference', '')),
                    tnifmc_request_inr_cr=fund_data.get('TNIFMC_Request_INR_Cr'),
                    investor_type=investor_type,
                    responsibility_tnifmc=self.clean_string(fund_data.get('Responsibility_TNIFMC', '')),
                    
                    # Process tracking booleans
                    feeler_teaser_letter_sent=bool(fund_data.get('FeelerTeaserLetter_Sent', False)),
                    meetings_detailed_discussions_im_sent=bool(fund_data.get('Meetings__Detailed_DiscussionsIM_Sent', False)),
                    initial_appraisal_evaluation_process_started=bool(fund_data.get('Initial_Appraisal__Evaluation_process_started', False)),
                    due_diligence_queries=bool(fund_data.get('Due_Diligence__Queries', False)),
                    commitment_letter_conclusion=bool(fund_data.get('Commitment_Letter__Conclusion', False)),
                    initial_final_drawdown=bool(fund_data.get('Initial__Final_Drawdown', False)),
                    
                    commitment_amount_inr_cr=fund_data.get('Commitment_Amount_INR_Cr'),
                    current_status=self.clean_string(fund_data.get('Current_Status')),
                    notes=self.clean_string(fund_data.get('Notes')),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await fundraising.insert()
                self.imported_counts['fundraising'] += 1
                
                if self.imported_counts['fundraising'] % 10 == 0:
                    print(f"   📥 Imported {self.imported_counts['fundraising']} fundraising records...")

            except Exception as e:
                print(f"   ❌ Error importing fundraising for {fund_data.get('Organisation', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

    async def import_users(self) -> None:
        """Import users from users.json"""
        print("\n🔄 Importing users...")
        
        users_data = self.load_json_file('users.json')
        if not users_data:
            return

        for user_data in users_data:
            try:
                name = self.clean_string(user_data.get('name'))
                email = self.clean_email(user_data.get('email'))
                
                if not name:
                    self.imported_counts['skipped'] += 1
                    continue

                # Generate email if missing
                if not email and name:
                    # Create email from name
                    email_name = name.lower().replace(' ', '.').replace(',', '')
                    email = f"{email_name}@tnifmc.com"

                # Map employment type to our enum
                employment_type_str = user_data.get('employment_type', 'Employee')
                from app.models.user import EmploymentType
                if employment_type_str in ['Independent Board Member', 'Board Member', 'IC Member', 'Former CEO', 'Nominee Director']:
                    employment_type = EmploymentType.CONSULTANT
                else:
                    try:
                        employment_type = EmploymentType(employment_type_str)
                    except ValueError:
                        employment_type = EmploymentType.EMPLOYEE

                user = User(
                    name=name,
                    email=email or f"user_{self.imported_counts['users']}@tnifmc.com",
                    phone=self.clean_phone(user_data.get('phone')),
                    organisation=self.clean_string(user_data.get('organisation', 'TNIFMC')),
                    designation=self.clean_string(user_data.get('designation', '')),
                    employment_type=employment_type,
                    roles=[UserRole.USER],
                    is_active=True,
                    password_hash="$2b$12$dummy.hash.for.imported.users",  # Placeholder - users need to reset
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await user.insert()
                self.imported_counts['users'] += 1
                
                if self.imported_counts['users'] % 5 == 0:
                    print(f"   📥 Imported {self.imported_counts['users']} users...")

            except Exception as e:
                print(f"   ❌ Error importing user {user_data.get('name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

    async def clear_collections(self) -> None:
        """Clear existing collections (optional)"""
        print("\n🗑️  Clearing existing collections...")
        try:
            await Contact.delete_all()
            await Fundraising.delete_all() 
            await User.delete_all()
            print("   ✅ Collections cleared")
        except Exception as e:
            print(f"   ⚠️  Error clearing collections: {e}")

    def print_summary(self) -> None:
        """Print import summary"""
        print("\n" + "="*50)
        print("📊 IMPORT SUMMARY")
        print("="*50)
        print(f"✅ Contacts imported:    {self.imported_counts['contacts']}")
        print(f"✅ Fundraising imported: {self.imported_counts['fundraising']}")
        print(f"✅ Users imported:       {self.imported_counts['users']}")
        print(f"⏭️  Records skipped:     {self.imported_counts['skipped']}")
        print(f"❌ Errors encountered:  {self.imported_counts['errors']}")
        print("="*50)
        
        total_imported = self.imported_counts['contacts'] + self.imported_counts['fundraising'] + self.imported_counts['users']
        if total_imported > 0:
            print(f"🎉 Successfully imported {total_imported} total records!")
            print("\n💡 Next steps:")
            print("   1. Start your backend server: python main_simple.py")
            print("   2. Refresh your frontend to see the data")
            print("   3. Users will need to reset passwords for login")
        else:
            print("⚠️  No data was imported. Please check the data files.")

    async def run_import(self, clear_first: bool = False) -> None:
        """Run the complete import process"""
        print("🚀 Starting TNIFMC Lead Management System Data Import")
        print("="*60)
        
        try:
            # Initialize database
            await init_db()
            print("✅ Database connection established")
            
            # Clear collections if requested
            if clear_first:
                await self.clear_collections()
            
            # Import data
            await self.import_contacts()
            await self.import_fundraising() 
            await self.import_users()
            
            # Print summary
            self.print_summary()
            
        except Exception as e:
            print(f"💥 Fatal error during import: {e}")
        finally:
            await close_mongo_connection()
            print("\n🔌 Database connection closed")


async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Import JSON data into TNIFMC Lead Management System')
    parser.add_argument('--clear', action='store_true', help='Clear existing collections before import')
    args = parser.parse_args()
    
    importer = DataImporter()
    await importer.run_import(clear_first=args.clear)


if __name__ == "__main__":
    asyncio.run(main())