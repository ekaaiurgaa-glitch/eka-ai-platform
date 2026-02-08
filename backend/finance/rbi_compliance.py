"""
EKA-AI Platform: RBI Compliance for Recurring Payments (2026)
Implements E-Mandate regulations with 24-hour pre-debit notification.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from enum import Enum

logger = logging.getLogger(__name__)

# RBI mandated constants
SAC_CODE = "998439"  # OIDAR Services
PRE_DEBIT_NOTIFICATION_HOURS = 24
MAX_RETRY_ATTEMPTS = 2


class SubscriptionStatus(Enum):
    ACTIVE = "active"
    PENDING_NOTIFICATION = "pending_notification"
    NOTIFIED = "notified"
    PAYMENT_FAILED = "payment_failed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class RBIMandateController:
    """
    Controller for RBI-compliant recurring payment processing.
    
    Key Requirements:
    1. 24-hour pre-debit notification (SMS/Email)
    2. Transaction amount cap (varies by customer consent)
    3. Maximum 2 retry attempts on failure
    4. Clear cancellation mechanism
    """
    
    def __init__(self, supabase_client, notification_service=None):
        self.supabase = supabase_client
        self.notification = notification_service
    
    def trigger_pre_debit_notifications(self) -> List[Dict]:
        """
        Runs daily (via Celery/Cron).
        Sends RBI-mandated alert 24h before charge.
        
        Returns:
            List of notification results
        """
        results = []
        
        # Find subscriptions renewing tomorrow
        target_date = (datetime.utcnow() + timedelta(days=1)).date()
        
        try:
            # Query active subscriptions with billing date = tomorrow
            response = self.supabase.table("subscriptions")\
                .select("*")\
                .eq("status", SubscriptionStatus.ACTIVE.value)\
                .eq("next_billing_date", target_date.isoformat())\
                .eq("country", "IN")\
                .eq("pre_debit_notified", False)\
                .execute()
            
            subscriptions = response.data or []
            logger.info(f"rbi_pre_debit_batch", extra={
                "target_date": target_date.isoformat(),
                "subscriptions_found": len(subscriptions)
            })
            
            for sub in subscriptions:
                try:
                    result = self._send_pre_debit_notification(sub)
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"rbi_notification_failed", extra={
                        "subscription_id": sub.get("id"),
                        "error": str(e)
                    })
                    results.append({
                        "subscription_id": sub.get("id"),
                        "status": "failed",
                        "error": str(e)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"rbi_batch_failed", extra={"error": str(e)})
            raise
    
    def _send_pre_debit_notification(self, subscription: Dict) -> Dict:
        """
        Sends RBI-compliant pre-debit notification.
        
        Must include:
        - Amount to be charged
        - Date of charge
        - Mandate reference
        - Cancellation link
        - Merchant name
        """
        sub_id = subscription.get("id")
        user_id = subscription.get("user_id")
        amount = subscription.get("amount")
        mandate_id = subscription.get("mandate_id")
        
        # Prepare RBI compliant payload
        notification_data = {
            "subscription_id": sub_id,
            "amount": amount,
            "currency": "INR",
            "charge_date": subscription.get("next_billing_date"),
            "mandate_id": mandate_id,
            "merchant_name": "EKA-AI Platform (Go4Garage Private Limited)",
            "merchant_id": "GO4GARAGE001",
            "sac_code": SAC_CODE,
            "cancellation_url": f"https://app.eka.ai/billing/cancel/{sub_id}",
            "support_url": "https://eka.ai/support",
            "notification_time": datetime.utcnow().isoformat(),
            "compliance": "RBI_E_MANDATE_2026"
        }
        
        # Send notification (via email/SMS)
        if self.notification:
            # Send to user's registered email/phone
            user_email = self._get_user_email(user_id)
            user_phone = self._get_user_phone(user_id)
            
            if user_email:
                self.notification.send_email(
                    to=user_email,
                    template="rbi_pre_debit_notification",
                    data=notification_data
                )
            
            if user_phone:
                self.notification.send_sms(
                    to=user_phone,
                    template="rbi_pre_debit_sms",
                    data=notification_data
                )
        
        # Mark as notified in database
        self.supabase.table("subscriptions")\
            .update({
                "pre_debit_notified": True,
                "notification_sent_at": datetime.utcnow().isoformat(),
                "notification_data": notification_data
            })\
            .eq("id", sub_id)\
            .execute()
        
        logger.info(f"rbi_notification_sent", extra={
            "subscription_id": sub_id,
            "mandate_id": mandate_id,
            "amount": amount
        })
        
        return {
            "subscription_id": sub_id,
            "status": "notified",
            "notification_data": notification_data
        }
    
    def process_recurring_payment(self, subscription_id: str) -> Dict:
        """
        Process the actual charge (called after 24h notification period).
        
        Validates:
        - Notification was sent 24h ago
        - Subscription still active
        - Within retry limits
        """
        try:
            # Fetch subscription
            response = self.supabase.table("subscriptions")\
                .select("*")\
                .eq("id", subscription_id)\
                .single()\
                .execute()
            
            sub = response.data
            if not sub:
                raise ValueError(f"Subscription {subscription_id} not found")
            
            # Validate pre-debit notification was sent
            if not sub.get("pre_debit_notified"):
                raise PermissionError(
                    "Cannot charge: RBI pre-debit notification not sent"
                )
            
            # Validate 24h have passed since notification
            notification_time = sub.get("notification_sent_at")
            if notification_time:
                notified_at = datetime.fromisoformat(notification_time.replace("Z", "+00:00"))
                time_since_notification = datetime.utcnow() - notified_at.replace(tzinfo=None)
                
                if time_since_notification < timedelta(hours=PRE_DEBIT_NOTIFICATION_HOURS):
                    raise PermissionError(
                        f"Cannot charge: Only {time_since_notification.total_seconds()/3600:.1f}h "
                        f"since notification. Must wait {PRE_DEBIT_NOTIFICATION_HOURS}h."
                    )
            
            # Check retry attempts
            retry_count = sub.get("retry_count", 0)
            if retry_count >= MAX_RETRY_ATTEMPTS:
                self._suspend_subscription(subscription_id, "max_retries_exceeded")
                raise PermissionError(f"Max retry attempts ({MAX_RETRY_ATTEMPTS}) exceeded")
            
            # Process payment via PayU (or other gateway)
            payment_result = self._charge_payment(sub)
            
            if payment_result["success"]:
                # Update subscription
                self._update_subscription_after_success(sub, payment_result)
                
                # Generate invoice with SAC code
                self._generate_invoice(sub, payment_result)
                
                logger.info(f"recurring_payment_success", extra={
                    "subscription_id": subscription_id,
                    "transaction_id": payment_result.get("transaction_id")
                })
                
                return {
                    "success": True,
                    "subscription_id": subscription_id,
                    "transaction_id": payment_result.get("transaction_id"),
                    "amount": sub.get("amount")
                }
            
            else:
                # Handle failure
                self._handle_payment_failure(sub, payment_result)
                
                return {
                    "success": False,
                    "subscription_id": subscription_id,
                    "error": payment_result.get("error"),
                    "retry_count": retry_count + 1
                }
        
        except Exception as e:
            logger.error(f"recurring_payment_error", extra={
                "subscription_id": subscription_id,
                "error": str(e)
            })
            raise
    
    def _charge_payment(self, subscription: Dict) -> Dict:
        """Execute charge via payment gateway."""
        # This would integrate with PayU/Razorpay
        # Mock implementation for now
        return {
            "success": True,
            "transaction_id": f"TXN_{datetime.utcnow().timestamp()}",
            "gateway": "payu"
        }
    
    def _update_subscription_after_success(self, sub: Dict, payment_result: Dict):
        """Update subscription after successful payment."""
        # Calculate next billing date
        current_billing = datetime.fromisoformat(sub.get("next_billing_date").replace("Z", "+00:00"))
        next_billing = current_billing + timedelta(days=30)  # Monthly
        
        self.supabase.table("subscriptions")\
            .update({
                "last_payment_date": datetime.utcnow().isoformat(),
                "next_billing_date": next_billing.isoformat(),
                "pre_debit_notified": False,  # Reset for next cycle
                "retry_count": 0,  # Reset retries
                "status": SubscriptionStatus.ACTIVE.value
            })\
            .eq("id", sub.get("id"))\
            .execute()
    
    def _handle_payment_failure(self, sub: Dict, payment_result: Dict):
        """Handle failed payment."""
        retry_count = sub.get("retry_count", 0) + 1
        
        update_data = {
            "retry_count": retry_count,
            "last_failure_reason": payment_result.get("error"),
            "last_failure_at": datetime.utcnow().isoformat()
        }
        
        # Suspend if max retries reached
        if retry_count >= MAX_RETRY_ATTEMPTS:
            update_data["status"] = SubscriptionStatus.PAYMENT_FAILED.value
        
        self.supabase.table("subscriptions")\
            .update(update_data)\
            .eq("id", sub.get("id"))\
            .execute()
        
        logger.warning(f"payment_failed", extra={
            "subscription_id": sub.get("id"),
            "retry_count": retry_count,
            "error": payment_result.get("error")
        })
    
    def _suspend_subscription(self, subscription_id: str, reason: str):
        """Suspend subscription after failures."""
        self.supabase.table("subscriptions")\
            .update({
                "status": SubscriptionStatus.PAYMENT_FAILED.value,
                "suspended_at": datetime.utcnow().isoformat(),
                "suspension_reason": reason
            })\
            .eq("id", subscription_id)\
            .execute()
    
    def _generate_invoice(self, sub: Dict, payment_result: Dict):
        """Generate GST-compliant invoice with SAC code."""
        invoice_data = {
            "subscription_id": sub.get("id"),
            "user_id": sub.get("user_id"),
            "transaction_id": payment_result.get("transaction_id"),
            "amount": sub.get("amount"),
            "currency": "INR",
            "sac_code": SAC_CODE,
            "service_description": "Online Information Database Access and Retrieval (OIDAR) Services",
            "gst_rate": 18,  # 18% GST for OIDAR
            "gst_amount": round(sub.get("amount", 0) * 0.18, 2),
            "total_amount": round(sub.get("amount", 0) * 1.18, 2),
            "invoice_date": datetime.utcnow().isoformat(),
            "status": "generated"
        }
        
        self.supabase.table("invoices").insert(invoice_data).execute()
        
        logger.info(f"invoice_generated", extra={
            "subscription_id": sub.get("id"),
            "sac_code": SAC_CODE,
            "amount": invoice_data["total_amount"]
        })
    
    def _get_user_email(self, user_id: str) -> Optional[str]:
        """Get user's email from database."""
        try:
            response = self.supabase.table("user_profiles")\
                .select("email")\
                .eq("id", user_id)\
                .single()\
                .execute()
            return response.data.get("email") if response.data else None
        except:
            return None
    
    def _get_user_phone(self, user_id: str) -> Optional[str]:
        """Get user's phone from database."""
        try:
            response = self.supabase.table("user_profiles")\
                .select("phone")\
                .eq("id", user_id)\
                .single()\
                .execute()
            return response.data.get("phone") if response.data else None
        except:
            return None


# Convenience function for Celery tasks
def run_pre_debit_notifications(supabase_client, notification_service=None):
    """Entry point for Celery/Cron job."""
    controller = RBIMandateController(supabase_client, notification_service)
    return controller.trigger_pre_debit_notifications()
