#!/usr/bin/env python3
"""
Safe Data Import - Only imports users from users.json that don't already exist
Specifically to restore the original TNIFMC users without creating duplicates
"""

import json
import asyncio
import sys
import os
from datetime import datetime
from pathlib import Path

# Add parent directory to Python path for imports
sys.path.append(str(Path(__file__).parent.parent))

from app.models.database import init_db, close_mongo_connection
from app.models.user import User, UserRole, EmploymentType

class SafeUserImporter:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self.imported_counts = {
            'users_added': 0,
            'users_skipped': 0,
            'users_existing': 0,
            'errors': 0
        }

    def load_json_file(self, filename: str):
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

    def clean_string(self, value) -> str:
        """Clean and normalize string values"""
        if not value:
            return ""
        return str(value).strip()

    def clean_email(self, email) -> str:
        """Clean and validate email"""
        if not email:
            return ""
        email = str(email).strip().lower()
        if "@" not in email or "." not in email:
            return ""
        return email

    def clean_phone(self, phone):
        """Clean phone number"""
        if not phone:
            return ""
        return str(phone).strip()

    async def import_users_safely(self):
        """Import users from users.json, checking for existing records"""
        print("\n🔄 Safely importing users (no duplicates)...")
        
        users_data = self.load_json_file('users.json')
        if not users_data:
            return

        # Get existing users to avoid duplicates
        existing_users = await User.find_all().to_list()
        existing_emails = {user.email.lower() for user in existing_users}
        
        print(f"🔍 Found {len(existing_users)} existing users in database")

        for user_data in users_data:
            try:
                name = self.clean_string(user_data.get('name'))
                email = self.clean_email(user_data.get('email'))
                
                if not name:
                    self.imported_counts['users_skipped'] += 1
                    continue

                # Generate email if missing
                if not email and name:
                    # Create email from name
                    email_name = name.lower().replace(' ', '.').replace(',', '')
                    email = f"{email_name}@tnifmc.com"

                # Check if user already exists
                if email.lower() in existing_emails:
                    print(f"   ⏭️  User exists: {name} ({email})")
                    self.imported_counts['users_existing'] += 1
                    continue

                # Map employment type to our enum
                employment_type_str = user_data.get('employment_type', 'Employee')
                if employment_type_str in ['Independent Board Member', 'Board Member', 'IC Member', 'Former CEO', 'Nominee Director']:
                    employment_type = EmploymentType.CONSULTANT
                else:
                    try:
                        employment_type = EmploymentType(employment_type_str)
                    except ValueError:
                        employment_type = EmploymentType.EMPLOYEE

                # Set special roles for specific users
                roles = [UserRole.USER]
                if email == "krishna.chaitanya@tnifmc.com":
                    roles = [UserRole.ADMIN, UserRole.MANAGER]
                elif "head" in user_data.get('designation', '').lower() or "ceo" in user_data.get('designation', '').lower():
                    roles = [UserRole.MANAGER]

                user = User(
                    name=name,
                    email=email or f"user_{self.imported_counts['users_added']}@tnifmc.com",
                    phone=self.clean_phone(user_data.get('phone')),
                    organisation=self.clean_string(user_data.get('organisation', 'TNIFMC')),
                    designation=self.clean_string(user_data.get('designation', '')),
                    employment_type=employment_type,
                    roles=roles,
                    is_active=True,
                    password_hash="$2b$12$dummy.hash.for.imported.users",  # Placeholder - users need to reset
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await user.insert()
                print(f"   ✅ Added: {name} ({email}) - {employment_type.value}")
                self.imported_counts['users_added'] += 1
                
            except Exception as e:
                print(f"   ❌ Error importing user {user_data.get('name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

        print(f"\n📊 Import Summary:")
        print(f"   ✅ Users added: {self.imported_counts['users_added']}")
        print(f"   ⏭️  Users already existed: {self.imported_counts['users_existing']}")
        print(f"   ⚠️  Users skipped (no name): {self.imported_counts['users_skipped']}")
        print(f"   ❌ Errors: {self.imported_counts['errors']}")

async def main():
    """Main import function"""
    try:
        await init_db()
        print("✅ Connected to MongoDB")
        
        importer = SafeUserImporter()
        await importer.import_users_safely()
        
        print(f"\n🎉 Safe import completed!")
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(main())