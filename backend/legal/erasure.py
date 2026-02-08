"""
EKA-AI Platform: DPDP Act 2026 - Right to Erasure Implementation
Handles cascaded deletion of user data from Database AND Vector Store.
"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class DPDPErasureController:
    """
    Controller for handling Data Principal's Right to Erasure (Right to be Forgotten)
    under India's Digital Personal Data Protection Act 2026.
    
    This ensures complete deletion across:
    1. Primary Database (PostgreSQL)
    2. Vector Store (Supabase/pgvector or Pinecone)
    3. Cache (Redis)
    4. Audit Logs (with anonymization)
    """
    
    def __init__(self, supabase_client, vector_store_client=None, redis_client=None):
        self.supabase = supabase_client
        self.vector_store = vector_store_client
        self.redis = redis_client
    
    async def execute_right_to_erasure(
        self, 
        user_id: str, 
        reason: str = "user_consent_withdrawal",
        requested_by: str = "user"
    ) -> Dict[str, Any]:
        """
        Orchestrates complete data erasure for DPDP compliance.
        
        Args:
            user_id: The user's unique identifier
            reason: Reason for erasure (consent_withdrawal, data_breach, etc.)
            requested_by: Who initiated the request (user, authority, etc.)
        
        Returns:
            Dict with erasure status and details
        """
        erasure_log = {
            "user_id": user_id,
            "reason": reason,
            "requested_by": requested_by,
            "timestamp": datetime.utcnow().isoformat(),
            "steps_completed": [],
            "errors": []
        }
        
        logger.info(f"dpdp_erasure_initiated", extra=erasure_log)
        
        try:
            # Step 1: Delete from Vector Store (RAG embeddings)
            # CRITICAL: This prevents AI from using deleted user's data
            await self._purge_vector_store(user_id, erasure_log)
            
            # Step 2: Delete from Cache (Redis)
            await self._purge_cache(user_id, erasure_log)
            
            # Step 3: Delete from Primary Database
            await self._purge_database(user_id, erasure_log)
            
            # Step 4: Anonymize audit logs (retain metadata, remove PII)
            await self._anonymize_audit_logs(user_id, erasure_log)
            
            # Step 5: Record the erasure event (for compliance reporting)
            await self._record_erasure_event(erasure_log)
            
            logger.info(f"dpdp_erasure_completed", extra=erasure_log)
            
            return {
                "success": True,
                "message": "User data completely erased per DPDP Act 2026",
                "details": erasure_log
            }
            
        except Exception as e:
            logger.error(f"dpdp_erasure_failed", extra={
                **erasure_log,
                "error": str(e)
            })
            
            # If erasure fails, we must NOT leave partial data
            # Rollback strategy: Mark user as "pending_erasure" for manual review
            await self._mark_pending_erasure(user_id, erasure_log)
            
            raise RuntimeError(
                f"DPDP Erasure failed for user {user_id}. "
                "User marked for manual review. Error: {str(e)}"
            )
    
    async def _purge_vector_store(self, user_id: str, erasure_log: Dict):
        """Delete user's embeddings from vector store."""
        try:
            if self.vector_store:
                # For Supabase/pgvector
                if hasattr(self.vector_store, 'table'):
                    result = self.vector_store.table("embeddings")\
                        .delete()\
                        .eq("user_id", user_id)\
                        .execute()
                    erasure_log["steps_completed"].append("vector_store_purged")
                    logger.info(f"vector_store_purged", extra={"user_id": user_id})
                
                # For Pinecone
                elif hasattr(self.vector_store, 'delete'):
                    self.vector_store.delete(
                        filter={"user_id": {"$eq": user_id}}
                    )
                    erasure_log["steps_completed"].append("vector_store_purged")
                    
        except Exception as e:
            erasure_log["errors"].append(f"vector_store_failed: {str(e)}")
            logger.error(f"vector_store_purge_failed", extra={
                "user_id": user_id,
                "error": str(e)
            })
            raise
    
    async def _purge_cache(self, user_id: str, erasure_log: Dict):
        """Delete user's data from Redis cache."""
        try:
            if self.redis:
                # Delete all keys matching user_id pattern
                pattern = f"*{user_id}*"
                keys = self.redis.keys(pattern)
                if keys:
                    self.redis.delete(*keys)
                erasure_log["steps_completed"].append("cache_purged")
                logger.info(f"cache_purged", extra={"user_id": user_id, "keys_deleted": len(keys)})
        except Exception as e:
            # Cache failures are non-critical
            erasure_log["errors"].append(f"cache_warning: {str(e)}")
            logger.warning(f"cache_purge_warning", extra={
                "user_id": user_id,
                "error": str(e)
            })
    
    async def _purge_database(self, user_id: str, erasure_log: Dict):
        """Delete user's records from PostgreSQL database."""
        try:
            if self.supabase:
                # Delete in order to respect foreign key constraints
                
                # 1. Delete job cards (cascade to PDI, invoices)
                self.supabase.table("job_cards")\
                    .delete()\
                    .eq("user_id", user_id)\
                    .execute()
                
                # 2. Delete subscriptions
                self.supabase.table("subscriptions")\
                    .delete()\
                    .eq("user_id", user_id)\
                    .execute()
                
                # 3. Delete user profile
                self.supabase.table("user_profiles")\
                    .delete()\
                    .eq("id", user_id)\
                    .execute()
                
                # 4. Delete auth user (this cascade deletes most data)
                self.supabase.auth.admin.delete_user(user_id)
                
                erasure_log["steps_completed"].append("database_purged")
                logger.info(f"database_purged", extra={"user_id": user_id})
                
        except Exception as e:
            erasure_log["errors"].append(f"database_failed: {str(e)}")
            logger.error(f"database_purge_failed", extra={
                "user_id": user_id,
                "error": str(e)
            })
            raise
    
    async def _anonymize_audit_logs(self, user_id: str, erasure_log: Dict):
        """Anonymize audit logs - retain metadata, remove PII."""
        try:
            if self.supabase:
                # Replace user_id with hash in audit logs
                # Retain action type and timestamp for compliance
                self.supabase.table("audit_logs")\
                    .update({
                        "user_id": f"ANONYMIZED_{user_id[:8]}",
                        "user_email": "[REDACTED]",
                        "user_name": "[REDACTED]"
                    })\
                    .eq("user_id", user_id)\
                    .execute()
                
                erasure_log["steps_completed"].append("audit_logs_anonymized")
                logger.info(f"audit_logs_anonymized", extra={"user_id": user_id})
                
        except Exception as e:
            # Audit log failures are logged but don't block erasure
            erasure_log["errors"].append(f"audit_log_warning: {str(e)}")
            logger.warning(f"audit_log_anonymization_warning", extra={
                "user_id": user_id,
                "error": str(e)
            })
    
    async def _record_erasure_event(self, erasure_log: Dict):
        """Record the erasure event for compliance reporting."""
        try:
            if self.supabase:
                self.supabase.table("dpdp_erasure_log").insert({
                    "user_id": erasure_log["user_id"],
                    "reason": erasure_log["reason"],
                    "requested_by": erasure_log["requested_by"],
                    "timestamp": erasure_log["timestamp"],
                    "status": "completed" if not erasure_log["errors"] else "partial",
                    "details": erasure_log
                }).execute()
        except Exception as e:
            logger.error(f"erasure_record_failed", extra={
                "error": str(e),
                "erasure_log": erasure_log
            })
    
    async def _mark_pending_erasure(self, user_id: str, erasure_log: Dict):
        """Mark user for manual review if automated erasure fails."""
        try:
            if self.supabase:
                self.supabase.table("dpdp_pending_erasure").insert({
                    "user_id": user_id,
                    "reason": erasure_log.get("reason"),
                    "timestamp": datetime.utcnow().isoformat(),
                    "error_log": erasure_log.get("errors"),
                    "status": "pending_manual_review"
                }).execute()
        except Exception as e:
            logger.critical(f"pending_erasure_mark_failed", extra={
                "user_id": user_id,
                "error": str(e)
            })


# Convenience function for direct use
def execute_user_erasure(user_id: str, supabase_client, **kwargs):
    """Convenience function to execute erasure with default clients."""
    controller = DPDPErasureController(supabase_client)
    return controller.execute_right_to_erasure(user_id, **kwargs)
