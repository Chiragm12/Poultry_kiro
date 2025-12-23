#!/bin/bash

# Database Backup Script for Poultry Farm SaaS

set -e

# Configuration
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="poultry_farm_backup_${DATE}.sql"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️ Starting database backup..."

# Extract database connection details from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

# Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASSWORD="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Invalid DATABASE_URL format"
    exit 1
fi

# Set password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Create backup
echo "📦 Creating backup: $BACKUP_FILE"
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --no-owner --no-privileges \
    > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
echo "🗜️ Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Upload to cloud storage (optional)
if [ -n "$AWS_S3_BUCKET" ]; then
    echo "☁️ Uploading backup to S3..."
    aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$AWS_S3_BUCKET/backups/$COMPRESSED_FILE"
fi

# Clean up old backups
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "poultry_farm_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📁 File: $BACKUP_DIR/$COMPRESSED_FILE"
echo "📏 Size: $BACKUP_SIZE"

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"💾 Database backup completed successfully! Size: $BACKUP_SIZE\"}" \
        "$SLACK_WEBHOOK_URL"
fi

# Unset password
unset PGPASSWORD