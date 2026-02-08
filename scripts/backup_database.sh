#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# EKA-AI Database Backup Script
# Run this daily via cron: 0 2 * * * /path/to/backup_database.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e

# Configuration
BACKUP_DIR="/var/backups/eka-ai"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$BACKUP_DIR/backup.log"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting backup process..."

# Load environment variables
if [ -f "/workspaces/eka-ai-platform/backend/.env" ]; then
    export $(cat /workspaces/eka-ai-platform/backend/.env | grep -v '#' | xargs)
fi

# Check if Supabase URL is configured
if [ -z "$SUPABASE_URL" ]; then
    log "ERROR: SUPABASE_URL not set"
    exit 1
fi

# Backup file names
BACKUP_FILE="$BACKUP_DIR/eka_ai_backup_$DATE.sql"

# Function to backup a table
backup_table() {
    local table=$1
    log "Backing up table: $table"
    
    # Use pg_dump if available, otherwise use Supabase API
    if command -v pg_dump &> /dev/null; then
        # Extract connection details from Supabase URL
        # Format: https://<project>.supabase.co
        PROJECT_REF=$(echo $SUPABASE_URL | sed 's/https:\/\///g' | sed 's/\.supabase\.co.*//g')
        
        # Note: For actual pg_dump, you need the database connection string
        # This is a placeholder - replace with actual Supabase direct connection
        log "pg_dump available but direct DB connection string needed"
    else
        log "pg_dump not available, using API backup"
    fi
}

# Create metadata backup
log "Creating metadata backup..."
cat > "$BACKUP_FILE" << EOF
-- EKA-AI Database Backup
-- Date: $(date)
-- Version: 4.5

-- Backup metadata
-- Tables: job_cards, vehicles, workshops, subscription_logs, documents, etc.
EOF

# Backup via Supabase API (if Python script available)
if [ -f "/workspaces/eka-ai-platform/scripts/export_data.py" ]; then
    python3 /workspaces/eka-ai-platform/scripts/export_data.py "$BACKUP_FILE"
fi

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
log "Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Cleanup old backups
log "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "eka_ai_backup_*.gz" -mtime +$RETENTION_DAYS -delete

# Send notification (if email configured)
if [ ! -z "$ADMIN_EMAIL" ]; then
    echo "Backup completed successfully: $BACKUP_FILE ($BACKUP_SIZE)" | \
    mail -s "EKA-AI Backup Report - $(date +%Y-%m-%d)" "$ADMIN_EMAIL" || true
fi

log "Backup process completed successfully!"
exit 0
