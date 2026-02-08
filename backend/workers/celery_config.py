"""
EKA-AI Platform: Celery Configuration for Async Workers
Handles RBI notifications, PDF generation, and compliance jobs.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Initialize Celery app
celery_app = Celery(
    'eka_ai',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    include=['workers.tasks']
)

# Celery configuration
celery_app.conf.update(
    # Task serialization
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Asia/Kolkata',  # India timezone
    enable_utc=True,
    
    # Task execution
    task_always_eager=False,  # Don't run tasks synchronously
    task_store_eager_result=False,
    task_ignore_result=False,
    
    # Rate limiting
    task_default_rate_limit='100/m',
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    
    # Result backend
    result_expires=3600,  # 1 hour
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        # RBI E-Mandate: Pre-debit notifications (runs daily at 9 AM)
        'rbi-pre-debit-notifications': {
            'task': 'workers.tasks.send_pre_debit_notifications',
            'schedule': crontab(hour=9, minute=0),
        },
        
        # Daily backups
        'daily-backup': {
            'task': 'workers.tasks.perform_daily_backup',
            'schedule': crontab(hour=2, minute=0),  # 2 AM daily
        },
        
        # Cache cleanup
        'cache-cleanup': {
            'task': 'workers.tasks.cleanup_old_cache',
            'schedule': crontab(hour=0, minute=0),  # Midnight
        },
        
        # Audit log rotation
        'audit-log-rotation': {
            'task': 'workers.tasks.rotate_audit_logs',
            'schedule': crontab(hour=3, minute=0, day_of_week='sunday'),
        },
    }
)


def init_celery(app):
    """Initialize Celery with Flask app context"""
    celery_app.conf.update(app.config)
    
    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)
    
    celery_app.Task = ContextTask
    return celery_app
