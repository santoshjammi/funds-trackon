#!/bin/bash
# MongoDB Initialization Script Runner
# This script runs the MongoDB initialization scripts in the correct order

set -e

echo "🚀 Starting MongoDB Knowledge Base Initialization..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
    echo "Waiting for MongoDB..."
    sleep 2
done

echo "✅ MongoDB is ready!"

# Run initialization scripts in order
echo "📋 Running initialization scripts..."

# 01-init-database.js
if [ -f "/docker-entrypoint-initdb.d/01-init-database.js" ]; then
    echo "🔧 Running 01-init-database.js..."
    mongosh /docker-entrypoint-initdb.d/01-init-database.js
    echo "✅ 01-init-database.js completed"
fi

# 02-setup-schema.js
if [ -f "/docker-entrypoint-initdb.d/02-setup-schema.js" ]; then
    echo "🔧 Running 02-setup-schema.js..."
    mongosh /docker-entrypoint-initdb.d/02-setup-schema.js
    echo "✅ 02-setup-schema.js completed"
fi

# 03-create-indexes.js
if [ -f "/docker-entrypoint-initdb.d/03-create-indexes.js" ]; then
    echo "🔧 Running 03-create-indexes.js..."
    mongosh /docker-entrypoint-initdb.d/03-create-indexes.js
    echo "✅ 03-create-indexes.js completed"
fi

# 04-seed-data.js
if [ -f "/docker-entrypoint-initdb.d/04-seed-data.js" ]; then
    echo "🔧 Running 04-seed-data.js..."
    mongosh /docker-entrypoint-initdb.d/04-seed-data.js
    echo "✅ 04-seed-data.js completed"
fi

echo ""
echo "🎉 MongoDB Knowledge Base initialization completed successfully!"
echo ""
echo "📊 Setup Summary:"
echo "   - Database: funds_tracker_db"
echo "   - Collections: document, meeting, organization, permission, role"
echo "   - Indexes: Performance optimized for knowledge base queries"
echo "   - Permissions: Knowledge base and meeting management roles"
echo ""
echo "🚀 Ready for deployment!"