// MongoDB JavaScript initialization for Knowledge Base System
// This script creates the database schema and sets up collections
// NOTE: This file is designed to run in MongoDB shell (mongosh), not Node.js

print("Setting up Niveshya Knowledge Base Schema...");

// Switch to funds_tracker_db
use funds_tracker_db;

// Drop existing collections if they exist (for clean setup)
print("Dropping existing collections if they exist...");
db.document.drop();
db.meeting.drop();
db.organization.drop();
db.permission.drop();
db.role.drop();

// Create collections with validation schemas
print("Creating Document collection with schema validation...");

db.createCollection("document", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "document_type", "organization_id", "status", "created_by"],
      properties: {
        title: {
          bsonType: "string",
          description: "Document title is required"
        },
        content: {
          bsonType: "string",
          description: "Document content"
        },
        document_type: {
          enum: ["text", "audio", "image", "video", "document", "presentation", "spreadsheet", "meeting_minutes", "other"],
          description: "Document type must be one of the specified values"
        },
        category: {
          enum: ["summary", "notes", "discussion", "meeting_minutes", "presentation", "contract", "research", "correspondence", "other"],
          description: "Document category for organization"
        },
        status: {
          enum: ["active", "archived", "deleted"],
          description: "Document status"
        },
        organization_id: {
          bsonType: "objectId",
          description: "Organization ID is required for knowledge base"
        },
        organization_name: {
          bsonType: "string",
          description: "Organization name for search optimization"
        },
        meeting_id: {
          bsonType: "string",
          description: "Meeting ID if document is meeting-related"
        },
        fundraising_id: {
          bsonType: "string",
          description: "Fundraising campaign ID"
        },
        contact_ids: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Array of related contact IDs"
        },
        user_ids: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Array of related user IDs"
        },
        related_fundraising_ids: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Cross-fundraising relationships"
        },
        tags: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "Document tags for categorization"
        },
        is_public: {
          bsonType: "bool",
          description: "Whether document is publicly accessible"
        },
        organization_access_only: {
          bsonType: "bool",
          description: "Restrict access to organization members only"
        },
        relevance_score: {
          bsonType: "number",
          description: "Calculated relevance score for knowledge discovery"
        },
        access_count: {
          bsonType: "number",
          description: "Number of times document has been accessed"
        },
        created_by: {
          bsonType: "string",
          description: "User ID of document creator"
        },
        created_at: {
          bsonType: "date",
          description: "Document creation timestamp"
        },
        updated_at: {
          bsonType: "date",
          description: "Document last update timestamp"
        }
      }
    }
  }
});

print("Creating Meeting collection with AI content support...");

db.createCollection("meeting", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["title", "meeting_type", "fundraising_id", "status", "scheduled_date"],
      properties: {
        title: {
          bsonType: "string",
          description: "Meeting title is required"
        },
        meeting_type: {
          enum: ["Initial Meeting", "Follow-up", "Due Diligence", "Closing", "General Discussion"],
          description: "Meeting type classification"
        },
        status: {
          enum: ["Scheduled", "Completed", "Cancelled", "Postponed"],
          description: "Meeting status"
        },
        fundraising_id: {
          bsonType: "string",
          description: "Related fundraising campaign ID"
        },
        contact_id: {
          bsonType: "string",
          description: "Primary contact for the meeting"
        },
        notes: {
          bsonType: "string",
          description: "Manual meeting notes"
        },
        ai_summary: {
          bsonType: "string",
          description: "AI-generated meeting summary"
        },
        ai_key_points: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "AI-extracted key points"
        },
        ai_action_items: {
          bsonType: "array",
          items: {
            bsonType: "string"
          },
          description: "AI-identified action items"
        },
        ai_sentiment: {
          bsonType: "string",
          description: "AI sentiment analysis"
        },
        audio_recording: {
          bsonType: "object",
          properties: {
            filename: {
              bsonType: "string"
            },
            transcript: {
              bsonType: "string"
            },
            processing_status: {
              enum: ["not_started", "processing", "completed", "failed"]
            }
          }
        },
        scheduled_date: {
          bsonType: "date",
          description: "Meeting scheduled date and time"
        }
      }
    }
  }
});

print("Creating Organization collection...");

