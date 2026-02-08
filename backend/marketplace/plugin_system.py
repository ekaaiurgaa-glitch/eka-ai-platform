"""
EKA-AI Platform: Plugin Marketplace
Enables third-party developers to extend the platform.
This creates an ecosystem around EKA-AI.
"""

import json
import hashlib
from dataclasses import dataclass
from typing import List, Dict, Optional, Callable
from enum import Enum


class PluginCategory(Enum):
    """Categories of plugins available in marketplace"""
    PAYMENT_GATEWAY = "payment_gateway"  # Razorpay, Stripe, etc.
    INVENTORY = "inventory"  # Parts catalog integrations
    ACCOUNTING = "accounting"  # Tally, Zoho Books, QuickBooks
    CRM = "crm"  # WhatsApp Business, SMS providers
    ANALYTICS = "analytics"  # Advanced reporting
    IOT = "iot"  # Vehicle telematics, OBD devices
    INSURANCE = "insurance"  # Insurance company connectors
    FLEET = "fleet"  # GPS tracking, fuel monitoring
    AI_MODEL = "ai_model"  # Custom AI models for specific vehicles
    UTILITY = "utility"  # QR codes, document scanners, etc.


@dataclass
class Plugin:
    """A plugin in the marketplace"""
    plugin_id: str
    name: str
    description: str
    category: PluginCategory
    developer: str
    version: str
    price: float  # 0 for free plugins
    icon_url: str
    screenshots: List[str]
    permissions: List[str]  # What data it can access
    hooks: List[str]  # Integration points
    config_schema: Dict  # JSON schema for configuration
    rating: float
    install_count: int
    verified: bool  # EKA-AI verified developer


