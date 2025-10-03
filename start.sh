#!/bin/bash

# Start script for funds-trackon development environment
# This script starts the Docker containers for the application

set -e

echo "🚀 Starting funds-trackon development environment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found. Please create one based on .env.example"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "📦 Building and starting Docker containers..."
docker compose up -d --build

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Services started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:${FRONTEND_PORT:-3002}"
echo "🔧 Backend API: http://localhost:${BACKEND_PORT:-8001}"
echo "🗄️  MongoDB: localhost:${MONGO_PORT:-27019}"
echo ""
echo "📋 Useful commands:"
echo "  docker compose logs -f          # View logs"
echo "  docker compose down             # Stop services"
echo "  docker compose restart backend  # Restart backend only"
echo ""
echo "Happy coding! 🎉"