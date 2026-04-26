#!/bin/bash
# export_data.sh — Export all MongoDB collections to dated JSON snapshots.
#
# Works with both native MongoDB (default) and a Docker-hosted container.
#
# Usage:
#   ./export_data.sh                        # export from native MongoDB
#   ./export_data.sh --docker               # export from Docker container
#   ./export_data.sh --out /custom/path     # custom output directory
#   ./export_data.sh --collections contacts,users
#
# Output lands in data/exports/<YYYYMMDD_HHMMSS>/ and a 'latest' symlink
# is updated to point to the newest snapshot.

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Defaults ───────────────────────────────────────────────────────
DOCKER_MODE=false
OUT_DIR=""
COLLECTIONS=""

# ── Argument parsing ───────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker)   DOCKER_MODE=true; shift ;;
    --out)      OUT_DIR="$2"; shift 2 ;;
    --collections) COLLECTIONS="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,15p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "📦 Funds-Trackon — Data Export"
echo "================================"
echo ""

# ── MongoDB connectivity check ─────────────────────────────────────
if [ "$DOCKER_MODE" = true ]; then
  if ! docker ps --format "{{.Names}}" 2>/dev/null | grep -q "niveshya-mongo"; then
    echo "❌ MongoDB Docker container 'niveshya-mongo' is not running."
    echo "   Start it with: ./start.sh"
    exit 1
  fi
  echo "✅ MongoDB Docker container detected."
else
  if ! nc -z localhost 27017 2>/dev/null; then
    echo "❌ MongoDB is not running on localhost:27017."
    echo "   Start with: brew services start mongodb-community"
    echo "   Or use --docker if running in Docker."
    exit 1
  fi
  echo "✅ MongoDB running on localhost:27017."
fi

# ── Python venv check ──────────────────────────────────────────────
if [ ! -d "backend/venv" ]; then
  echo "❌ Python virtual environment not found at backend/venv."
  echo "   Run: cd backend && python -m venv venv && pip install -r requirements.txt"
  exit 1
fi

echo ""
echo "🔧 Activating Python environment..."
source backend/venv/bin/activate

# ── Build python args ──────────────────────────────────────────────
ARGS=()
[ -n "$OUT_DIR" ]     && ARGS+=(--out "$OUT_DIR")
[ -n "$COLLECTIONS" ] && ARGS+=(--collections "$COLLECTIONS")

# ── Run export ─────────────────────────────────────────────────────
echo "📊 Running export..."
echo ""
cd backend
python scripts/export_data.py "${ARGS[@]}"
