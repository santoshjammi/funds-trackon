#!/bin/bash

# Start script for funds-trackon — uses Docker Compose.
# Requirements: Docker Desktop running.
# For native (no Docker) use: ./start-native.sh

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Docker check ───────────────────────────────────────────────────
if ! docker info > /dev/null 2>&1; then
  echo "  ✗ Docker is not running. Start Docker Desktop and try again."
  echo "  For native start (no Docker): ./start-native.sh"
  exit 1
fi
echo "  ✓ Docker running"

# ── Start ──────────────────────────────────────────────────────────
echo ""
echo "Starting all services with Docker Compose..."
docker compose up --build "$@"
