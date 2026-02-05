# EKA-AI Database Backup & Recovery

## Supabase Automated Backups

### 1. Supabase Dashboard Configuration

**Daily Backups (Pro Plan):**
1. Go to Supabase Dashboard → Project Settings → Database
2. Enable "Daily Backups"
3. Set backup time: `03:00 UTC` (low traffic period)
4. Retention: 7 days (default) or 30 days (recommended)

**Point-in-Time Recovery (PITR):**
1. Enable PITR in Database settings
2. Cost: ~$0.10 per GB/month
3. Recovery granularity: 1 second

### 2. Manual Backup Script

```bash
#!/bin/bash
# /opt/eka-ai/scripts/supabase-backup.sh

# Configuration
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_KEY="your-service-key"
BACKUP_DIR="/opt/eka-ai/backups"
S3_BUCKET="eka-ai-backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump schema and data
echo "Starting backup at $DATE..."

# Schema only
pg_dump \
    --schema-only \
    --dbname="$SUPABASE_URL/postgres" \
    --username="postgres" \
    --host="db.your-project.supabase.co" \
    --port=5432 \
    --file="$BACKUP_DIR/schema_$DATE.sql"

# Data only (exclude large tables if needed)
pg_dump \
    --data-only \
    --dbname="$SUPABASE_URL/postgres" \
    --username="postgres" \
    --host="db.your-project.supabase.co" \
    --port=5432 \
    --file="$BACKUP_DIR/data_$DATE.sql" \
    --table="vehicles" \
    --table="job_cards" \
    --table="invoices" \
    --table="mg_contracts" \
    --table="mg_vehicle_logs"

# Compress
zip -r "$BACKUP_DIR/backup_$DATE.zip" "$BACKUP_DIR/schema_$DATE.sql" "$BACKUP_DIR/data_$DATE.sql"
rm "$BACKUP_DIR/schema_$DATE.sql" "$BACKUP_DIR/data_$DATE.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.zip" "s3://$S3_BUCKET/database/"

# Clean old backups
find $BACKUP_DIR -name "backup_*.zip" -mtime +$RETENTION_DAYS -delete
aws s3 ls "s3://$S3_BUCKET/database/" | awk '{print $4}' | while read file; do
    FILE_DATE=$(echo $file | grep -oP '\d{8}')
    CURRENT_DATE=$(date +%Y%m%d)
    AGE=$(( (CURRENT_DATE - FILE_DATE) ))
    if [ $AGE -gt $RETENTION_DAYS ]; then
        aws s3 rm "s3://$S3_BUCKET/database/$file"
    fi
done

echo "Backup completed: backup_$DATE.zip"
```

Make executable:
```bash
chmod +x /opt/eka-ai/scripts/supabase-backup.sh
```

### 3. Cron Schedule

```bash
# Edit crontab
sudo crontab -e

# Daily backup at 3 AM
0 3 * * * /opt/eka-ai/scripts/supabase-backup.sh >> /var/log/eka-ai-backup.log 2>&1

# Weekly full backup (Sundays)
0 2 * * 0 /opt/eka-ai/scripts/supabase-backup.sh full >> /var/log/eka-ai-backup-weekly.log 2>&1
```

### 4. Automated Supabase Backup with pg_dump

```python
#!/usr/bin/env python3
# /opt/eka-ai/scripts/supabase_backup.py

import os
import sys
import subprocess
import boto3
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
SUPABASE_DB_URL = os.getenv('SUPABASE_DB_URL')
AWS_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
S3_BUCKET = 'eka-ai-backups'
BACKUP_RETENTION_DAYS = 30

def create_backup():
    """Create database backup using pg_dump."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'/tmp/eka_ai_backup_{timestamp}.sql'
    
    try:
        # Run pg_dump
        result = subprocess.run([
            'pg_dump',
            '--dbname', SUPABASE_DB_URL,
            '--file', backup_file,
            '--verbose',
            '--no-owner',
            '--no-privileges'
        ], capture_output=True, text=True, check=True)
        
        print(f"Backup created: {backup_file}")
        return backup_file
        
    except subprocess.CalledProcessError as e:
        print(f"Backup failed: {e.stderr}")
        sys.exit(1)

def compress_backup(backup_file):
    """Compress backup file."""
    compressed_file = f"{backup_file}.gz"
    
    subprocess.run([
        'gzip', '-c', backup_file
    ], stdout=open(compressed_file, 'wb'), check=True)
    
    os.remove(backup_file)
    print(f"Compressed: {compressed_file}")
    return compressed_file

def upload_to_s3(file_path):
    """Upload backup to S3."""
    s3 = boto3.client('s3')
    filename = os.path.basename(file_path)
    s3_key = f'database/backups/{filename}'
    
    try:
        s3.upload_file(file_path, S3_BUCKET, s3_key)
        print(f"Uploaded to S3: s3://{S3_BUCKET}/{s3_key}")
        
        # Clean up local file
        os.remove(file_path)
        
        return s3_key
        
    except Exception as e:
        print(f"Upload failed: {e}")
        sys.exit(1)

def cleanup_old_backups():
    """Remove backups older than retention period."""
    s3 = boto3.client('s3')
    cutoff_date = datetime.now() - timedelta(days=BACKUP_RETENTION_DAYS)
    
    try:
        response = s3.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix='database/backups/'
        )
        
        for obj in response.get('Contents', []):
            if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
                s3.delete_object(Bucket=S3_BUCKET, Key=obj['Key'])
                print(f"Deleted old backup: {obj['Key']}")
                
    except Exception as e:
        print(f"Cleanup failed: {e}")

def verify_backup(s3_key):
    """Verify backup integrity."""
    s3 = boto3.client('s3')
    
    try:
        response = s3.head_object(Bucket=S3_BUCKET, Key=s3_key)
        size_mb = response['ContentLength'] / (1024 * 1024)
        
        if size_mb < 1:  # Less than 1MB is suspicious
            print(f"WARNING: Backup size is only {size_mb:.2f} MB")
            return False
            
        print(f"Backup verified: {size_mb:.2f} MB")
        return True
        
    except Exception as e:
        print(f"Verification failed: {e}")
        return False

def main():
    print(f"Starting backup at {datetime.now()}")
    
    # Create backup
    backup_file = create_backup()
    
    # Compress
    compressed_file = compress_backup(backup_file)
    
    # Upload
    s3_key = upload_to_s3(compressed_file)
    
    # Verify
    if verify_backup(s3_key):
        # Cleanup old backups only if new backup is valid
        cleanup_old_backups()
        print("Backup completed successfully")
    else:
        print("Backup verification failed - keeping old backups")
        sys.exit(1)

if __name__ == '__main__':
    main()
```

