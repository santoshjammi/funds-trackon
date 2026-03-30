#!/bin/bash
# Data migration script for existing documents to organization-centric knowledge base
# This script migrates existing data to the new knowledge base structure

echo "Starting data migration for Knowledge Base system..."

mongosh --host localhost --port 27017 <<EOF

use funds_tracker_db;

print("Starting knowledge base data migration...");

// 1. Migrate existing documents to new structure
print("Step 1: Migrating existing documents...");

// Get all existing documents that don't have organization_id
var documentsToMigrate = db.document.find({ organization_id: { \$exists: false } });
var migratedCount = 0;

documentsToMigrate.forEach(function(doc) {
    var updateFields = {};
    var needsUpdate = false;
    
    // Add missing required fields
    if (!doc.organization_id) {
        // Try to find organization from related entities
        var orgId = null;
        
        // Check if document has fundraising_id
        if (doc.fundraising_id) {
            var fundraising = db.fundraising.findOne({ _id: ObjectId(doc.fundraising_id) });
            if (fundraising && fundraising.organisation) {
                // Find or create organization
                var org = db.organization.findOne({ name: fundraising.organisation });
                if (!org) {
                    // Create organization from fundraising data
                    var newOrg = {
                        name: fundraising.organisation,
                        industry: fundraising.investor_type || "Other",
                        status: "Active",
                        relationship_type: "Client",
                        priority: "Medium",
                        created_at: new Date(),
                        updated_at: new Date(),
                        tags: [],
                        document_ids: []
                    };
                    var insertResult = db.organization.insertOne(newOrg);
                    orgId = insertResult.insertedId;
                    print("Created organization:", fundraising.organisation);
                } else {
                    orgId = org._id;
                }
            }
        }
        
        // If still no organization found, create a default one
        if (!orgId) {
            var defaultOrg = db.organization.findOne({ name: "Default Organization" });
            if (!defaultOrg) {
                var defaultOrgDoc = {
                    name: "Default Organization",
                    industry: "Other",
                    status: "Active",
                    relationship_type: "Internal",
                    priority: "Low",
                    created_at: new Date(),
                    updated_at: new Date(),
                    tags: ["migrated"],
                    document_ids: []
                };
                var insertResult = db.organization.insertOne(defaultOrgDoc);
                orgId = insertResult.insertedId;
                print("Created default organization");
            } else {
                orgId = defaultOrg._id;
            }
        }
        
        updateFields.organization_id = orgId;
        needsUpdate = true;
    }
    
    // Add missing array fields
    if (!doc.contact_ids) {
        updateFields.contact_ids = [];
        needsUpdate = true;
    }
    if (!doc.user_ids) {
        updateFields.user_ids = [];
        needsUpdate = true;
    }
    if (!doc.related_fundraising_ids) {
        updateFields.related_fundraising_ids = doc.fundraising_id ? [doc.fundraising_id] : [];
        needsUpdate = true;
    }
    if (!doc.related_opportunity_ids) {
        updateFields.related_opportunity_ids = [];
        needsUpdate = true;
    }
    if (!doc.related_task_ids) {
        updateFields.related_task_ids = [];
        needsUpdate = true;
    }
    if (!doc.related_document_ids) {
        updateFields.related_document_ids = [];
        needsUpdate = true;
    }
    
    // Add knowledge base specific fields
    if (!doc.tags) {
        updateFields.tags = [];
        needsUpdate = true;
    }
    if (!doc.keywords) {
        updateFields.keywords = [];
        needsUpdate = true;
    }
    if (doc.is_public === undefined) {
        updateFields.is_public = false;
        needsUpdate = true;
    }
    if (doc.organization_access_only === undefined) {
        updateFields.organization_access_only = true;
        needsUpdate = true;
    }
    if (!doc.access_count) {
        updateFields.access_count = 0;
        needsUpdate = true;
    }
    if (!doc.relevance_score) {
        updateFields.relevance_score = 50; // Default middle score
        needsUpdate = true;
    }
    if (!doc.confidentiality_level) {
        updateFields.confidentiality_level = "INTERNAL";
        needsUpdate = true;
    }
    
    // Set organization name for search optimization
    if (updateFields.organization_id) {
        var org = db.organization.findOne({ _id: updateFields.organization_id });
        if (org) {
            updateFields.organization_name = org.name;
            updateFields.industry_sector = org.industry;
            needsUpdate = true;
        }
    }
    
    // Update timestamps
    if (!doc.updated_at) {
        updateFields.updated_at = new Date();
        needsUpdate = true;
    }
    
    // Apply updates
    if (needsUpdate) {
        db.document.updateOne(
            { _id: doc._id },
            { \$set: updateFields }
        );
        migratedCount++;
    }
});

print("Migrated", migratedCount, "documents to new knowledge base structure");

// 2. Create knowledge base documents for existing meetings with content
print("Step 2: Creating knowledge base documents for meetings...");

