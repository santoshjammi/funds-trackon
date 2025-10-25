# Data Migration Guide for Funds-Trackon

This guide explains how to migrate all your existing data into the embedded MongoDB container for the Funds-Trackon Lead Management System.

## 📊 Data Overview

Your system supports the following data types from your existing JSON/CSV files:

### Core Data Files
- **`rearrangedContacts.json`** - Contact information with organizations, roles, and details
- **`people.json`** - Additional contact data (merged with rearrangedContacts)
- **`summary_FR.json`** - Fundraising campaign tracking and investment data
- **`users.json`** - Team member information and roles
- **`opportunity.json`** - Business opportunities and pipeline data
- **`tasks.json`** - Activity tracking and follow-ups
- **`tracker.json`** - Miscellaneous tracking data

## 🚀 Quick Migration (Recommended)

### Prerequisites
1. **Docker containers running**: Start your services first
   ```bash
   ./start.sh
   ```

2. **Data files present**: Ensure all JSON files are in the `data/` directory

### Run Migration
```bash
# Make the script executable (first time only)
chmod +x migrate_data.sh

# Run the complete migration
./migrate_data.sh
```

This script will:
- ✅ Check for running MongoDB container
- ✅ Verify data files exist
- ✅ Clear existing data (optional)
- ✅ Import all data types
- ✅ Show migration summary

## 🔧 Manual Migration Steps

If you prefer to run migration manually or need more control:

### 1. Start Services
```bash
# Start Docker containers
./start.sh

# Or manually:
docker compose up -d
```

### 2. Activate Python Environment
```bash
cd backend
source venv/bin/activate
```

### 3. Run Data Import
```bash
# Import all data (with clearing existing data)
python scripts/import_data.py --clear

# Or import without clearing (append to existing data)
python scripts/import_data.py
```

### 4. Verify Import
Check the import summary output for:
- ✅ Records imported per data type
- ✅ Any errors or skipped records
- ✅ Total migration statistics

## 📈 Data Mapping Details

### Contacts
- **Source**: `rearrangedContacts.json` + `people.json`
- **Fields**: Name, organization, designation, email, phone, geography, category
- **Processing**: Merges duplicate contacts, cleans data, validates emails

### Fundraising Campaigns
- **Source**: `summary_FR.json`
- **Fields**: Organization, status, amounts, investor types, process tracking
- **Processing**: Maps status enums, converts timestamps, handles financial data

### Users
- **Source**: `users.json`
- **Fields**: Name, email, organization, designation, employment type
- **Processing**: Creates role assignments, generates placeholder passwords

### Opportunities
- **Source**: `opportunity.json`
- **Fields**: Target, priority, status, estimated values
- **Processing**: Maps priority/status enums, extracts values from notes

### Tasks
- **Source**: `tasks.json`
- **Fields**: Task name, type, status, dates, notes
- **Processing**: Maps task types, converts timestamps, handles completion status

### Organizations
- **Source**: Extracted from contact data
- **Fields**: Name, industry (inferred), status
- **Processing**: Deduplicates organizations, infers industry types

## 🗄️ MongoDB Container Details

After migration, your data is stored in:
- **Container**: `niveshya-mongo`
- **Database**: `funds_trackon`
- **External Port**: `27019`
- **Internal URL**: `mongodb://mongo:27017/funds_trackon`

### Direct MongoDB Access
```bash
# Connect to MongoDB container
docker exec -it niveshya-mongo mongosh

# Switch to database
use funds_trackon

# List collections
show collections

# Count documents in a collection
db.contacts.countDocuments()
```

## 🔍 Troubleshooting

### Common Issues

**"MongoDB container not running"**
```bash
# Check container status
docker ps | grep mongo

# Start containers
./start.sh
```

**"Data files not found"**
```bash
# Check data directory
ls -la data/

# Ensure files exist
ls data/*.json
```

**"Import errors"**
- Check the error messages in the output
- Review data file formats
- Some records may be skipped due to missing required fields

**"Permission denied"**
```bash
# Make scripts executable
chmod +x migrate_data.sh
chmod +x start.sh
```

### Verification Steps

1. **Check import logs** for any errors
2. **Start backend** and check for connection errors
3. **Access UI** and verify data appears
4. **Test CRUD operations** on imported data

## 📋 Migration Checklist

- [ ] Docker containers running (`./start.sh`)
- [ ] Data files present in `data/` directory
- [ ] Python virtual environment activated
- [ ] Migration script executed successfully
- [ ] Backend starts without errors
- [ ] Frontend loads and shows data
- [ ] Knowledge Base accessible via "📚 Knowledge Base" button

## 🎯 Next Steps

After successful migration:

1. **Start your application**:
   ```bash
   # Backend (in one terminal)
   cd backend && python main.py

   # Frontend (in another terminal)
   cd frontend && npm start
   ```

2. **Access the Knowledge Base**:
   - Open http://localhost:3000
   - Click "📚 Knowledge Base" in the sidebar
   - Upload documents and manage your data

3. **User Management**:
   - Imported users have placeholder passwords
   - Users should reset passwords on first login

## 🔄 Re-running Migration

To re-run migration (e.g., with updated data):

```bash
# Stop services first
./stop.sh

# Update your data files in data/ directory

# Restart and migrate
./start.sh
./migrate_data.sh
```

**Note**: The migration script includes `--clear` flag by default, which removes existing data before importing. Remove this flag if you want to append data instead.

## 📞 Support

If you encounter issues:
1. Check the migration output for error details
2. Verify data file formats match expected structure
3. Ensure Docker containers are healthy
4. Review MongoDB logs: `docker logs niveshya-mongo`