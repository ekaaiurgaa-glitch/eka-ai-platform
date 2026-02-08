from datetime import datetime, timedelta
from typing import Dict, Optional
try:
    from database.supabase_client import supabase_client as supabase
except ImportError:
    # Fallback for when database module isn't available
    supabase = None

class SubscriptionService:
    def __init__(self):
        self.PLANS = {
            'FREE': {'price': 0, 'limit_jobs': 5},
            'PRO': {'price': 2499, 'limit_jobs': 9999}
        }

    def create_checkout_session(self, workshop_id: str, plan_id: str) -> Dict:
        """
        Creates a payment link/session (Mocked for now, ready for Razorpay)
        """
        if plan_id not in self.PLANS:
            raise ValueError("Invalid Plan ID")
            
        amount = self.PLANS[plan_id]['price']
        
        # In a real integration, you would call Razorpay/Stripe API here
        # checkout = razorpay.Order.create(...)
        
        return {
            "order_id": f"ord_mock_{workshop_id}_{int(datetime.now().timestamp())}",
            "amount": amount,
            "currency": "INR",
            "key": "rzp_test_YOUR_KEY_HERE" # Placeholder
        }

    def activate_subscription(self, workshop_id: str, plan_id: str, payment_id: str):
        """
        Activates the plan after successful payment
        """
        if not supabase:
            raise RuntimeError("Supabase client not available")
            
        expiry = datetime.now() + timedelta(days=30)
        
        # 1. Update Workshop
        data = {
            "subscription_plan": plan_id,
            "subscription_status": "ACTIVE",
            "subscription_expiry": expiry.isoformat()
        }
        
        response = supabase.table('workshops').update(data).eq('id', workshop_id).execute()
        
        # 2. Log Transaction
        log = {
            "workshop_id": workshop_id,
            "new_plan": plan_id,
            "payment_id": payment_id,
            "amount": self.PLANS[plan_id]['price']
        }
        supabase.table('subscription_logs').insert(log).execute()
        
        return True
        
    def get_subscription_status(self, workshop_id: str) -> Dict:
        """
        Get current subscription status for a workshop
        """
        if not supabase:
            return {'plan': 'FREE', 'status': 'ACTIVE', 'expiry': None}
            
        response = supabase.table('workshops').select(
            'subscription_plan,subscription_status,subscription_expiry'
        ).eq('id', workshop_id).execute()
        
        if response.data:
            return response.data[0]
        return {'plan': 'FREE', 'status': 'ACTIVE', 'expiry': None}
        
    def check_job_limit(self, workshop_id: str, current_job_count: int) -> bool:
        """
        Check if workshop can create more jobs based on their plan
        """
        status = self.get_subscription_status(workshop_id)
        plan = status.get('subscription_plan', 'FREE')
        limit = self.PLANS.get(plan, self.PLANS['FREE'])['limit_jobs']
        return current_job_count < limit
