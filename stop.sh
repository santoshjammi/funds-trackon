#!/bin/bash

# Stop script for funds-trackon development environment
# This script stops and removes the Docker containers

echo "🛑 Stopping funds-trackon development environment..."

# Stop and remove containers, networks
docker compose down

# Optional: Remove volumes (uncomment if you want to reset data)
# docker compose down -v

echo "✅ Services stopped successfully!"
echo ""
echo "💡 To start again, run: ./start.sh"