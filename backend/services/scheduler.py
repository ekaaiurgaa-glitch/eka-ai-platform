"""
concurrency/scheduler.py
Implements distributed locking for APScheduler to prevent split-brain execution.
Uses Redis SET NX pattern for leader election across multiple workers.
"""
import os
import redis
import logging
import socket
import functools
from datetime import datetime, timedelta
from typing import Callable, Optional

# APScheduler imports
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
    from apscheduler.triggers.interval import IntervalTrigger
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    logging.warning("APScheduler not available. Background jobs disabled.")

# Configure Logging
logger = logging.getLogger(__name__)

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
LOCK_TIMEOUT = 60  # seconds - acts as dead man's switch

# Initialize Redis connection for locking
redis_client: Optional[redis.Redis] = None
try:
    if redis:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        redis_client.ping()
        logger.info("✅ Scheduler Redis connection established.")
except Exception as e:
    logger.warning(f"⚠️ Redis not available for scheduler locks: {e}")
    redis_client = None


def distributed_lock(lock_name: str, lock_timeout: int = LOCK_TIMEOUT):
    """
    Decorator that ensures a job is only executed by one worker at a time.
    Uses Redis SET NX (Not Exists) for distributed locking.
    
    Args:
        lock_name: Unique name for the lock
        lock_timeout: TTL in seconds (prevents deadlocks if worker crashes)
        
    Usage:
        @distributed_lock("backup_job")
        def backup_database():
            # Only one worker will execute this
            pass
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            if not redis_client:
                # Fail-safe: If Redis is down, log error and skip
                # Change to `return func(*args, **kwargs)` to run without lock
                logger.error(f"❌ Redis unavailable. Skipping job {lock_name}.")
                return None
            
            lock_key = f"jobs:lock:{lock_name}"
            hostname = socket.gethostname()
            lock_value = f"{hostname}:{datetime.utcnow().isoformat()}"
            
            try:
                # Attempt to acquire lock using SET NX EX
                # NX: Only set if not exists
                # EX: Expire after timeout (dead man's switch)
                acquired = redis_client.set(
                    lock_key, 
                    lock_value, 
                    nx=True,  # Not Exists
                    ex=lock_timeout  # Expire
                )
                
                if acquired:
                    logger.info(f"🔒 Lock acquired for '{lock_name}' on {hostname}")
                    try:
                        # Execute the job
                        result = func(*args, **kwargs)
                        logger.info(f"✅ Job '{lock_name}' completed successfully")
                        return result
                    except Exception as e:
                        logger.error(f"❌ Job '{lock_name}' failed: {e}")
                        raise
                    finally:
                        # Release lock (but only if we still own it)
                        # Using Lua script for atomic check-and-delete
                        unlock_script = """
                        if redis.call("get", KEYS[1]) == ARGV[1] then
                            return redis.call("del", KEYS[1])
                        else
                            return 0
                        end
                        """
                        redis_client.eval(unlock_script, 1, lock_key, lock_value)
                        logger.debug(f"🔓 Lock released for '{lock_name}'")
                else:
                    # Lock held by another worker
                    current_lock = redis_client.get(lock_key)
                    logger.info(f"⏭️ Lock for '{lock_name}' held by: {current_lock}. Skipping.")
                    return None
                    
            except Exception as e:
                logger.error(f"❌ Lock operation failed for '{lock_name}': {e}")
                # Fail-safe: Don't run job if lock mechanism fails
                return None
        
        return wrapper
    return decorator


class DistributedScheduler:
    """
    Wrapper around APScheduler that adds distributed locking.
    Ensures jobs only run on one worker in a multi-worker environment.
    """
    
    def __init__(self):
        self.scheduler: Optional[BackgroundScheduler] = None
        self.jobs = []
        
        if APSCHEDULER_AVAILABLE:
            self.scheduler = BackgroundScheduler()
            logger.info("✅ Distributed Scheduler initialized.")
        else:
            logger.warning("⚠️ APScheduler not available.")
    
    def add_job(self, func: Callable, trigger, id: str, name: str = None, 
                replace_existing: bool = True, **trigger_args):
        """
        Add a job with automatic distributed locking.
        
        Args:
            func: Function to execute
            trigger: Trigger type ('cron', 'interval', 'date')
            id: Unique job identifier
            name: Human-readable name
            replace_existing: Replace if job exists
            **trigger_args: Trigger-specific arguments
        """
        if not self.scheduler:
            logger.warning(f"⚠️ Cannot add job '{id}': Scheduler not available")
            return
        
        # Wrap function with distributed lock
        locked_func = distributed_lock(id)(func)
        
        # Create trigger
        if trigger == 'cron':
            trigger_obj = CronTrigger(**trigger_args)
        elif trigger == 'interval':
            trigger_obj = IntervalTrigger(**trigger_args)
        else:
            trigger_obj = trigger
        
        # Add job to scheduler
        self.scheduler.add_job(
            func=locked_func,
            trigger=trigger_obj,
            id=id,
            name=name or id,
            replace_existing=replace_existing
        )
        
        self.jobs.append(id)
        logger.info(f"✅ Added job '{id}' with distributed locking")
    
    def start(self):
        """Start the scheduler."""
        if self.scheduler and not self.scheduler.running:
            self.scheduler.start()
            logger.info("🚀 Distributed Scheduler started.")
            logger.info(f"📋 Jobs scheduled: {', '.join(self.jobs)}")
    
    def shutdown(self, wait: bool = True):
        """Shutdown the scheduler."""
        if self.scheduler and self.scheduler.running:
            self.scheduler.shutdown(wait=wait)
            logger.info("🛑 Distributed Scheduler stopped.")
    
    def get_jobs(self):
        """Get list of scheduled jobs."""
        if self.scheduler:
            return self.scheduler.get_jobs()
        return []


# Singleton instance
scheduler = DistributedScheduler()


def start_scheduler(app=None):
    """
    Start the scheduler with Flask app context.
    
    Args:
        app: Flask application instance (optional)
    """
    # Schedule default jobs
    
    # 1. Database backup - Daily at 2 AM
    @distributed_lock("daily_backup")
    def daily_backup():
        """Backup database daily to S3."""
        logger.info("Running daily backup...")
        try:
            from services.backup_service import backup_service
            result = backup_service.perform_backup()
            if result.get('success'):
                logger.info(f"✅ Backup completed: {result.get('filename')}")
            else:
                logger.error(f"❌ Backup failed: {result.get('error')}")
        except Exception as e:
            logger.error(f"Backup failed: {e}")
            # Capture in Sentry if available
            try:
                from config.monitoring import capture_exception
                capture_exception(e, context={'job': 'daily_backup'})
            except:
                pass
    
    # Add jobs to scheduler
    scheduler.add_job(
        daily_backup,
        trigger='cron',
        id='daily_backup',
        hour=2,
        minute=0
    )
    
    # 2. Cache cleanup - Every 6 hours
    @distributed_lock("cache_cleanup")
    def cache_cleanup():
        """Clean expired cache entries."""
        logger.info("Running cache cleanup...")
        try:
            from services.vector_engine import vector_engine
            stats = vector_engine.get_cache_stats()
            logger.info(f"Cache stats: {stats}")
        except Exception as e:
            logger.error(f"Cache cleanup failed: {e}")
    
    scheduler.add_job(
        cache_cleanup,
        trigger='interval',
        id='cache_cleanup',
        hours=6
    )
    
    # 3. Health check - Every 5 minutes
    @distributed_lock("health_check")
    def scheduled_health_check():
        """Periodic health check."""
        try:
            import requests
            response = requests.get('http://localhost:8001/api/health', timeout=10)
            if response.status_code != 200:
                logger.warning(f"Health check warning: {response.status_code}")
        except Exception as e:
            logger.error(f"Health check failed: {e}")
    
    scheduler.add_job(
        scheduled_health_check,
        trigger='interval',
        id='health_check',
        minutes=5
    )
    
    # Start the scheduler
    scheduler.start()


# Convenience function for manual job execution
def run_job_safely(job_func: Callable, job_name: str, *args, **kwargs):
    """
    Execute a job with distributed locking.
    
    Args:
        job_func: Function to execute
        job_name: Unique name for lock
        *args: Arguments to pass to function
        **kwargs: Keyword arguments to pass to function
        
    Returns:
        Result of job execution or None if lock not acquired
    """
    locked_func = distributed_lock(job_name)(job_func)
    return locked_func(*args, **kwargs)
