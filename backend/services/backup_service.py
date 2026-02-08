"""
services/backup_service.py
Automated database backup service with S3-compatible storage.
Supports AWS S3, Backblaze B2, DigitalOcean Spaces, and MinIO.
"""
import os
import logging
import gzip
import tempfile
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)

# Try to import boto3
try:
    import boto3
    from botocore.exceptions import ClientError, BotoCoreError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    logger.warning("boto3 not available. S3 backups disabled.")


class BackupService:
    """
    Service for automated database backups to S3-compatible storage.
    """
    
    def __init__(self):
        """Initialize backup service with S3 credentials."""
        self.s3_client = None
        self.bucket_name = os.getenv('BACKUP_BUCKET_NAME', 'eka-ai-backups')
        self.enabled = False
        
        if not BOTO3_AVAILABLE:
            logger.warning("⚠️ boto3 not installed. Backups disabled.")
            return
            
        self._init_s3_client()
    
    def _init_s3_client(self):
        """Initialize S3 client with credentials."""
        try:
            # Configuration for S3-compatible services
            endpoint_url = os.getenv('BACKUP_ENDPOINT_URL')  # For B2, Spaces, MinIO
            region = os.getenv('BACKUP_REGION', 'us-east-1')
            access_key = os.getenv('BACKUP_ACCESS_KEY')
            secret_key = os.getenv('BACKUP_SECRET_KEY')
            
            if not access_key or not secret_key:
                logger.warning("⚠️ S3 credentials not configured. Set BACKUP_ACCESS_KEY and BACKUP_SECRET_KEY.")
                return
            
            # Create S3 client
            config = {
                'service_name': 's3',
                'aws_access_key_id': access_key,
                'aws_secret_access_key': secret_key,
                'region_name': region,
            }
            
            # Add endpoint for non-AWS services
            if endpoint_url:
                config['endpoint_url'] = endpoint_url
            
            self.s3_client = boto3.client(**config)
            self.enabled = True
            
            logger.info(f"✅ Backup service initialized (bucket: {self.bucket_name})")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize S3 client: {e}")
            self.s3_client = None
    
    def perform_backup(self, database_url: Optional[str] = None) -> Dict:
        """
        Perform database backup and upload to S3.
        
        Args:
            database_url: PostgreSQL connection URL (defaults to env var)
            
        Returns:
            Dict with backup metadata
        """
        if not self.enabled:
            logger.warning("⚠️ Backup service not enabled")
            return {'success': False, 'error': 'Backup service not enabled'}
        
        db_url = database_url or os.getenv('DB_DIRECT_URL') or os.getenv('SUPABASE_URL')
        if not db_url:
            return {'success': False, 'error': 'No database URL configured'}
        
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"eka-ai-backup_{timestamp}.sql.gz"
        
        try:
            # Create temporary backup file
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.sql.gz', delete=False) as tmp:
                tmp_path = tmp.name
            
            # Perform pg_dump (requires pg_dump binary)
            import subprocess
            
            # Extract connection details from URL
            # Handle both direct Postgres URLs and Supabase URLs
            if 'supabase.co' in db_url:
                # Use Supabase connection pooling or direct connection
                # For Supabase, we need the direct connection string
                db_url = os.getenv('DB_DIRECT_URL', db_url)
            
            # Run pg_dump with compression
            logger.info(f"🚀 Starting database backup: {filename}")
            
            cmd = [
                'pg_dump',
                '--dbname=' + db_url,
                '--format=plain',
                '--verbose',
                '--no-owner',
                '--no-acl',
            ]
            
            # Execute pg_dump and pipe to gzip
            with gzip.open(tmp_path, 'wb') as gz:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                
                # Write compressed data
                while True:
                    chunk = process.stdout.read(8192)
                    if not chunk:
                        break
                    gz.write(chunk)
                
                # Check for errors
                stderr = process.stderr.read().decode('utf-8')
                process.wait()
                
                if process.returncode != 0:
                    raise Exception(f"pg_dump failed: {stderr}")
            
            # Get file size
            file_size = os.path.getsize(tmp_path)
            logger.info(f"📦 Backup file created: {file_size} bytes")
            
            # Upload to S3
            s3_key = f"backups/{filename}"
            
            with open(tmp_path, 'rb') as f:
                self.s3_client.upload_fileobj(
                    f,
                    self.bucket_name,
                    s3_key,
                    ExtraArgs={
                        'ContentType': 'application/gzip',
                        'Metadata': {
                            'backup-date': datetime.utcnow().isoformat(),
                            'backup-type': 'full',
                            'database': 'eka-ai-prod',
                        }
                    }
                )
            
            # Generate presigned URL for download (valid for 7 days)
            download_url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key,
                },
                ExpiresIn=604800  # 7 days
            )
            
            logger.info(f"✅ Backup uploaded to S3: {s3_key}")
            
            # Cleanup local file
            os.unlink(tmp_path)
            
            # Cleanup old backups (keep last 30 days)
            self._cleanup_old_backups()
            
            return {
                'success': True,
                'filename': filename,
                's3_key': s3_key,
                'size_bytes': file_size,
                'download_url': download_url,
                'timestamp': datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"❌ Backup failed: {e}")
            # Cleanup on failure
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.unlink(tmp_path)
            
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat(),
            }
    
    def _cleanup_old_backups(self, retention_days: int = 30):
        """
        Delete backups older than retention period.
        
        Args:
            retention_days: Number of days to keep backups
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
            
            # List all backups
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='backups/'
            )
            
            if 'Contents' not in response:
                return
            
            deleted_count = 0
            for obj in response['Contents']:
                if obj['LastModified'] < cutoff_date:
                    self.s3_client.delete_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    deleted_count += 1
            
            if deleted_count > 0:
                logger.info(f"🧹 Cleaned up {deleted_count} old backups")
                
        except Exception as e:
            logger.warning(f"⚠️ Failed to cleanup old backups: {e}")
    
    def list_backups(self, limit: int = 10) -> List[Dict]:
        """
        List available backups.
        
        Args:
            limit: Maximum number of backups to return
            
        Returns:
            List of backup metadata
        """
        if not self.enabled:
            return []
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix='backups/',
                MaxKeys=limit
            )
            
            if 'Contents' not in response:
                return []
            
            backups = []
            for obj in sorted(response['Contents'], key=lambda x: x['LastModified'], reverse=True):
                backups.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'filename': Path(obj['Key']).name,
                })
            
            return backups
            
        except Exception as e:
            logger.error(f"❌ Failed to list backups: {e}")
            return []
    
    def restore_backup(self, backup_key: str, target_db_url: Optional[str] = None) -> Dict:
        """
        Restore database from backup.
        
        WARNING: This will overwrite the target database!
        
        Args:
            backup_key: S3 key of the backup file
            target_db_url: Target database URL (defaults to main DB)
            
        Returns:
            Dict with restore status
        """
        if not self.enabled:
            return {'success': False, 'error': 'Backup service not enabled'}
        
        target_url = target_db_url or os.getenv('DB_DIRECT_URL')
        if not target_url:
            return {'success': False, 'error': 'No target database URL'}
        
        try:
            logger.info(f"🚀 Starting restore from: {backup_key}")
            
            # Download backup
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.sql.gz', delete=False) as tmp:
                tmp_path = tmp.name
                self.s3_client.download_fileobj(
                    self.bucket_name,
                    backup_key,
                    tmp
                )
            
            # Decompress and restore
            import subprocess
            
            with gzip.open(tmp_path, 'rb') as gz:
                process = subprocess.Popen(
                    ['psql', target_url],
                    stdin=gz,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                )
                stdout, stderr = process.communicate()
                
                if process.returncode != 0:
                    raise Exception(f"psql restore failed: {stderr.decode('utf-8')}")
            
            # Cleanup
            os.unlink(tmp_path)
            
            logger.info(f"✅ Restore completed from: {backup_key}")
            
            return {
                'success': True,
                'restored_from': backup_key,
                'timestamp': datetime.utcnow().isoformat(),
            }
            
        except Exception as e:
            logger.error(f"❌ Restore failed: {e}")
            if 'tmp_path' in locals() and os.path.exists(tmp_path):
                os.unlink(tmp_path)
            
            return {
                'success': False,
                'error': str(e),
            }


# Singleton instance
backup_service = BackupService()


def perform_backup() -> Dict:
    """Convenience function to perform backup."""
    return backup_service.perform_backup()


def list_backups(limit: int = 10) -> List[Dict]:
    """Convenience function to list backups."""
    return backup_service.list_backups(limit)
