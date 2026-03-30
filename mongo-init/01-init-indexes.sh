#!/bin/bash
# MongoDB initialization script for Knowledge Base System
# This script sets up indexes and collections for the funds tracker application

echo "Initializing MongoDB for Niveshya Knowledge Base System..."

# Connect to MongoDB and create database
mongosh --host localhost --port 27017 <<EOF

// Switch to the funds_tracker_db database
use funds_tracker_db;

print("Creating indexes for Document collection (Knowledge Base)...");

// Document Collection Indexes for Knowledge Base
db.document.createIndex({ "organization_id": 1 });
db.document.createIndex({ "meeting_id": 1 });
db.document.createIndex({ "document_type": 1 });
db.document.createIndex({ "category": 1 });
db.document.createIndex({ "status": 1 });
db.document.createIndex({ "organization_id": 1, "document_type": 1 });
db.document.createIndex({ "organization_id": 1, "category": 1 });
db.document.createIndex({ "fundraising_id": 1 });
db.document.createIndex({ "opportunity_id": 1 });
db.document.createIndex({ "task_id": 1 });
db.document.createIndex({ "contact_ids": 1 });
db.document.createIndex({ "user_ids": 1 });
db.document.createIndex({ "related_fundraising_ids": 1 });
db.document.createIndex({ "related_opportunity_ids": 1 });
db.document.createIndex({ "related_task_ids": 1 });
db.document.createIndex({ "created_at": -1 });
db.document.createIndex({ "updated_at": -1 });
db.document.createIndex({ "relevance_score": -1 });
db.document.createIndex({ "access_count": -1 });
db.document.createIndex({ "tags": 1 });
db.document.createIndex({ "keywords": 1 });
db.document.createIndex({ "is_public": 1 });
db.document.createIndex({ "organization_access_only": 1 });

// Text search index for knowledge base content
db.document.createIndex({ 
  "title": "text", 
  "content": "text", 
  "tags": "text",
  "keywords": "text"
}, {
  "name": "knowledge_base_text_search"
});

// Compound indexes for efficient knowledge base queries
db.document.createIndex({ "organization_id": 1, "status": 1, "document_type": 1 });
db.document.createIndex({ "organization_id": 1, "created_at": -1 });
db.document.createIndex({ "organization_id": 1, "relevance_score": -1 });

print("Creating indexes for Meeting collection...");

// Meeting Collection Indexes
db.meeting.createIndex({ "fundraising_id": 1 });
db.meeting.createIndex({ "contact_id": 1 });
db.meeting.createIndex({ "created_by": 1 });
db.meeting.createIndex({ "scheduled_date": -1 });
db.meeting.createIndex({ "actual_date": -1 });
db.meeting.createIndex({ "created_at": -1 });
db.meeting.createIndex({ "updated_at": -1 });
db.meeting.createIndex({ "status": 1 });
db.meeting.createIndex({ "meeting_type": 1 });
db.meeting.createIndex({ "title": "text", "agenda": "text", "notes": "text" });

// AI content indexes for meetings
db.meeting.createIndex({ "ai_summary": 1 });
db.meeting.createIndex({ "ai_key_points": 1 });
db.meeting.createIndex({ "ai_action_items": 1 });
db.meeting.createIndex({ "audio_recording.processing_status": 1 });
db.meeting.createIndex({ "audio_recording.transcript": "text" });

print("Creating indexes for Organization collection...");

// Organization Collection Indexes
db.organization.createIndex({ "name": 1 }, { unique: true });
db.organization.createIndex({ "industry": 1 });
db.organization.createIndex({ "status": 1 });
db.organization.createIndex({ "relationship_type": 1 });
db.organization.createIndex({ "priority": 1 });
db.organization.createIndex({ "created_at": -1 });
db.organization.createIndex({ "tags": 1 });
db.organization.createIndex({ "name": "text", "description": "text" });

print("Creating indexes for Fundraising collection...");

