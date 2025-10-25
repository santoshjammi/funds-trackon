#!/bin/bash

# Migration Status Checker for Funds-Trackon
# Checks the status of data migration into MongoDB

echo "🔍 Checking Funds-Trackon Data Migration Status"
echo "==============================================="

# Check if MongoDB container is running
if ! docker ps | grep -q "niveshya-mongo"; then
    echo "❌ MongoDB container is not running"
    echo "   Please start services first: ./start.sh"
    exit 1
fi

echo "✅ MongoDB container is running"

# Check database connection and collections
echo ""
echo "📊 Checking database collections..."

# Get collection counts
CONTACTS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.contacts.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
ORGANIZATIONS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.organizations.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
FUNDRAISING=$(docker exec niveshya-mongo mongosh --quiet --eval "db.fundraising.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
USERS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.users.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
OPPORTUNITIES=$(docker exec niveshya-mongo mongosh --quiet --eval "db.opportunities.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
TASKS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.tasks.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
TRACKERS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.tracker.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")
DOCUMENTS=$(docker exec niveshya-mongo mongosh --quiet --eval "db.documents.countDocuments()" trackon_lead_management 2>/dev/null || echo "0")

echo "   📞 Contacts: $CONTACTS"
echo "   🏢 Organizations: $ORGANIZATIONS"
echo "   💰 Fundraising: $FUNDRAISING"
echo "   👥 Users: $USERS"
echo "   🎯 Opportunities: $OPPORTUNITIES"
echo "   ✅ Tasks: $TASKS"
echo "   📋 Trackers: $TRACKERS"
echo "   📚 Documents: $DOCUMENTS"

# Calculate total
TOTAL=$((CONTACTS + ORGANIZATIONS + FUNDRAISING + USERS + OPPORTUNITIES + TASKS + TRACKERS + DOCUMENTS))

echo ""
echo "📈 Migration Summary:"
echo "   Total Records: $TOTAL"

if [ "$TOTAL" -gt 0 ]; then
    echo "✅ Data migration appears successful!"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Start backend: cd backend && python main.py"
    echo "   2. Start frontend: cd frontend && npm start"
    echo "   3. Access UI at http://localhost:3000"
    echo "   4. Click '📚 Knowledge Base' to manage documents"
else
    echo "⚠️  No data found in database"
    echo ""
    echo "🔄 Run migration:"
    echo "   ./migrate_data.sh"
fi

echo ""
echo "🗄️  Direct MongoDB access:"
echo "   docker exec -it niveshya-mongo mongosh trackon_lead_management"