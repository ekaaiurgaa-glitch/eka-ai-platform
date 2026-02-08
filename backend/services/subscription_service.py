import hashlib
import os
from datetime import datetime, timedelta
from typing import Dict
try:
    from database.supabase_client import supabase_client as supabase
except ImportError:
    # Fallback for when database module isn't available
    supabase = None

class SubscriptionService:
    def __init__(self):
        # Load credentials from environment
        self.key = os.getenv('PAYU_MERCHANT_KEY')
        self.salt = os.getenv('PAYU_MERCHANT_SALT')
        self.base_url = os.getenv('PAYU_BASE_URL', 'https://secure.payu.in/_payment')
        
        # Define Plans
        self.PLANS = {
            'FREE': {'price': 0, 'limit_jobs': 5},
            'PRO': {'price': 2499, 'limit_jobs': 9999}
        }

    def generate_hash(self, data: Dict) -> str:
        """
        Generates PayU SHA-512 Hash
        Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|...||||||salt)
        """
        hash_string = (
            f"{self.key}|{data['txnid']}|{data['amount']}|{data['productinfo']}|"
            f"{data['firstname']}|{data['email']}|||||||||||{self.salt}"
        )
        return hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

    def create_payment_payload(self, workshop_id: str, plan_id: str, user_email: str, user_name: str) -> Dict:
        """
        Creates the Form Data for the Frontend to POST to PayU
        """
        if plan_id not in self.PLANS:
            raise ValueError("Invalid Plan ID")
            
        amount = float(self.PLANS[plan_id]['price'])
        txnid = f"txn_{workshop_id}_{int(datetime.now().timestamp())}"
        product_info = f"EKA-AI {plan_id} Plan"
        
        # Basic Payload
        data = {
            "key": self.key,
            "txnid": txnid,
            "amount": amount,
            "productinfo": product_info,
            "firstname": user_name or "Owner",
            "email": user_email,
            "phone": "9999999999", # Required by PayU, can be dummy if not collected
            "surl": f"{os.getenv('FRONTEND_URL')}/api/subscription/success",
            "furl": f"{os.getenv('FRONTEND_URL')}/api/subscription/failure",
        }
        
        # Generate Hash
        data['hash'] = self.generate_hash(data)
        data['action'] = self.base_url
        
        return data

    def activate_subscription(self, txnid: str, payu_id: str, status: str):
        """
        Activates the plan in Supabase after successful payment
        """
        if status != 'success':
            return False
            
        try:
            # Extract workshop_id from transaction ID (txn_WORKSHOPID_TIMESTAMP)
            parts = txnid.split('_')
            workshop_id = parts[1]
            
            # Calculate Expiry (30 Days)
            expiry = (datetime.now() + timedelta(days=30)).isoformat()
            
            # 1. Update Workshop Table
            if supabase:
                supabase.table('workshops').update({
                    "subscription_plan": "PRO",
                    "subscription_status": "ACTIVE",
                    "subscription_expiry": expiry
                }).eq('id', workshop_id).execute()
                
                # 2. Log Transaction
                supabase.table('subscription_logs').insert({
                    "workshop_id": workshop_id,
                    "new_plan": "PRO",
                    "payment_id": payu_id,
                    "amount": 2499.00
                }).execute()
            
            return True
        except Exception as e:
            print(f"Activation Failed: {e}")
            return False
            
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
