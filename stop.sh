#!/bin/bash

# Stop script for funds-trackon development environment
# This script stops and removes the Docker containers

echo "Stopping funds-trackon development environment..."

echo ""
echo "TIP: If you have unsaved data changes, snapshot the DB first:"
echo "     ./docker_setup.sh --snapshot"
echo ""

# Stop and remove containers, networks
docker compose down

# Optional: Remove volumes (uncomment if you want to reset data)
# docker compose down -v

echo "Services stopped."
echo ""
echo "To start again: ./docker_setup.sh"