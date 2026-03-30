// MongoDB Index Creation
// This script creates indexes for optimal query performance

print("Creating indexes for funds_tracker_db...");

// Switch to funds_tracker_db
use funds_tracker_db;

// Documents collection indexes
db.documents.createIndex({ "organization_id": 1 });
db.documents.createIndex({ "meeting_id": 1 });
db.documents.createIndex({ "created_by": 1 });
db.documents.createIndex({ "created_at": -1 });
db.documents.createIndex({ "updated_at": -1 });
db.documents.createIndex({ "tags": 1 });
db.documents.createIndex({ "content": "text" }); // Full-text search on content
db.documents.createIndex({ "title": "text" }); // Full-text search on title

// Meetings collection indexes
db.meetings.createIndex({ "organization_id": 1 });
db.meetings.createIndex({ "participants": 1 });
db.meetings.createIndex({ "scheduled_date": -1 });
db.meetings.createIndex({ "status": 1 });
db.meetings.createIndex({ "created_at": -1 });
db.meetings.createIndex({ "updated_at": -1 });

// Organizations collection indexes
db.organizations.createIndex({ "name": 1 }, { unique: true });
db.organizations.createIndex({ "created_at": -1 });
db.organizations.createIndex({ "updated_at": -1 });

// Users collection indexes (if exists)
if (db.users) {
  db.users.createIndex({ "email": 1 }, { unique: true });
  db.users.createIndex({ "organization_id": 1 });
  db.users.createIndex({ "role": 1 });
  db.users.createIndex({ "created_at": -1 });
}

// Permissions collection indexes (if exists)
if (db.permissions) {
  db.permissions.createIndex({ "user_id": 1 });
  db.permissions.createIndex({ "resource_type": 1 });
  db.permissions.createIndex({ "resource_id": 1 });
  db.permissions.createIndex({ "permission": 1 });
}

print("✅ Indexes created successfully");
print("📊 Performance optimization complete");