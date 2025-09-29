"""
Script to extract unique organizations from fundraising data
and create organization records from summary_FR.json
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from pathlib import Path
from collections import defaultdict
import asyncio
from beanie import init_beanie
import motor.motor_asyncio
from app.models.organization import Organization
from app.utils.config import get_settings

async def extract_and_import_organizations():
    """Extract organizations from fundraising data and import them"""
    
    # Load fundraising data
    data_path = Path(__file__).parent.parent.parent / "data" / "summary_FR.json"
    
    with open(data_path, 'r') as f:
        fundraising_data = json.load(f)
    
    # Group by organization to get unique organizations with their aggregate data
    org_data = defaultdict(lambda: {
        'name': '',
        'campaigns': [],
        'total_requested': 0,
        'total_committed': 0,
        'investor_types': set(),
        'references': set(),
        'statuses': set(),
        'responsibilities': set(),
        'first_meeting_dates': [],
        'notes': []
    })
    
    for campaign in fundraising_data:
        org_name = campaign.get('Organisation', 'Unknown')
        if not org_name or org_name.strip() == '':
            continue
            
        org_info = org_data[org_name]
        org_info['name'] = org_name
        org_info['campaigns'].append(campaign)
        
        # Aggregate financial data
        requested = campaign.get('TNIFMC_Request_INR_Cr', 0) or 0
        committed = campaign.get('Commitment_Amount_INR_Cr', 0) or 0
        org_info['total_requested'] += requested
        org_info['total_committed'] += committed
        
        # Collect unique values
        if campaign.get('Investor_Type'):
            org_info['investor_types'].add(campaign['Investor_Type'])
        if campaign.get('Reference'):
            org_info['references'].add(campaign['Reference'])
        if campaign.get('Status_Open__Closed'):
            org_info['statuses'].add(campaign['Status_Open__Closed'])
        if campaign.get('Responsibility_TNIFMC'):
            org_info['responsibilities'].add(campaign['Responsibility_TNIFMC'])
        if campaign.get('Date_of_first_meeting__call'):
            org_info['first_meeting_dates'].append(campaign['Date_of_first_meeting__call'])
        if campaign.get('Notes'):
            org_info['notes'].append(campaign['Notes'])
    
    print(f"Found {len(org_data)} unique organizations")
    
    # Get settings
    settings = get_settings()
    
    # Initialize database connection
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(database=client[settings.database_name], document_models=[Organization])
    
    # Clear existing organizations
    await Organization.delete_all()
    
    # Create organization records
    organizations_created = 0
    
    for org_name, org_info in org_data.items():
        if not org_name or org_name.strip() == '':
            continue
            
        # Determine organization type based on references and investor types
        refs = list(org_info['references'])
        inv_types = list(org_info['investor_types'])
        
        org_type = "Private Company"  # default
        if any("Bank" in ref for ref in refs):
            org_type = "Bank"
        elif any("Government" in ref for ref in refs):
            org_type = "Government Entity"
        elif any("PSU" in inv_type for inv_type in inv_types):
            org_type = "Public Sector"
        elif any("Insurance" in inv_type for inv_type in inv_types):
            org_type = "Insurance Company"
        elif any("Mutual" in inv_type for inv_type in inv_types):
            org_type = "Investment Fund"
        
        # Determine industry from organization name patterns
        industry = "Other"  # default to valid enum value
        org_lower = org_name.lower()
        if any(word in org_lower for word in ['bank', 'banking']):
            industry = "Banking"
        elif any(word in org_lower for word in ['insurance', 'life', 'general']):
            industry = "Insurance"
        elif any(word in org_lower for word in ['mutual', 'fund', 'asset']):
            industry = "Asset Management"
        elif any(word in org_lower for word in ['govt', 'government', 'state']):
            industry = "Government"
        elif any(word in org_lower for word in ['tech', 'technology', 'software']):
            industry = "FinTech"
        elif any(word in org_lower for word in ['infra', 'infrastructure']):
            industry = "Infrastructure"
        elif any(word in org_lower for word in ['pension']):
            industry = "Pension Funds"
        elif any(word in org_lower for word in ['real estate', 'realty']):
            industry = "Real Estate"
        
        # Determine relationship status
        statuses_list = list(org_info['statuses'])
        relationship_status = "prospect"  # default
        if "Invested" in statuses_list:
            relationship_status = "active"
        elif "Closed" in statuses_list:
            relationship_status = "inactive"
        
        # Create organization record
        organization = Organization(
            name=org_name,
            industry=industry,
            organization_type=org_type,
            description=f"Organization with {len(org_info['campaigns'])} fundraising campaigns. Total requested: ₹{org_info['total_requested']} Cr, Total committed: ₹{org_info['total_committed']} Cr.",
            
            # Contact information from responsibilities
            contact_person=list(org_info['responsibilities'])[0] if org_info['responsibilities'] else None,
            
            # Business information
            annual_revenue=org_info['total_committed'] if org_info['total_committed'] > 0 else None,
            investment_stage="Active" if relationship_status == "active" else "Prospect",
            previous_funding=org_info['total_committed'] if org_info['total_committed'] > 0 else None,
            
            # Relationship information
            relationship_status=relationship_status,
            last_contact_date=max(org_info['first_meeting_dates']) if org_info['first_meeting_dates'] else None,
            next_action=f"Follow up on {len([s for s in statuses_list if s == 'Open'])} open campaigns" if any(s == 'Open' for s in statuses_list) else "Monitor invested campaigns",
            
            # Notes
            notes=f"References: {', '.join(refs)}. Investor types: {', '.join(inv_types)}. " + ('; '.join([n for n in org_info['notes'] if n]) if org_info['notes'] else ""),
            
            status="Active" if relationship_status == "active" else "Prospect"
        )
        
        try:
            await organization.create()
            organizations_created += 1
            print(f"Created organization: {org_name} ({org_type}, {industry})")
        except Exception as e:
            print(f"Error creating organization {org_name}: {e}")
    
    print(f"Successfully created {organizations_created} organizations")
    
    # Close database connection
    client.close()

if __name__ == "__main__":
    asyncio.run(extract_and_import_organizations())