class PluginManager:
    """
    Manages plugin lifecycle:
    - Discovery (marketplace browsing)
    - Installation (enable for tenant)
    - Configuration (setup plugin)
    - Execution (run plugin hooks)
    - Updates (version management)
    """
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.hooks: Dict[str, List[Callable]] = {}
    
    def get_marketplace_plugins(self, category: Optional[PluginCategory] = None,
                                 search: str = None) -> List[Plugin]:
        """
        Browse available plugins in marketplace.
        Like App Store for EKA-AI.
        """
        plugins = [
            # Payment Gateways
            Plugin(
                plugin_id="razorpay_payment",
                name="Razorpay Payments",
                description="Accept online payments via UPI, Cards, NetBanking",
                category=PluginCategory.PAYMENT_GATEWAY,
                developer="Razorpay",
                version="2.1.0",
                price=0,
                icon_url="/plugins/razorpay.png",
                screenshots=[],
                permissions=["invoicing:read", "payments:write"],
                hooks=["invoice_generated", "payment_received"],
                config_schema={
                    "key_id": {"type": "string", "required": True},
                    "key_secret": {"type": "string", "required": True, "secret": True}
                },
                rating=4.8,
                install_count=5000,
                verified=True
            ),
            
            # Accounting
            Plugin(
                plugin_id="tally_integration",
                name="Tally Integration",
                description="Sync invoices directly to Tally ERP",
                category=PluginCategory.ACCOUNTING,
                developer="Tally Solutions",
                version="1.5.0",
                price=999,
                icon_url="/plugins/tally.png",
                screenshots=[],
                permissions=["invoicing:read", "accounting:write"],
                hooks=["invoice_finalized", "day_end"],
                config_schema={
                    "tally_server_url": {"type": "string", "required": True},
                    "company_name": {"type": "string", "required": True}
                },
                rating=4.6,
                install_count=3200,
                verified=True
            ),
            
            # WhatsApp Business
            Plugin(
                plugin_id="whatsapp_business",
                name="WhatsApp Business API",
                description="Send job updates, invoices via WhatsApp",
                category=PluginCategory.CRM,
                developer="Meta",
                version="3.0.0",
                price=0,
                icon_url="/plugins/whatsapp.png",
                screenshots=[],
                permissions=["customers:read", "messaging:write"],
                hooks=["job_card_updated", "invoice_generated", "vehicle_ready"],
                config_schema={
                    "phone_number_id": {"type": "string", "required": True},
                    "access_token": {"type": "string", "required": True, "secret": True}
                },
                rating=4.9,
                install_count=8500,
                verified=True
            ),
            
            # IoT - OBD Device
            Plugin(
                plugin_id="obd_telemetry",
                name="Vehicle Health Monitor",
                description="Connect OBD devices for real-time diagnostics",
                category=PluginCategory.IOT,
                developer="AutoTech IoT",
                version="1.2.0",
                price=499,
                icon_url="/plugins/obd.png",
                screenshots=[],
                permissions=["vehicles:read", "diagnostics:write"],
                hooks=["vehicle_connected", "fault_code_detected"],
                config_schema={
                    "device_provider": {"type": "string", "enum": ["vogo", "onmobi", "custom"]},
                    "api_key": {"type": "string", "required": True, "secret": True}
                },
                rating=4.4,
                install_count=1200,
                verified=False
            ),
            
            # AI Model - Maruti Specialist
            Plugin(
                plugin_id="maruti_ai_specialist",
                name="Maruti Suzuki AI Expert",
                description="Fine-tuned AI for Maruti Suzuki vehicles",
                category=PluginCategory.AI_MODEL,
                developer="EKA-AI Labs",
                version="2.0.0",
                price=1499,
                icon_url="/plugins/maruti_ai.png",
                screenshots=[],
                permissions=["ai:read", "knowledge_base:read"],
                hooks=["diagnostic_requested"],
                config_schema={},
                rating=4.7,
                install_count=2100,
                verified=True
            ),
            
            # Fleet Management
            Plugin(
                plugin_id="gps_tracking",
                name="GPS Fleet Tracking",
                description="Real-time vehicle location and route optimization",
                category=PluginCategory.FLEET,
                developer="MapMyIndia",
                version="1.8.0",
                price=0,
                icon_url="/plugins/gps.png",
                screenshots=[],
                permissions=["fleet:read", "location:write"],
                hooks=["vehicle_moved", "geofence_breach"],
                config_schema={
                    "mapmyindia_api_key": {"type": "string", "required": True, "secret": True}
                },
                rating=4.5,
                install_count=1800,
                verified=True
            ),
            
            # Insurance
            Plugin(
                plugin_id="digit_insurance",
                name="Digit Insurance Connect",
                description="Direct integration with Digit Insurance for cashless claims",
                category=PluginCategory.INSURANCE,
                developer="Digit Insurance",
                version="1.0.0",
                price=0,
                icon_url="/plugins/digit.png",
                screenshots=[],
                permissions=["claims:read", "claims:write", "invoicing:read"],
                hooks=["claim_initiated", "claim_approved", "payment_received"],
                config_schema={
                    "garage_code": {"type": "string", "required": True},
                    "api_credentials": {"type": "string", "required": True, "secret": True}
                },
                rating=4.3,
                install_count=800,
                verified=True
            )
        ]
        
        if category:
            plugins = [p for p in plugins if p.category == category]
        
        if search:
            search_lower = search.lower()
            plugins = [p for p in plugins if search_lower in p.name.lower() 
                      or search_lower in p.description.lower()]
        
        return plugins
    
    def install_plugin(self, tenant_id: str, plugin_id: str, 
                       config: Dict) -> Dict:
        """
        Install a plugin for a specific tenant.
        Each tenant can customize plugin configuration.
        """
        # Verify tenant has permission to install this plugin
        tenant_tier = self._get_tenant_tier(tenant_id)
        
        # Check if plugin requires paid tier
        plugin = self._get_plugin_by_id(plugin_id)
        if plugin.price > 0 and tenant_tier == "starter":
            return {
                "success": False,
                "error": "This plugin requires Professional tier or higher"
            }
        
        # Validate config against schema
        validation = self._validate_config(plugin.config_schema, config)
        if not validation["valid"]:
            return {
                "success": False,
                "error": f"Invalid configuration: {validation['errors']}"
            }
        
        # Install
        installation = {
            "installation_id": f"INST_{tenant_id}_{plugin_id}",
            "tenant_id": tenant_id,
            "plugin_id": plugin_id,
            "config": config,
            "status": "active",
            "installed_at": "now",
            "version": plugin.version
        }
        
        # Store in database
        # self.supabase.table("plugin_installations").insert(installation).execute()
        
        # Register hooks
        self._register_hooks(tenant_id, plugin_id, plugin.hooks)
        
        return {
            "success": True,
            "installation_id": installation["installation_id"],
            "message": f"{plugin.name} installed successfully",
            "active_hooks": plugin.hooks
        }
    
    def execute_hook(self, hook_name: str, tenant_id: str, payload: Dict):
        """
        Execute all plugins that have registered for this hook.
        Called by the platform when events occur.
        """
        # Get all active plugins for this tenant that listen to this hook
        installations = self._get_active_installations(tenant_id, hook_name)
        
        results = []
        for inst in installations:
            try:
                # Execute plugin logic (in reality, this would call the plugin's webhook)
                result = self._call_plugin_webhook(
                    inst["plugin_id"], 
                    hook_name, 
                    payload,
                    inst["config"]
                )
                results.append({
                    "plugin_id": inst["plugin_id"],
                    "status": "success",
                    "result": result
                })
            except Exception as e:
                results.append({
                    "plugin_id": inst["plugin_id"],
                    "status": "error",
                    "error": str(e)
                })
        
        return results
    
    def _validate_config(self, schema: Dict, config: Dict) -> Dict:
        """Validate plugin configuration against JSON schema"""
        errors = []
        
        for field, rules in schema.items():
            if rules.get("required") and field not in config:
                errors.append(f"{field} is required")
            
            if field in config:
                value = config[field]
                if rules.get("type") == "string" and not isinstance(value, str):
                    errors.append(f"{field} must be a string")
                if rules.get("enum") and value not in rules["enum"]:
                    errors.append(f"{field} must be one of {rules['enum']}")
        
        return {"valid": len(errors) == 0, "errors": errors}
    
    def _get_tenant_tier(self, tenant_id: str) -> str:
        """Get tenant subscription tier"""
        return "professional"  # Default
    
    def _get_plugin_by_id(self, plugin_id: str) -> Optional[Plugin]:
        """Get plugin details by ID"""
        plugins = self.get_marketplace_plugins()
        for p in plugins:
            if p.plugin_id == plugin_id:
                return p
        return None
    
    def _get_active_installations(self, tenant_id: str, hook_name: str) -> List[Dict]:
        """Get all plugin installations for tenant that listen to hook"""
        # Query database
        return []
    
    def _register_hooks(self, tenant_id: str, plugin_id: str, hooks: List[str]):
        """Register plugin hooks for execution"""
        pass
    
    def _call_plugin_webhook(self, plugin_id: str, hook: str, payload: Dict, config: Dict):
        """Call plugin's webhook endpoint"""
        # In production, this makes HTTP call to plugin's registered URL
        return {"called": True, "plugin_id": plugin_id, "hook": hook}


