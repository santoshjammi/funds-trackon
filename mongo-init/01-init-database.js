// MongoDB Database Initialization
// This script creates the initial database and sets up basic configuration

print("Initializing funds_tracker_db database...");

// Switch to funds_tracker_db
use funds_tracker_db;

// Create database info document
db.database_info.insertOne({
  name: "Niveshya Lead Management System - Knowledge Base",
  version: "1.0.0",
  description: "Organization-centric knowledge base for investment tracking",
  features: [
    "Organization-centric document management",
    "Meeting notes and AI content storage",
    "Cross-entity relationship mapping",
    "Full-text search capabilities",
    "RBAC permissions system"
  ],
  created_at: new Date(),
  initialized: true
});

print("✅ Database initialized successfully");
print("📊 Database info created");