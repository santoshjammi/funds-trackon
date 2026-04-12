#!/bin/bash
# Restore seed data on first start.
# MongoDB only runs scripts in /docker-entrypoint-initdb.d on a fresh (empty) volume.
# This script is therefore idempotent by nature — it only ever runs once per volume.

ARCHIVE=/docker-entrypoint-initdb.d/trackon_lead_management.archive
DB_NAME=trackon_lead_management

if [ ! -f "$ARCHIVE" ]; then
    echo "⚠️  Seed archive not found at $ARCHIVE — skipping restore."
    exit 0
fi

echo "📦 Restoring seed data into '$DB_NAME' from archive..."
mongorestore \
    --db "$DB_NAME" \
    --archive="$ARCHIVE" \
    --drop

echo "✅ Seed data restored successfully into '$DB_NAME'."