// Fundraising Collection Indexes
db.fundraising.createIndex({ "organisation": 1 });
db.fundraising.createIndex({ "status_open_closed": 1 });
db.fundraising.createIndex({ "responsibility_tnifmc": 1 });
db.fundraising.createIndex({ "responsibility_niveshya": 1 });
db.fundraising.createIndex({ "investor_type": 1 });
db.fundraising.createIndex({ "created_at": -1 });
db.fundraising.createIndex({ "date_of_first_meeting_call": -1 });
db.fundraising.createIndex({ "contact_id": 1 });

print("Creating indexes for Contact collection...");

// Contact Collection Indexes
db.contact.createIndex({ "organisation": 1 });
db.contact.createIndex({ "email": 1 });
db.contact.createIndex({ "name": 1 });
db.contact.createIndex({ "status": 1 });
db.contact.createIndex({ "created_at": -1 });
db.contact.createIndex({ "name": "text", "organisation": "text", "designation": "text" });

print("Creating indexes for Opportunity collection...");

// Opportunity Collection Indexes
db.opportunity.createIndex({ "organisation": 1 });
db.opportunity.createIndex({ "status": 1 });
db.opportunity.createIndex({ "assigned_to": 1 });
db.opportunity.createIndex({ "contact_id": 1 });
db.opportunity.createIndex({ "priority": 1 });
db.opportunity.createIndex({ "created_at": -1 });
db.opportunity.createIndex({ "target_close_date": 1 });

print("Creating indexes for Task collection...");

// Task Collection Indexes
db.task.createIndex({ "assigned_to": 1 });
db.task.createIndex({ "assigned_by": 1 });
db.task.createIndex({ "status": 1 });
db.task.createIndex({ "priority": 1 });
db.task.createIndex({ "due_date": 1 });
db.task.createIndex({ "completed_date": -1 });
db.task.createIndex({ "contact_id": 1 });
db.task.createIndex({ "opportunity_id": 1 });
db.task.createIndex({ "fundraising_id": 1 });
db.task.createIndex({ "created_at": -1 });

print("Creating indexes for User collection...");

// User Collection Indexes
db.user.createIndex({ "email": 1 }, { unique: true });
db.user.createIndex({ "username": 1 }, { unique: true, sparse: true });
db.user.createIndex({ "is_active": 1 });
db.user.createIndex({ "role_names": 1 });
db.user.createIndex({ "employment_type": 1 });
db.user.createIndex({ "organisation": 1 });
db.user.createIndex({ "created_at": -1 });
db.user.createIndex({ "last_login": -1 });

print("Creating indexes for Role collection...");

// Role Collection Indexes
db.role.createIndex({ "name": 1 }, { unique: true });
db.role.createIndex({ "is_system_role": 1 });
db.role.createIndex({ "permissions": 1 });

print("Creating indexes for Permission collection...");

// Permission Collection Indexes
db.permission.createIndex({ "name": 1 }, { unique: true });
db.permission.createIndex({ "category": 1 });

print("MongoDB Knowledge Base initialization completed successfully!");

// Show collection statistics
print("\\n=== Collection Statistics ===");
print("Documents:", db.document.countDocuments());
print("Meetings:", db.meeting.countDocuments());
print("Organizations:", db.organization.countDocuments());
print("Fundraising:", db.fundraising.countDocuments());
print("Contacts:", db.contact.countDocuments());
print("Opportunities:", db.opportunity.countDocuments());
print("Tasks:", db.task.countDocuments());
print("Users:", db.user.countDocuments());
print("Roles:", db.role.countDocuments());
print("Permissions:", db.permission.countDocuments());

// Show indexes created
print("\\n=== Indexes Created ===");
print("Document indexes:", db.document.getIndexes().length);
print("Meeting indexes:", db.meeting.getIndexes().length);
print("Organization indexes:", db.organization.getIndexes().length);
print("Fundraising indexes:", db.fundraising.getIndexes().length);

EOF

echo "MongoDB initialization completed!"