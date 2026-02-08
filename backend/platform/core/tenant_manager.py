"""
EKA-AI Platform: Multi-Tenant Architecture
Enables complete data isolation for competing businesses on shared infrastructure.
"""

import uuid
from typing import Optional, Dict, Any
from dataclasses import dataclass
from enum import Enum


class TenantTier(Enum):
    """Subscription tiers for different business sizes"""
    STARTER = "starter"          # Single workshop
    PROFESSIONAL = "pro"         # 2-5 locations
    ENTERPRISE = "enterprise"    # 6-50 locations
    FLEET = "fleet"              # Fleet operators
    INSURANCE = "insurance"      # Insurance companies
    PARTS_SUPPLIER = "parts"     # Parts/accessories companies
    WHITE_LABEL = "whitelabel"   # OEMs who want their own branded version


@dataclass
class TenantConfig:
    """Configuration for each tenant (workshop/fleet/insurance company)"""
    tenant_id: str
    name: str
    tier: TenantTier
    subdomain: str  # workshopname.eka-ai.com
    custom_domain: Optional[str]  # workshop.com (white-label)
    branding: Dict[str, Any]  # Logo, colors, favicon
    features: Dict[str, bool]  # Feature flags
    limits: Dict[str, int]  # Usage limits
    created_at: str
    settings: Dict[str, Any]  # Custom settings