# Hook definitions - Platform events that plugins can listen to
PLATFORM_HOOKS = {
    # Job Card Lifecycle
    "job_card_created": "Fired when new job card is created",
    "job_card_updated": "Fired when job card status changes",
    "job_card_completed": "Fired when vehicle is ready for delivery",
    "vehicle_received": "Fired when customer vehicle enters workshop",
    
    # Billing
    "invoice_generated": "Fired when invoice is created",
    "invoice_finalized": "Fired when invoice is sent to customer",
    "payment_received": "Fired when payment is recorded",
    "payment_failed": "Fired when payment fails",
    
    # Customer
    "customer_created": "Fired when new customer is added",
    "customer_updated": "Fired when customer details change",
    "feedback_received": "Fired when customer submits review",
    
    # Inventory
    "inventory_low": "Fired when stock goes below threshold",
    "parts_ordered": "Fired when parts are ordered from supplier",
    "parts_received": "Fired when parts arrive at workshop",
    
    # AI
    "diagnostic_requested": "Fired when AI diagnosis is requested",
    "diagnostic_completed": "Fired when AI provides diagnosis",
    "estimate_generated": "Fired when AI generates repair estimate",
    
    # Fleet
    "vehicle_moved": "Fired when fleet vehicle location updates",
    "service_due": "Fired when vehicle is due for maintenance",
    "fault_code_detected": "Fired when OBD detects error code",
    
    # Insurance
    "claim_initiated": "Fired when insurance claim is created",
    "claim_approved": "Fired when claim is approved by insurer",
    "survey_scheduled": "Fired when surveyor is assigned",
    
    # System
    "day_end": "Fired at end of business day",
    "backup_completed": "Fired when daily backup completes",
    "report_generated": "Fired when report is generated"
}
