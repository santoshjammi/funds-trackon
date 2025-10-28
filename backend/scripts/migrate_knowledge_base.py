"""
Knowledge Base Migration Script
Migrates existing documents to organization-centric knowledge base structure
"""

import asyncio
import sys
import os
sys.path.append('/Users/kgt/Desktop/Projects/funds-trackon/backend')

from app.models.database import init_db
from app.models.document import DocumentMetadata
from app.models.organization import Organization
from app.models.contact import Contact
from app.models.user import User


async def migrate_documents_to_knowledge_base():
    """Migrate existing documents to organization-centric knowledge base"""
    
    print("Starting knowledge base migration...")
    
    # Initialize database
    await init_db()
    
    # Get all existing documents
    documents = await DocumentMetadata.find_all().to_list()
    
    print(f"Found {len(documents)} documents to migrate...")
    
    migrated_count = 0
    skipped_count = 0
    
    for doc in documents:
        try:
            needs_update = False
            
            # Ensure organization_id is set - if not, skip this document
            if not doc.organization_id:
                print(f"Skipping document '{doc.title}' - no organization_id")
                skipped_count += 1
                continue
            
            # Populate organization context if missing
            if not doc.organization_name or not doc.industry_sector:
                org = await Organization.get(doc.organization_id)
                if org:
                    doc.organization_name = org.name
                    doc.industry_sector = org.industry.value if org.industry else None
                    needs_update = True
            
            # Migrate old contact_id to contact_ids array
            if hasattr(doc, 'contact_id') and doc.contact_id and doc.contact_id not in doc.contact_ids:
                doc.contact_ids.append(doc.contact_id)
                needs_update = True
            
            # Initialize new fields if they don't exist
            if not hasattr(doc, 'keywords') or doc.keywords is None:
                doc.keywords = []
                needs_update = True
                
            if not hasattr(doc, 'related_fundraising_ids') or doc.related_fundraising_ids is None:
                doc.related_fundraising_ids = []
                if doc.fundraising_id:
                    doc.related_fundraising_ids = [doc.fundraising_id]
                needs_update = True
                
            if not hasattr(doc, 'related_opportunity_ids') or doc.related_opportunity_ids is None:
                doc.related_opportunity_ids = []
                if doc.opportunity_id:
                    doc.related_opportunity_ids = [doc.opportunity_id]
                needs_update = True
                
            if not hasattr(doc, 'related_task_ids') or doc.related_task_ids is None:
                doc.related_task_ids = []
                if doc.task_id:
                    doc.related_task_ids = [doc.task_id]
                needs_update = True
                
            if not hasattr(doc, 'related_document_ids') or doc.related_document_ids is None:
                doc.related_document_ids = []
                needs_update = True
                
            if not hasattr(doc, 'user_ids') or doc.user_ids is None:
                doc.user_ids = []
                needs_update = True
                
            if not hasattr(doc, 'confidentiality_level') or doc.confidentiality_level is None:
                doc.confidentiality_level = "INTERNAL"
                needs_update = True
                
            if not hasattr(doc, 'organization_access_only') or doc.organization_access_only is None:
                doc.organization_access_only = True
                needs_update = True
                
            if not hasattr(doc, 'access_count') or doc.access_count is None:
                doc.access_count = 0
                needs_update = True
            
            # Calculate and set initial relevance score
            if not hasattr(doc, 'relevance_score') or doc.relevance_score is None:
                doc.relevance_score = doc.calculate_relevance_score()
                needs_update = True
            
            if needs_update:
                await doc.save()
                migrated_count += 1
                print(f"Migrated document: '{doc.title}' for organization: {doc.organization_name}")
            
        except Exception as e:
            print(f"Error migrating document '{doc.title}': {e}")
            continue
    
    print(f"\nMigration completed!")
    print(f"Migrated: {migrated_count} documents")
    print(f"Skipped: {skipped_count} documents")
    print(f"Total processed: {len(documents)} documents")


async def verify_knowledge_base_structure():
    """Verify the knowledge base structure after migration"""
    
    print("\nVerifying knowledge base structure...")
    
    # Check documents by organization
    orgs = await Organization.find_all().to_list()
    
    for org in orgs[:5]:  # Check first 5 organizations
        docs = await DocumentMetadata.find({"organization_id": str(org.id)}).to_list()
        print(f"Organization '{org.name}': {len(docs)} documents")
        
        # Show sample document structure
        if docs:
            sample_doc = docs[0]
            print(f"  Sample document: '{sample_doc.title}'")
            print(f"    - Contact IDs: {len(sample_doc.contact_ids)}")
            print(f"    - User IDs: {len(sample_doc.user_ids)}")
            print(f"    - Related Fundraising: {len(sample_doc.related_fundraising_ids)}")
            print(f"    - Related Opportunities: {len(sample_doc.related_opportunity_ids)}")
            print(f"    - Related Tasks: {len(sample_doc.related_task_ids)}")
            print(f"    - Relevance Score: {sample_doc.relevance_score}")
    
    print("\nVerification completed!")


if __name__ == "__main__":
    asyncio.run(migrate_documents_to_knowledge_base())
    asyncio.run(verify_knowledge_base_structure())