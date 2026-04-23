#!/bin/bash

# Start script for funds-trackon — runs natively without Docker.
# Requirements: MongoDB running locally, backend venv, frontend node_modules.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Ports ──────────────────────────────────────────────────────────
BACKEND_PORT="${BACKEND_PORT:-8001}"
FRONTEND_PORT="${FRONTEND_PORT:-3002}"
MONGO_URL="mongodb://localhost:27017/trackon_lead_management"

# ── Helpers ────────────────────────────────────────────────────────
kill_port() {
  local pid
  pid=$(lsof -ti :"$1" 2>/dev/null || true)
  [ -n "$pid" ] && kill "$pid" 2>/dev/null || true
}

wait_for_port() {
  local port=$1 label=$2 retries=20
  while ! nc -z localhost "$port" 2>/dev/null; do
    retries=$((retries - 1))
    [ "$retries" -eq 0 ] && echo "  ✗ $label did not start on port $port" && return 1
    sleep 0.5
  done
  echo "  ✓ $label ready on port $port"
}

# ── Cleanup on exit ────────────────────────────────────────────────
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Stopping services..."
  [ -n "$BACKEND_PID" ]  && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  wait 2>/dev/null
  echo "Done."
}
trap cleanup INT TERM

# ── MongoDB check ──────────────────────────────────────────────────
echo "🗄️  Checking MongoDB..."
if ! nc -z localhost 27017 2>/dev/null; then
  echo "  ✗ MongoDB is not running on localhost:27017"
  echo "  Start it with: brew services start mongodb-community"
  exit 1
fi
echo "  ✓ MongoDB running on localhost:27017"

# ── Backend ────────────────────────────────────────────────────────
echo ""
echo "🔧 Starting backend on port $BACKEND_PORT..."
kill_port "$BACKEND_PORT"

cd "$ROOT_DIR/backend"
source ./venv/bin/activate

MONGODB_URL="$MONGO_URL" \
PORT="$BACKEND_PORT" \
  python3 main.py > /tmp/funds-trackon-backend.log 2>&1 &
BACKEND_PID=$!

wait_for_port "$BACKEND_PORT" "Backend"

# ── Frontend ───────────────────────────────────────────────────────
echo ""
echo "🌐 Starting frontend on port $FRONTEND_PORT..."
kill_port "$FRONTEND_PORT"

cd "$ROOT_DIR/frontend"

PORT="$FRONTEND_PORT" \
REACT_APP_API_BASE_URL="" \
  npm start > /tmp/funds-trackon-frontend.log 2>&1 &
FRONTEND_PID=$!

wait_for_port "$FRONTEND_PORT" "Frontend"

# ── Done ───────────────────────────────────────────────────────────
echo ""
echo "✅ All services running!"
echo ""
echo "  Frontend  →  http://localhost:${FRONTEND_PORT}"
echo "  Backend   →  http://localhost:${BACKEND_PORT}/docs"
echo "  MongoDB   →  localhost:27017"
echo ""
echo "Logs: /tmp/funds-trackon-backend.log  /tmp/funds-trackon-frontend.log"
echo "Press Ctrl+C to stop all services."
echo ""

wait