### 5. Recovery Procedures

```bash
#!/bin/bash
# /opt/eka-ai/scripts/restore.sh

# Usage: ./restore.sh s3://bucket/backup/file.sql.gz

BACKUP_URL=$1
TEMP_DIR="/tmp/restore_$(date +%s)"
SUPABASE_DB_URL=$SUPABASE_DB_URL

if [ -z "$BACKUP_URL" ]; then
    echo "Usage: $0 <s3_backup_url>"
    exit 1
fi

mkdir -p $TEMP_DIR

echo "Downloading backup..."
aws s3 cp "$BACKUP_URL" "$TEMP_DIR/backup.sql.gz"

echo "Decompressing..."
gunzip "$TEMP_DIR/backup.sql.gz"

echo "Restoring database..."
psql "$SUPABASE_DB_URL" < "$TEMP_DIR/backup.sql"

echo "Cleaning up..."
rm -rf $TEMP_DIR

echo "Restore completed"
```

### 6. Disaster Recovery Plan

```yaml
# disaster-recovery.yml
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 24 hours

Recovery Steps:
  1. Assess damage and identify failure point
  2. Notify stakeholders (within 30 minutes)
  3. Retrieve latest backup from S3
  4. Create new Supabase project (if needed)
  5. Restore database schema
  6. Restore database data
  7. Verify data integrity
  8. Update application connection strings
  9. Run smoke tests
  10. Resume operations

Backup Locations:
  Primary: Supabase Daily Backups
  Secondary: S3 (eka-ai-backups)
  Tertiary: Local NAS (if applicable)

Contact List:
  - CTO: cto@go4garage.in
  - DevOps: devops@go4garage.in
  - Supabase Support: support@supabase.io
```

### 7. Backup Monitoring

```python
#!/usr/bin/env python3
# backup_monitor.py

import boto3
from datetime import datetime, timedelta
import smtplib
from email.mime.text import MimeText

S3_BUCKET = 'eka-ai-backups'
ALERT_EMAIL = 'admin@go4garage.in'
MAX_BACKUP_AGE_HOURS = 26  # Alert if no backup in last 26 hours

def check_backup_status():
    s3 = boto3.client('s3')
    
    # List recent backups
    response = s3.list_objects_v2(
        Bucket=S3_BUCKET,
        Prefix='database/backups/'
    )
    
    if not response.get('Contents'):
        return False, "No backups found"
    
    # Get most recent backup
    latest = max(response['Contents'], key=lambda x: x['LastModified'])
    age_hours = (datetime.now(latest['LastModified'].tzinfo) - latest['LastModified']).total_seconds() / 3600
    
    if age_hours > MAX_BACKUP_AGE_HOURS:
        return False, f"Latest backup is {age_hours:.1f} hours old"
    
    return True, f"Latest backup: {latest['Key']} ({age_hours:.1f} hours old)"

def send_alert(message):
    msg = MimeText(message)
    msg['Subject'] = 'EKA-AI Backup Alert'
    msg['From'] = 'alerts@go4garage.in'
    msg['To'] = ALERT_EMAIL
    
    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('alerts@go4garage.in', 'app-password')
        server.send_message(msg)

if __name__ == '__main__':
    success, message = check_backup_status()
    if not success:
        send_alert(f"BACKUP ALERT: {message}")
        print(f"ALERT SENT: {message}")
    else:
        print(f"OK: {message}")
```

### 8. Cron for Monitoring

```bash
# Check backup status every 6 hours
0 */6 * * * /usr/bin/python3 /opt/eka-ai/scripts/backup_monitor.py >> /var/log/backup-monitor.log 2>&1
```
