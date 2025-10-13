#!/bin/bash

# Data Migration Script for Funds-Trackon
# Migrates all JSON/CSV data into the embedded MongoDB container

set -e

echo "🚀 Starting Funds-Trackon Data Migration"
echo "========================================"

# Check if Docker containers are running
if ! docker ps | grep -q "niveshya-mongo"; then
    echo "❌ MongoDB container is not running. Please start the services first:"
    echo "   ./start.sh"
    exit 1
fi

# Check if data directory exists
if [ ! -d "data" ]; then
    echo "❌ Data directory not found. Please ensure data files are in the 'data/' directory."
    exit 1
fi

echo "📁 Checking data files..."
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
    echo "⚠️  Missing data files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Continuing with available files..."
fi

echo ""
echo "🔧 Setting up Python environment..."

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Python virtual environment not found. Please run setup first."
    exit 1
fi

# Activate virtual environment and run migration
echo "📊 Running data import..."
cd backend
source venv/bin/activate

echo "🗑️  Clearing existing data (optional - remove --clear flag if you want to keep existing data)..."
python scripts/import_data.py --clear

echo ""
echo "✅ Data migration completed!"
echo ""
echo "🌐 Your data is now available in the MongoDB container."
echo "   - Container: niveshya-mongo"
echo "   - Database: funds_trackon"
echo "   - Port: 27019 (external)"
echo ""
echo "🚀 Start your application:"
echo "   Backend:  python main.py"
echo "   Frontend: cd ../frontend && npm start"
echo ""
echo "📚 Access the Knowledge Base in the UI via the '📚 Knowledge Base' button!"