class TenantManager:
    """
    Manages complete isolation between tenants.
    Each tenant is a separate business entity with its own:
    - Data (RLS enforced)
    - Users and roles
    - Branding (white-label)
    - Integrations
    - Billing
    """
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def create_tenant(self, name: str, tier: TenantTier, 
                      admin_email: str) -> TenantConfig:
        """
        Onboard a new business to the platform.
        This could be a workshop, fleet company, or insurance provider.
        """
        tenant_id = str(uuid.uuid4())
        subdomain = self._generate_subdomain(name)
        
        # Default branding
        branding = {
            "logo_url": None,  # Uses EKA-AI default
            "primary_color": "#f97316",  # Default orange
            "favicon": None,
            "company_name": name,
            "footer_text": f"Powered by EKA-AI | {name}",
            "custom_css": None,
            "email_template_logo": None
        }
        
        # Feature access based on tier
        features = self._get_features_for_tier(tier)
        limits = self._get_limits_for_tier(tier)
        
        tenant = TenantConfig(
            tenant_id=tenant_id,
            name=name,
            tier=tier,
            subdomain=subdomain,
            custom_domain=None,  # Can be configured later
            branding=branding,
            features=features,
            limits=limits,
            created_at="now",
            settings={}
        )
        
        # Store tenant
        self.supabase.table("tenants").insert({
            "id": tenant_id,
            "name": name,
            "tier": tier.value,
            "subdomain": subdomain,
            "branding": branding,
            "features": features,
            "limits": limits,
            "status": "active"
        }).execute()
        
        # Create admin user for tenant
        self._create_tenant_admin(tenant_id, admin_email)
        
        # Set up RLS policies for this tenant
        self._setup_tenant_rls(tenant_id)
        
        return tenant
    
    def _get_features_for_tier(self, tier: TenantTier) -> Dict[str, bool]:
        """Feature access matrix - each tier gets different capabilities"""
        
        base_features = {
            # Core AI
            "ai_diagnostics": True,
            "ai_chat": True,
            "job_card_management": True,
            "inventory_basic": True,
            "customer_management": True,
            "invoicing_gst": True,
            "basic_reports": True,
            "mobile_app": True,
            
            # Advanced (Pro+)
            "ai_voice": tier in [TenantTier.PROFESSIONAL, TenantTier.ENTERPRISE, 
                              TenantTier.FLEET, TenantTier.WHITE_LABEL],
            "multi_location": tier in [TenantTier.PROFESSIONAL, TenantTier.ENTERPRISE,
                                      TenantTier.FLEET, TenantTier.WHITE_LABEL],
            "advanced_analytics": tier in [TenantTier.PROFESSIONAL, TenantTier.ENTERPRISE,
                                          TenantTier.FLEET, TenantTier.WHITE_LABEL],
            "fleet_management": tier in [TenantTier.FLEET, TenantTier.ENTERPRISE, 
                                        TenantTier.WHITE_LABEL],
            "insurance_integration": tier in [TenantTier.INSURANCE, TenantTier.ENTERPRISE,
                                             TenantTier.WHITE_LABEL],
            "parts_marketplace": tier in [TenantTier.PARTS_SUPPLIER, TenantTier.ENTERPRISE,
                                         TenantTier.WHITE_LABEL],
            "api_access": tier in [TenantTier.ENTERPRISE, TenantTier.FLEET, 
                                  TenantTier.INSURANCE, TenantTier.PARTS_SUPPLIER,
                                  TenantTier.WHITE_LABEL],
            "white_label": tier == TenantTier.WHITE_LABEL,
            "custom_integrations": tier in [TenantTier.ENTERPRISE, TenantTier.WHITE_LABEL]
        }
        
        # Industry-specific feature sets
        if tier == TenantTier.INSURANCE:
            base_features.update({
                "claims_processing": True,
                "fraud_detection": True,
                "surveyor_portal": True,
                "cashless_garage_network": True
            })
        
        if tier == TenantTier.FLEET:
            base_features.update({
                "vehicle_tracking": True,
                "fuel_management": True,
                "driver_management": True,
                "route_optimization": True,
                "bulk_maintenance_scheduling": True
            })
        
        if tier == TenantTier.PARTS_SUPPLIER:
            base_features.update({
                "catalog_management": True,
                "inventory_sync": True,
                "order_management": True,
                "workshop_network": True,
                "pricing_engine": True
            })
        
        return base_features
    
    def _get_limits_for_tier(self, tier: TenantTier) -> Dict[str, int]:
        """Usage limits based on tier"""
        limits = {
            TenantTier.STARTER: {
                "max_users": 5,
                "max_job_cards_monthly": 200,
                "max_locations": 1,
                "ai_requests_daily": 100,
                "storage_gb": 10,
                "api_calls_daily": 0
            },
            TenantTier.PROFESSIONAL: {
                "max_users": 20,
                "max_job_cards_monthly": 1000,
                "max_locations": 5,
                "ai_requests_daily": 500,
                "storage_gb": 50,
                "api_calls_daily": 1000
            },
            TenantTier.ENTERPRISE: {
                "max_users": 100,
                "max_job_cards_monthly": 10000,
                "max_locations": 50,
                "ai_requests_daily": 5000,
                "storage_gb": 500,
                "api_calls_daily": 10000
            },
            TenantTier.FLEET: {
                "max_vehicles": 1000,
                "max_drivers": 500,
                "ai_requests_daily": 10000,
                "storage_gb": 1000,
                "api_calls_daily": 50000
            },
            TenantTier.INSURANCE: {
                "max_claims_monthly": 10000,
                "max_garages": 500,
                "ai_requests_daily": 50000,
                "storage_gb": 2000,
                "api_calls_daily": 100000
            },
            TenantTier.PARTS_SUPPLIER: {
                "max_sku": 50000,
                "max_workshops": 5000,
                "ai_requests_daily": 25000,
                "storage_gb": 1000,
                "api_calls_daily": 50000
            },
            TenantTier.WHITE_LABEL: {
                "max_users": "unlimited",
                "max_locations": "unlimited",
                "ai_requests_daily": "unlimited",
                "storage_gb": "unlimited",
                "api_calls_daily": "unlimited",
                "custom_development": True
            }
        }
        return limits.get(tier, limits[TenantTier.STARTER])
    
    def _setup_tenant_rls(self, tenant_id: str):
        """
        Set up Row Level Security policies for complete data isolation.
        Every table has: tenant_id column + RLS policy
        """
        # RLS policies are enforced at database level
        # This ensures Workshop A can NEVER see Workshop B's data
        # Even if there's a bug in the application code
        pass  # Policies created via Supabase dashboard/migrations
    
    def _generate_subdomain(self, name: str) -> str:
        """Generate unique subdomain from business name"""
        import re
        subdomain = re.sub(r'[^a-z0-9]', '', name.lower())[:20]
        # Check uniqueness and append number if needed
        return subdomain
    
    def _create_tenant_admin(self, tenant_id: str, email: str):
        """Create the first admin user for the tenant"""
        pass  # Implementation


# Tenant context for current request
current_tenant = None

def set_tenant_context(tenant_id: str):
    """Set tenant for current request - used in middleware"""
    global current_tenant
    current_tenant = tenant_id

def get_tenant_context() -> str:
    """Get current tenant ID - all DB queries filter by this"""
    return current_tenant
