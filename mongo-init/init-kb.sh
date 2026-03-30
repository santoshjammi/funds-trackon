#!/bin/bash

# MongoDB Knowledge Base Initialization Script
# This script runs the Node.js initialization for the Knowledge Base system

echo "🚀 Starting Knowledge Base initialization..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
sleep 10

# Check if MongoDB is accessible
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
  echo "⏳ Waiting for MongoDB connection..."
  sleep 2
done

echo "✅ MongoDB is ready!"

# Run the Node.js initialization script
echo "🔧 Running Knowledge Base schema initialization..."
cd /docker-entrypoint-initdb.d

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing Node.js dependencies..."
  npm install mongodb
fi

# Run the initialization script
node init-knowledge-base.js

if [ $? -eq 0 ]; then
  echo "🎉 Knowledge Base initialization completed successfully!"
else
  echo "❌ Knowledge Base initialization failed!"
  exit 1
fi