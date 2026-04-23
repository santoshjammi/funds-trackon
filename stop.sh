#!/bin/bash

# Stop script — kills backend and frontend processes started by start.sh

echo "Stopping funds-trackon services..."

kill_port() {
  local pid
  pid=$(lsof -ti :"$1" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null && echo "  ✓ Stopped process on port $1" || true
  else
    echo "  – Nothing running on port $1"
  fi
}

kill_port 8001
kill_port 3002
kill_port 3000

echo "Done."
