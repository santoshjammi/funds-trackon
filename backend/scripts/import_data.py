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
from app.models.user import User, UserRoleAssignment, EmploymentType
from app.models.opportunity import Opportunity, OpportunityStatus, Priority
from app.models.task import Task, TaskStatus, TaskType, TaskPriority
from app.models.tracker import Tracker, TrackerType
from app.models.organization import Organization, IndustryType, OrganizationStatus


class DataImporter:
    def __init__(self):
        self.data_dir = Path(__file__).parent.parent.parent / "data"
        self.imported_counts = {
            'contacts': 0,
            'fundraising': 0,
            'users': 0,
            'opportunities': 0,
            'tasks': 0,
            'trackers': 0,
            'organizations': 0,
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

    def _merge_notes(self, existing_notes: str = None, new_notes: str = None, existing_source: str = None) -> str:
        """Merge notes from both sources, preserving all information"""
        notes_parts = []
        
        if existing_notes and existing_notes.strip():
            notes_parts.append(f"{existing_notes.strip()} (Source: {existing_source})")
        
        if new_notes and new_notes.strip():
            notes_parts.append(f"{new_notes.strip()} (Source: rearrangedContacts.json)")
        
        return "; ".join(notes_parts) if notes_parts else None

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
        
        # Fix double dots in email
        while '..' in email_str:
            email_str = email_str.replace('..', '.')
        
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

    async def import_merged_contacts(self) -> None:
        """Import and merge contacts from both people.json and rearrangedContacts.json"""
        print("\n🔄 Importing and merging contacts from people.json and rearrangedContacts.json...")
        
        # Load both data sources
        people_data = self.load_json_file('people.json')
        rearranged_data = self.load_json_file('rearrangedContacts.json')
        
        if not people_data and not rearranged_data:
            print("   ⚠️  No contact data found in either file")
            return
        
        # Merge and deduplicate contacts
        merged_contacts = {}
        
        # Process people.json data first
        for person in people_data:
            try:
                name = self.clean_string(person.get('Name'))
                organisation = self.clean_string(person.get('Organisation'))
                
                if not name:
                    continue
                
                # Create unique key for deduplication
                key = f"{name}_{organisation or 'Unknown'}"
                
                contact_data = {
                    'name': name,
                    'organisation': organisation,
                    'designation': self.clean_string(person.get('Designation')),
                    'email': self.clean_email(person.get('Email')),
                    'phone': self.clean_phone(person.get('Phone')),
                    'mobile': None,  # people.json doesn't have mobile
                    'address': None,  # people.json doesn't have address
                    'geography_region': 'Unknown',
                    'category': self.clean_string(person.get('Type', 'External')),
                    'status': 'Active',
                    'notes': self.clean_string(person.get('Met / Connected')),
                    'source': 'people.json'
                }
                
                merged_contacts[key] = contact_data
                
            except Exception as e:
                print(f"   ❌ Error processing person {person.get('Name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1
        
        # Process rearrangedContacts.json data and merge with existing data
        for contact in rearranged_data:
            try:
                name = self.clean_string(contact.get('Name'))
                organisation = self.clean_string(contact.get('Organisation'))
                
                if not name:
                    continue
                
                # Create unique key for deduplication
                key = f"{name}_{organisation or 'Unknown'}"
                
                # Get existing data if contact already exists, otherwise create new
                existing_data = merged_contacts.get(key, {
                    'name': name,
                    'organisation': organisation,
                    'designation': None,
                    'email': None,
                    'phone': None,
                    'mobile': None,
                    'address': None,
                    'geography_region': 'Unknown',
                    'category': 'External',
                    'status': 'Active',
                    'notes': None,
                    'source': 'rearrangedContacts.json'
                })
                
                # Merge data - rearrangedContacts takes precedence for non-null values
                merged_data = {
                    'name': name,
                    'organisation': organisation,
                    'designation': self.clean_string(contact.get('Designation')) or existing_data['designation'],
                    'email': self.clean_email(contact.get('Email')) or existing_data['email'],
                    'phone': self.clean_phone(contact.get('Phone')) or existing_data['phone'],
                    'mobile': self.clean_phone(contact.get('Mobile')) or existing_data['mobile'],
                    'address': self.clean_string(contact.get('Address')) or existing_data['address'],
                    'geography_region': self.clean_string(contact.get('Geography__Region', 'Unknown')) if contact.get('Geography__Region') else existing_data['geography_region'],
                    'category': self.clean_string(contact.get('Category', 'External')) if contact.get('Category') else existing_data['category'],
                    'status': 'Active',
                    'notes': self._merge_notes(existing_data.get('notes'), self.clean_string(contact.get('Notes__Comments')), existing_data.get('source', 'people.json')),
                    'source': 'merged'
                }
                
                merged_contacts[key] = merged_data
                
            except Exception as e:
                print(f"   ❌ Error processing contact {contact.get('Name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1
        
        # Import merged contacts
        total_contacts = len(merged_contacts)
        print(f"   📊 Merged {total_contacts} unique contacts from both sources")
        
        imported_count = 0
        for key, contact_data in merged_contacts.items():
            try:
                contact = Contact(
                    organisation=contact_data['organisation'],
                    name=contact_data['name'],
                    designation=contact_data['designation'],
                    email=contact_data['email'],
                    phone=contact_data['phone'],
                    mobile=contact_data['mobile'],
                    address=contact_data['address'],
                    geography_region=contact_data['geography_region'],
                    category=contact_data['category'],
                    status=contact_data['status'],
                    notes=contact_data['notes'],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await contact.insert()
                imported_count += 1
                self.imported_counts['contacts'] += 1
                
                if imported_count % 50 == 0:
                    print(f"   📥 Imported {imported_count}/{total_contacts} merged contacts...")

            except Exception as e:
                print(f"   ❌ Error importing merged contact {contact_data['name']}: {e}")
                self.imported_counts['errors'] += 1
        
        print(f"   ✅ Successfully imported {imported_count} merged contacts")

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

                # Create role assignments
                role_assignments = [UserRoleAssignment(role_id="user", role_name="user", assigned_by="system")]
                
                user = User(
                    name=name,
                    email=email or f"user_{self.imported_counts['users']}@tnifmc.com",
                    phone=self.clean_phone(user_data.get('phone')),
                    organisation=self.clean_string(user_data.get('organisation', 'TNIFMC')),
                    designation=self.clean_string(user_data.get('designation', '')),
                    employment_type=employment_type,
                    role_assignments=role_assignments,
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

    async def import_opportunities(self) -> None:
        """Import opportunities from opportunity.json"""
        print("\n🔄 Importing opportunities...")

        opportunities_data = self.load_json_file('opportunity.json')
        if not opportunities_data:
            return

        for opp_data in opportunities_data:
            try:
                # Clean and map the data
                target = self.clean_string(opp_data.get('TARGET'))
                if not target:
                    self.imported_counts['skipped'] += 1
                    continue

                # Map priority
                priority_str = self.clean_string(opp_data.get('Priority')) or 'B'
                if priority_str == 'A':
                    priority = Priority.HIGH
                elif priority_str == 'B':
                    priority = Priority.MEDIUM
                else:
                    priority = Priority.LOW

                # Map status
                status_str = self.clean_string(opp_data.get('Status')) or '3 - In Process'
                if '3 - In Process' in status_str:
                    status = OpportunityStatus.IN_PROGRESS
                elif 'Closed Won' in status_str.lower():
                    status = OpportunityStatus.CLOSED_WON
                elif 'Closed Lost' in status_str.lower():
                    status = OpportunityStatus.CLOSED_LOST
                else:
                    status = OpportunityStatus.OPEN

                # Extract estimated value if present in notes
                estimated_value = None
                notes = self.clean_string(opp_data.get('NOTES /STATUS'))
                if notes:
                    # Try to extract value from notes (look for crore amounts)
                    import re
                    value_match = re.search(r'(\d+(?:\.\d+)?)\s*crore', notes, re.IGNORECASE)
                    if value_match:
                        estimated_value = float(value_match.group(1))

                opportunity = Opportunity(
                    title=target,
                    description=notes,
                    organisation=self.clean_string(opp_data.get('TARGET')),  # Using target as organization
                    estimated_value=estimated_value,
                    probability=None,  # Not available in data
                    status=status,
                    priority=priority,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await opportunity.insert()
                self.imported_counts['opportunities'] += 1

                if self.imported_counts['opportunities'] % 50 == 0:
                    print(f"   📥 Imported {self.imported_counts['opportunities']} opportunities...")

            except Exception as e:
                print(f"   ❌ Error importing opportunity {opp_data.get('TARGET', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

        print(f"   ✅ Successfully imported {self.imported_counts['opportunities']} opportunities")

    async def import_tasks(self) -> None:
        """Import tasks from tasks.json"""
        print("\n🔄 Importing tasks...")

        tasks_data = self.load_json_file('tasks.json')
        if not tasks_data:
            return

        for task_data in tasks_data:
            try:
                # Clean and map the data
                task_name = self.clean_string(task_data.get('Task Name / Person Name'))
                if not task_name:
                    self.imported_counts['skipped'] += 1
                    continue

                # Map task type
                type_str = self.clean_string(task_data.get('Type', 'Other'))
                if '1-NJ' in type_str or 'call' in type_str.lower():
                    task_type = TaskType.CALL
                elif '2 - Meeting' in type_str or 'meeting' in type_str.lower():
                    task_type = TaskType.MEETING
                elif 'email' in type_str.lower():
                    task_type = TaskType.EMAIL
                elif 'follow' in type_str.lower():
                    task_type = TaskType.FOLLOW_UP
                else:
                    task_type = TaskType.OTHER

                # Map status
                task_done = task_data.get('Task Done', 'No').lower().strip()
                if task_done == 'yes':
                    status = TaskStatus.COMPLETED
                else:
                    status = TaskStatus.TODO

                # Convert timestamps
                target_date = self.convert_timestamp(task_data.get('Target Date'))
                followup_date = self.convert_timestamp(task_data.get('Followup date'))

                task = Task(
                    title=task_name,
                    description=self.clean_string(task_data.get('Discussion Points')),
                    task_type=task_type,
                    status=status,
                    priority=TaskPriority.medium,  # Default priority
                    due_date=target_date,
                    completed_at=followup_date if status == TaskStatus.COMPLETED else None,
                    notes=self.clean_string(task_data.get('Followup/Notes')),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await task.insert()
                self.imported_counts['tasks'] += 1

                if self.imported_counts['tasks'] % 50 == 0:
                    print(f"   📥 Imported {self.imported_counts['tasks']} tasks...")

            except Exception as e:
                print(f"   ❌ Error importing task {task_data.get('Task Name / Person Name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

        print(f"   ✅ Successfully imported {self.imported_counts['tasks']} tasks")

    async def import_trackers(self) -> None:
        """Import trackers from tracker.json"""
        print("\n🔄 Importing trackers...")

        trackers_data = self.load_json_file('tracker.json')
        if not trackers_data:
            return

        for tracker_data in trackers_data:
            try:
                # Clean and map the data
                target = self.clean_string(tracker_data.get('TARGET'))
                if not target:
                    self.imported_counts['skipped'] += 1
                    continue

                # Extract category and map to TrackerType
                category = self.clean_string(tracker_data.get('CATEGORY', 'Other'))
                if 'PE' in category.upper() or 'Private Equity' in category:
                    tracker_type = TrackerType.FUNDRAISING
                elif 'Infra' in category.lower():
                    tracker_type = TrackerType.OPPORTUNITY
                else:
                    tracker_type = TrackerType.OTHER

                # Map priority to status
                priority = self.clean_string(tracker_data.get('PRIORITY', 'C'))
                if priority == 'A':
                    status = 'High Priority'
                elif priority == 'B':
                    status = 'Medium Priority'
                else:
                    status = 'Low Priority'

                # Create flexible data structure
                data = {
                    'category': category,
                    'priority': priority,
                    'contact_person': self.clean_string(tracker_data.get('CONTACT PERSON')),
                    'designation': self.clean_string(tracker_data.get('DESIGNATION')),
                    'contact_number': self.clean_string(tracker_data.get('CONTACT NO')),
                    'email': self.clean_email(tracker_data.get('E MAIL ID')),
                    'referral': self.clean_string(tracker_data.get('REFERRAL')),
                    'notes': self.clean_string(tracker_data.get('NOTES /STATUS'))
                }

                tracker = Tracker(
                    title=target,
                    category=category,
                    data=data,
                    source='tracker.json',
                    status=status,
                    notes=self.clean_string(tracker_data.get('NOTES /STATUS')),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await tracker.insert()
                self.imported_counts['trackers'] += 1

                if self.imported_counts['trackers'] % 50 == 0:
                    print(f"   📥 Imported {self.imported_counts['trackers']} trackers...")

            except Exception as e:
                print(f"   ❌ Error importing tracker {tracker_data.get('TARGET', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

        print(f"   ✅ Successfully imported {self.imported_counts['trackers']} trackers")

    async def import_organizations(self) -> None:
        """Extract and import organizations from contact data"""
        print("\n🔄 Importing organizations from contacts...")

        # Get all unique organizations from contacts
        contacts = await Contact.find_all().to_list()
        organizations = {}

        for contact in contacts:
            if contact.organisation and contact.organisation.strip():
                org_name = contact.organisation.strip()
                if org_name not in organizations:
                    # Try to infer industry from organization name or contact data
                    industry = self._infer_industry(org_name)
                    organizations[org_name] = {
                        'name': org_name,
                        'industry': industry,
                        'description': f"Organization extracted from contact data",
                        'status': OrganizationStatus.ACTIVE,
                        'source': 'contacts_extraction'
                    }

        # Import organizations
        for org_data in organizations.values():
            try:
                organization = Organization(
                    name=org_data['name'],
                    industry=org_data['industry'],
                    description=org_data['description'],
                    status=org_data['status'],
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await organization.insert()
                self.imported_counts['organizations'] += 1

            except Exception as e:
                print(f"   ❌ Error importing organization {org_data['name']}: {e}")
                self.imported_counts['errors'] += 1

        print(f"   ✅ Successfully imported {self.imported_counts['organizations']} organizations")

    async def import_users(self) -> None:
        """Import users from users.json"""
        print("\n🔄 Importing users...")

        try:
            with open('../data/users.json', 'r', encoding='utf-8') as f:
                users_data = json.load(f)
        except FileNotFoundError:
            print("   ⚠️  users.json not found, skipping user import")
            return
        except json.JSONDecodeError as e:
            print(f"   ❌ Error parsing users.json: {e}")
            return

        for user_data in users_data:
            try:
                # Clean and validate data
                name = self.clean_string(user_data.get('name'))
                if not name:
                    self.imported_counts['skipped'] += 1
                    continue

                email = self.clean_email(user_data.get('email'))
                
                # Map employment type
                employment_type_str = user_data.get('employment_type', 'Employee')
                if employment_type_str == 'Employee':
                    employment_type = EmploymentType.EMPLOYEE
                elif employment_type_str == 'Contractor':
                    employment_type = EmploymentType.CONTRACTOR
                elif employment_type_str == 'Consultant':
                    employment_type = EmploymentType.CONSULTANT
                else:
                    employment_type = EmploymentType.EMPLOYEE  # Default

                # Create user
                user = User(
                    organisation=self.clean_string(user_data.get('organisation', 'TNIFMC')),
                    employment_type=employment_type,
                    name=name,
                    designation=self.clean_string(user_data.get('designation')),
                    email=email,
                    phone=self.clean_phone(user_data.get('phone')),
                    notes=self.clean_string(user_data.get('notes')),
                    username=email if email else None,  # Use email as username if available
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )

                await user.insert()
                self.imported_counts['users'] += 1

                if self.imported_counts['users'] % 10 == 0:
                    print(f"   📥 Imported {self.imported_counts['users']} users...")

            except Exception as e:
                print(f"   ❌ Error importing user {user_data.get('name', 'Unknown')}: {e}")
                self.imported_counts['errors'] += 1

        print(f"   ✅ Successfully imported {self.imported_counts['users']} users")

    def _infer_industry(self, org_name: str) -> Optional[IndustryType]:
        """Infer industry type from organization name"""
        name_lower = org_name.lower()

        # Financial institutions
        if any(term in name_lower for term in ['bank', 'banking', 'finance', 'capital', 'investment']):
            return IndustryType.BANKING
        elif any(term in name_lower for term in ['insurance', 'assurance']):
            return IndustryType.INSURANCE
        elif any(term in name_lower for term in ['mutual fund', 'asset management', 'wealth']):
            return IndustryType.ASSET_MANAGEMENT
        elif any(term in name_lower for term in ['pension', 'retirement']):
            return IndustryType.PENSION_FUNDS
        elif any(term in name_lower for term in ['sovereign', 'government', 'ministry', 'govt']):
            return IndustryType.SOVEREIGN_WEALTH
        elif any(term in name_lower for term in ['consulting', 'advisory', 'consultants']):
            return IndustryType.CONSULTING
        elif any(term in name_lower for term in ['real estate', 'property', 'housing']):
            return IndustryType.REAL_ESTATE
        elif any(term in name_lower for term in ['infra', 'infrastructure', 'construction', 'energy']):
            return IndustryType.INFRASTRUCTURE
        elif any(term in name_lower for term in ['fintech', 'technology', 'tech']):
            return IndustryType.FINTECH

        return IndustryType.OTHER

    async def clear_collections(self) -> None:
        """Clear existing collections (optional)"""
        print("\n🗑️  Clearing existing collections...")
        try:
            await Contact.delete_all()
            await Organization.delete_all()
            await Opportunity.delete_all()
            await Task.delete_all()
            await Tracker.delete_all()
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
        print(f"✅ Contacts imported:       {self.imported_counts['contacts']}")
        print(f"✅ Organizations imported:  {self.imported_counts['organizations']}")
        print(f"✅ Opportunities imported:  {self.imported_counts['opportunities']}")
        print(f"✅ Tasks imported:          {self.imported_counts['tasks']}")
        print(f"✅ Trackers imported:       {self.imported_counts['trackers']}")
        print(f"✅ Fundraising imported:    {self.imported_counts['fundraising']}")
        print(f"✅ Users imported:          {self.imported_counts['users']}")
        print(f"⏭️  Records skipped:        {self.imported_counts['skipped']}")
        print(f"❌ Errors encountered:     {self.imported_counts['errors']}")
        print("="*50)
        
        total_imported = sum(self.imported_counts[key] for key in ['contacts', 'organizations', 'opportunities', 'tasks', 'trackers', 'fundraising', 'users'])
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
            await self.import_merged_contacts()
            await self.import_organizations()
            await self.import_opportunities()
            await self.import_tasks()
            await self.import_trackers()
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