db.createCollection("organization", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name"],
      properties: {
        name: {
          bsonType: "string",
          description: "Organization name is required and must be unique"
        },
        industry: {
          enum: ["Banking", "Insurance", "Mutual Funds", "Pension Funds", "Asset Management", "Sovereign Wealth Funds", "Consulting", "Real Estate", "Infrastructure", "Government", "FinTech", "Other"],
          description: "Industry classification"
        },
        status: {
          enum: ["Active", "Inactive", "Prospect", "Partner", "Competitor"],
          description: "Organization status"
        },
        relationship_type: {
          bsonType: "string",
          description: "Type of business relationship"
        },
        priority: {
          enum: ["High", "Medium", "Low"],
          description: "Organization priority level"
        }
      }
    }
  }
});

// Create indexes for optimal performance
print("Creating database indexes...");

db.document.createIndex({ "organization_id": 1 });
db.document.createIndex({ "meeting_id": 1 });
db.document.createIndex({ "document_type": 1 });
db.document.createIndex({ "organization_id": 1, "document_type": 1 });
db.document.createIndex({ "organization_id": 1, "category": 1 });
db.document.createIndex({ "created_at": -1 });
db.document.createIndex({ "relevance_score": -1 });
db.document.createIndex({ "$**": "text" }); // Full text search index

db.meeting.createIndex({ "fundraising_id": 1 });
db.meeting.createIndex({ "created_at": -1 });
db.meeting.createIndex({ "ai_summary": 1 });

db.organization.createIndex({ "name": 1 }, { unique: true });

// Insert default system data
print("Inserting default system data...");

// Insert default permissions
db.permission.insertMany([
  {
    name: "view_documents",
    description: "View knowledge base documents",
    category: "Knowledge Base",
    created_at: new Date()
  },
  {
    name: "create_documents",
    description: "Create knowledge base documents",
    category: "Knowledge Base",
    created_at: new Date()
  },
  {
    name: "edit_documents",
    description: "Edit knowledge base documents",
    category: "Knowledge Base",
    created_at: new Date()
  },
  {
    name: "delete_documents",
    description: "Delete knowledge base documents",
    category: "Knowledge Base",
    created_at: new Date()
  },
  {
    name: "view_meetings",
    description: "View meetings and meeting content",
    category: "Meetings",
    created_at: new Date()
  },
  {
    name: "create_meetings",
    description: "Create meetings",
    category: "Meetings",
    created_at: new Date()
  },
  {
    name: "edit_meetings",
    description: "Edit meetings and meeting content",
    category: "Meetings",
    created_at: new Date()
  },
  {
    name: "delete_meetings",
    description: "Delete meetings",
    category: "Meetings",
    created_at: new Date()
  },
  {
    name: "process_meeting_audio",
    description: "Process meeting audio recordings",
    category: "Meetings",
    created_at: new Date()
  },
  {
    name: "view_organizations",
    description: "View organization information",
    category: "Organizations",
    created_at: new Date()
  },
  {
    name: "create_organizations",
    description: "Create organizations",
    category: "Organizations",
    created_at: new Date()
  },
  {
    name: "edit_organizations",
    description: "Edit organization information",
    category: "Organizations",
    created_at: new Date()
  }
]);

// Insert default roles with knowledge base permissions
db.role.insertMany([
  {
    name: "Knowledge Manager",
    description: "Full access to knowledge base and document management",
    permissions: [
      "view_documents", "create_documents", "edit_documents", "delete_documents",
      "view_meetings", "create_meetings", "edit_meetings",
      "view_organizations", "create_organizations", "edit_organizations"
    ],
    is_system_role: true,
    color: "#10B981",
    created_at: new Date()
  },
  {
    name: "Meeting Manager",
    description: "Manage meetings and meeting content including AI processing",
    permissions: [
      "view_meetings", "create_meetings", "edit_meetings", "delete_meetings",
      "process_meeting_audio", "view_documents", "create_documents"
    ],
    is_system_role: true,
    color: "#3B82F6",
    created_at: new Date()
  },
  {
    name: "Knowledge Reader",
    description: "Read-only access to knowledge base and meeting content",
    permissions: [
      "view_documents", "view_meetings", "view_organizations"
    ],
    is_system_role: true,
    color: "#6B7280",
    created_at: new Date()
  }
]);

print("Knowledge Base schema setup completed!");

// Show setup summary
print("\n=== Knowledge Base Setup Summary ===");
print("✅ Document collection created with validation");
print("✅ Meeting collection created with AI content support");
print("✅ Organization collection created");
print("✅ Database indexes created");
print("✅ Default permissions inserted:", db.permission.countDocuments());
print("✅ Default roles inserted:", db.role.countDocuments());
print("\nKnowledge Base system is ready for deployment!");