var meetingsWithContent = db.meeting.find({
    \$or: [
        { notes: { \$exists: true, \$ne: null, \$ne: "" } },
        { ai_summary: { \$exists: true, \$ne: null, \$ne: "" } },
        { ai_key_points: { \$exists: true, \$ne: null, \$ne: [] } },
        { ai_action_items: { \$exists: true, \$ne: null, \$ne: [] } }
    ]
});

var meetingDocsCreated = 0;

meetingsWithContent.forEach(function(meeting) {
    // Check if knowledge base document already exists for this meeting
    var existingDoc = db.document.findOne({ meeting_id: meeting._id.toString() });
    
    if (!existingDoc) {
        // Get fundraising and organization info
        var fundraising = db.fundraising.findOne({ _id: ObjectId(meeting.fundraising_id) });
        var orgId = null;
        var orgName = "Unknown Organization";
        
        if (fundraising) {
            var org = db.organization.findOne({ name: fundraising.organisation });
            if (org) {
                orgId = org._id;
                orgName = org.name;
            }
        }
        
        if (!orgId) {
            // Use default organization
            var defaultOrg = db.organization.findOne({ name: "Default Organization" });
            if (defaultOrg) {
                orgId = defaultOrg._id;
                orgName = defaultOrg.name;
            }
        }
        
        // Build document content
        var contentParts = [];
        contentParts.push("# Meeting: " + meeting.title);
        contentParts.push("**Date:** " + (meeting.scheduled_date || meeting.actual_date || meeting.created_at));
        contentParts.push("**Type:** " + meeting.meeting_type);
        contentParts.push("**Status:** " + meeting.status);
        
        if (meeting.location) {
            contentParts.push("**Location:** " + meeting.location);
        }
        
        if (meeting.agenda) {
            contentParts.push("\\n## Agenda\\n" + meeting.agenda);
        }
        
        if (meeting.notes) {
            contentParts.push("\\n## Notes\\n" + meeting.notes);
        }
        
        if (meeting.ai_summary) {
            contentParts.push("\\n## AI Summary\\n" + meeting.ai_summary);
        }
        
        if (meeting.ai_key_points && meeting.ai_key_points.length > 0) {
            contentParts.push("\\n## Key Points\\n" + meeting.ai_key_points.map(p => "- " + p).join("\\n"));
        }
        
        if (meeting.ai_action_items && meeting.ai_action_items.length > 0) {
            contentParts.push("\\n## Action Items\\n" + meeting.ai_action_items.map(i => "- " + i).join("\\n"));
        }
        
        if (meeting.audio_recording && meeting.audio_recording.transcript) {
            contentParts.push("\\n## Transcript\\n" + meeting.audio_recording.transcript);
        }
        
        var content = contentParts.join("\\n\\n");
        var title = "Meeting: " + meeting.title + " - " + orgName;
        
        // Create knowledge base document
        var knowledgeDoc = {
            title: title,
            content: content,
            document_type: "meeting_minutes",
            category: "meeting_minutes",
            status: "active",
            organization_id: orgId,
            organization_name: orgName,
            meeting_id: meeting._id.toString(),
            fundraising_id: meeting.fundraising_id,
            contact_ids: meeting.contact_id ? [meeting.contact_id] : [],
            user_ids: meeting.created_by ? [meeting.created_by] : [],
            related_fundraising_ids: meeting.fundraising_id ? [meeting.fundraising_id] : [],
            related_opportunity_ids: [],
            related_task_ids: [],
            related_document_ids: [],
            tags: ["meeting", "migrated"],
            keywords: [meeting.meeting_type, "meeting", orgName],
            is_public: false,
            organization_access_only: true,
            access_count: 0,
            relevance_score: 75,
            confidentiality_level: "INTERNAL",
            custom_metadata: {
                migration_source: "meeting",
                migration_date: new Date()
            },
            created_by: meeting.created_by || "system",
            created_at: meeting.created_at || new Date(),
            updated_at: new Date()
        };
        
        db.document.insertOne(knowledgeDoc);
        meetingDocsCreated++;
    }
});

print("Created", meetingDocsCreated, "knowledge base documents from meetings");

// 3. Update organization document counts
print("Step 3: Updating organization document counts...");

db.organization.find().forEach(function(org) {
    var docCount = db.document.countDocuments({ organization_id: org._id });
    var docIds = db.document.find(
        { organization_id: org._id }, 
        { _id: 1 }
    ).map(function(doc) { return doc._id.toString(); });
    
    db.organization.updateOne(
        { _id: org._id },
        { 
            \$set: { 
                document_ids: docIds,
                updated_at: new Date()
            } 
        }
    );
});

// 4. Migration summary
print("\\n=== Migration Summary ===");
print("Documents migrated:", migratedCount);
print("Meeting knowledge docs created:", meetingDocsCreated);
print("Total documents:", db.document.countDocuments());
print("Total organizations:", db.organization.countDocuments());
print("Documents with organization_id:", db.document.countDocuments({ organization_id: { \$exists: true } }));
print("Meeting documents:", db.document.countDocuments({ document_type: "meeting_minutes" }));

print("Knowledge base migration completed successfully!");

EOF

echo "Data migration completed!"