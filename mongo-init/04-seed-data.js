// MongoDB Data Seeding
// This script adds default data for the knowledge base system

print("Seeding default data for funds_tracker_db...");

// Switch to funds_tracker_db
use funds_tracker_db;

// Seed default organization if none exists
const orgCount = db.organizations.countDocuments();
if (orgCount === 0) {
  db.organizations.insertOne({
    _id: ObjectId(),
    name: "Niveshya Investments",
    description: "Lead management and investment tracking platform",
    created_at: new Date(),
    updated_at: new Date(),
    settings: {
      max_storage_gb: 100,
      max_users: 50,
      features_enabled: ["documents", "meetings", "analytics"]
    }
  });
  print("✅ Default organization created");
}

// Seed default permissions if permissions collection exists and is empty
if (db.permissions && db.permissions.countDocuments() === 0) {
  // This would be populated by the RBAC system
  print("ℹ️  Permissions collection is empty - will be populated by RBAC system");
}

// Seed sample document types if needed
const sampleDocTypes = [
  "Meeting Notes",
  "Investment Analysis",
  "Client Profile",
  "Financial Report",
  "Strategy Document"
];

sampleDocTypes.forEach(type => {
  const exists = db.documents.findOne({ title: type, is_template: true });
  if (!exists) {
    db.documents.insertOne({
      _id: ObjectId(),
      title: type,
      content: `# ${type}\n\nThis is a template for ${type.toLowerCase()}.`,
      organization_id: db.organizations.findOne()._id,
      created_by: "system",
      created_at: new Date(),
      updated_at: new Date(),
      tags: ["template"],
      is_template: true,
      document_type: type
    });
  }
});

print("✅ Default data seeded successfully");
print("📊 Knowledge base ready for use");