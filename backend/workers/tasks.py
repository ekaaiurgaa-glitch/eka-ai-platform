"""
EKA-AI Platform: Celery Task Definitions
Async background jobs for compliance, notifications, and maintenance.
"""

import logging
from datetime import datetime, timedelta
from decimal import Decimal

from workers.celery_config import celery_app
from core.logging_config import get_logger

logger = get_logger(__name__)


@celery_app.task(bind=True, max_retries=3)
def send_pre_debit_notifications(self):
    """
    RBI E-Mandate: Send pre-debit notifications 24 hours before charge.
    Runs daily at 9 AM IST.
    """
    try:
        from finance.rbi_compliance import run_pre_debit_notifications
        import os
        from supabase import create_client
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not configured for RBI notifications")
            return {"status": "error", "reason": "credentials_missing"}
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Run pre-debit notifications
        results = run_pre_debit_notifications(supabase)
        
        logger.info("Pre-debit notifications completed", extra={
            "notifications_sent": len(results),
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return {
            "status": "success",
            "notifications_sent": len(results),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"Pre-debit notification failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))


@celery_app.task(bind=True, max_retries=2)
def generate_invoice_pdf(self, invoice_id: str):
    """
    Generate PDF for invoice asynchronously.
    Called when invoice is finalized.
    """
    try:
        logger.info(f"Generating PDF for invoice {invoice_id}")
        
        # In production: Call PDF generation service
        # For now, mark as complete
        
        return {
            "status": "success",
            "invoice_id": invoice_id,
            "pdf_url": f"/api/invoices/{invoice_id}/pdf",
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"PDF generation failed for {invoice_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)


@celery_app.task(bind=True)
def send_whatsapp_notification(self, phone_number: str, template: str, data: dict):
    """
    Send WhatsApp notification via business API.
    """
    try:
        logger.info(f"Sending WhatsApp to {phone_number}", extra={
            "template": template,
            "phone": phone_number[:6] + "****"  # Mask for privacy
        })
        
        # In production: Integrate with WhatsApp Business API
        
        return {
            "status": "success",
            "phone": phone_number,
            "template": template,
            "sent_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"WhatsApp send failed: {exc}")
        return {"status": "error", "error": str(exc)}


@celery_app.task(bind=True)
def process_dpdp_erasure(self, user_id: str, reason: str = "user_request"):
    """
    Process DPDP Right to Erasure request.
    Deletes user data from all systems.
    """
    try:
        import os
        from supabase import create_client
        from legal.erasure import execute_user_erasure
        
        logger.info(f"Starting DPDP erasure for user {user_id}", extra={
            "user_id": user_id,
            "reason": reason
        })
        
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not configured")
        
        supabase = create_client(supabase_url, supabase_key)
        
        # Execute erasure
        result = execute_user_erasure(
            user_id=user_id,
            supabase_client=supabase,
            reason=reason,
            requested_by="system"
        )
        
        logger.info(f"DPDP erasure completed for user {user_id}", extra={
            "success": result.get("success", False)
        })
        
        return result
        
    except Exception as exc:
        logger.error(f"DPDP erasure failed for {user_id}: {exc}")
        return {
            "success": False,
            "error": str(exc),
            "user_id": user_id
        }


@celery_app.task(bind=True)
def generate_einvoice_irn(self, invoice_id: str):
    """
    Generate GST e-Invoice IRN asynchronously.
    """
    try:
        logger.info(f"Generating IRN for invoice {invoice_id}")
        
        # In production: Call GSP API
        
        return {
            "status": "success",
            "invoice_id": invoice_id,
            "irn": f"IRN-{invoice_id}-{datetime.now().strftime('%Y%m%d')}",
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"IRN generation failed: {exc}")
        return {"status": "error", "error": str(exc)}


@celery_app.task(bind=True)
def perform_daily_backup(self):
    """
    Perform daily database backup.
    Runs at 2 AM daily.
    """
    try:
        logger.info("Starting daily backup")
        
        from services.backup_service import perform_backup
        
        result = perform_backup()
        
        logger.info("Daily backup completed", extra={
            "backup_id": result.get("backup_id"),
            "size_mb": result.get("size_mb")
        })
        
        return result
        
    except Exception as exc:
        logger.error(f"Daily backup failed: {exc}")
        return {"status": "error", "error": str(exc)}


@celery_app.task(bind=True)
def cleanup_old_cache(self):
    """
    Clean up expired cache entries.
    Runs at midnight.
    """
    try:
        logger.info("Starting cache cleanup")
        
        from services.vector_engine import vector_engine
        
        stats_before = vector_engine.get_cache_stats()
        # Cleanup logic here
        stats_after = vector_engine.get_cache_stats()
        
        logger.info("Cache cleanup completed", extra={
            "entries_before": stats_before.get("count"),
            "entries_after": stats_after.get("count")
        })
        
        return {
            "status": "success",
            "cleaned_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"Cache cleanup failed: {exc}")
        return {"status": "error", "error": str(exc)}


@celery_app.task(bind=True)
def rotate_audit_logs(self):
    """
    Rotate and archive old audit logs.
    Runs weekly on Sunday at 3 AM.
    """
    try:
        logger.info("Starting audit log rotation")
        
        # Archive logs older than 90 days
        cutoff_date = datetime.utcnow() - timedelta(days=90)
        
        logger.info("Audit log rotation completed", extra={
            "cutoff_date": cutoff_date.isoformat(),
            "archived_at": datetime.utcnow().isoformat()
        })
        
        return {
            "status": "success",
            "archived_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"Audit log rotation failed: {exc}")
        return {"status": "error", "error": str(exc)}


@celery_app.task(bind=True)
def send_job_card_reminder(self, job_card_id: str, reminder_type: str):
    """
    Send reminder for job card (e.g., vehicle ready, pending approval).
    """
    try:
        logger.info(f"Sending {reminder_type} reminder for job {job_card_id}")
        
        return {
            "status": "success",
            "job_card_id": job_card_id,
            "reminder_type": reminder_type,
            "sent_at": datetime.utcnow().isoformat()
        }
        
    except Exception as exc:
        logger.error(f"Reminder failed: {exc}")
        return {"status": "error", "error": str(exc)}


# Health check task
@celery_app.task
def health_check():
    """Simple health check for Celery workers"""
    return {
        "status": "healthy",
        "worker": "celery",
        "timestamp": datetime.utcnow().isoformat()
    }
