#!/bin/bash
# migrate_data.sh — Import source JSON files into MongoDB for Funds-Trackon.
#
# SAFETY: before any destructive --clear, the live database is automatically
# exported to data/exports/<timestamp>/ so no data is ever lost.
#
# Usage:
#   ./migrate_data.sh                   # auto-backup then --clear import (default)
#   ./migrate_data.sh --no-clear        # append only, no backup needed
#   ./migrate_data.sh --docker          # use Docker MongoDB instead of native
#   ./migrate_data.sh --skip-backup     # skip the safety export (use with care)

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# ── Argument parsing ───────────────────────────────────────────────
DOCKER_MODE=false
NO_CLEAR=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --docker)       DOCKER_MODE=true;  shift ;;
    --no-clear)     NO_CLEAR=true;     shift ;;
    --skip-backup)  SKIP_BACKUP=true;  shift ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

echo "🚀 Starting Funds-Trackon Data Migration"
echo "========================================"
echo ""

# ── MongoDB check ──────────────────────────────────────────────────
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
    echo "   Or pass --docker to target the Docker container."
    exit 1
  fi
  echo "✅ MongoDB running on localhost:27017."
fi

# ── Python venv check ─────────────────────────────────────────────
if [ ! -d "backend/venv" ]; then
  echo "❌ Python virtual environment not found at backend/venv."
  echo "   Run: cd backend && python -m venv venv && pip install -r requirements.txt"
  exit 1
fi

# ── Source data file check ─────────────────────────────────────────
if [ ! -d "data" ]; then
  echo "❌ data/ directory not found."
  exit 1
fi

echo ""
echo "📁 Checking source data files..."
DATA_FILES=(
  "rearrangedContacts.json"
  "people.json"
  "summary_FR.json"
  "users.json"
  "opportunity.json"
  "tasks.json"
  "tracker.json"
)

MISSING_FILES=()
for file in "${DATA_FILES[@]}"; do
  if [ ! -f "data/$file" ]; then
    MISSING_FILES+=("$file")
  else
    echo "   ✅ Found: $file"
  fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
  echo ""
  echo "⚠️  Missing source files (will be skipped):"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
fi

# ── Safety export ──────────────────────────────────────────────────
if [ "$NO_CLEAR" = false ] && [ "$SKIP_BACKUP" = false ]; then
  echo ""
  echo "🛡️  Safety export — backing up live database before clearing..."
  DOCKER_FLAG=""
  [ "$DOCKER_MODE" = true ] && DOCKER_FLAG="--docker"
  bash "$ROOT_DIR/export_data.sh" $DOCKER_FLAG
  echo ""
  echo "✅ Backup complete. Proceeding with import."
fi

# ── Run import ─────────────────────────────────────────────────────
echo ""
echo "📊 Running data import..."
source backend/venv/bin/activate
cd backend

IMPORT_ARGS=()
[ "$NO_CLEAR" = false ] && IMPORT_ARGS+=(--clear)

python scripts/import_data.py "${IMPORT_ARGS[@]}"

echo ""
echo "✅ Data migration completed!"
echo ""
echo "🌐 Your data is now available in MongoDB."
echo "   Backup location: data/exports/latest/"
echo ""
echo "🚀 Start your application:"
echo "   Docker:  ./start.sh"
echo "   Native:  ./start-native.sh"