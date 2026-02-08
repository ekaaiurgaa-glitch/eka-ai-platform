"""
EKA-AI Platform: White-Label System
Enables OEMs, large chains, and franchise networks to use EKA-AI 
with their own branding while maintaining the platform's power.
"""

import re
from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class WhiteLabelConfig:
    """Complete white-label configuration"""
    tenant_id: str
    
    # Branding
    company_name: str
    logo_url: str
    favicon_url: str
    primary_color: str
    secondary_color: str
    
    # Custom Domain
    custom_domain: str  # e.g., service.mahindra.com
    ssl_enabled: bool
    
    # Email Templates
    email_from_name: str
    email_from_address: str
    email_logo_url: str
    
    # Custom Content
    login_page_text: str
    dashboard_welcome_message: str
    footer_text: str
    help_url: str
    privacy_url: str
    terms_url: str
    
    # Feature Whitelisting
    enabled_features: list  # Which EKA-AI features to show
    disabled_features: list  # Which to hide
    
    # Custom Integrations
    integrations: Dict  # Their own payment gateway, SMS, etc.
    
    # Mobile App (Optional)
    mobile_app_branding: Dict
    
    # Support
    support_phone: str
    support_email: str
    support_chat_enabled: bool


class WhiteLabelManager:
    """
    Manages white-label deployments for large customers.
    
    Use Cases:
    - Mahindra wants service.mahindra.com powered by EKA-AI
    - Bosch Car Service wants boschservice.in with EKA-AI backend
    - A multi-city chain wants their own branded app
    """
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
    
    def setup_white_label(self, tenant_id: str, config: Dict) -> WhiteLabelConfig:
        """
        Configure white-label for a tenant.
        This transforms EKA-AI into their branded platform.
        """
        # Validate custom domain
        if not self._validate_domain(config.get('custom_domain')):
            raise ValueError("Invalid custom domain")
        
        # Create DNS records (in production, this would integrate with Cloudflare/AWS Route53)
        dns_setup = self._setup_dns(config['custom_domain'])
        
        # SSL Certificate
        ssl_cert = self._provision_ssl(config['custom_domain'])
        
        white_label = WhiteLabelConfig(
            tenant_id=tenant_id,
            company_name=config.get('company_name', 'EKA-AI'),
            logo_url=config.get('logo_url'),
            favicon_url=config.get('favicon_url'),
            primary_color=config.get('primary_color', '#f97316'),
            secondary_color=config.get('secondary_color', '#18181b'),
            custom_domain=config['custom_domain'],
            ssl_enabled=True,
            email_from_name=config.get('email_from_name', config['company_name']),
            email_from_address=config.get('email_from_address', 'noreply@eka-ai.com'),
            email_logo_url=config.get('email_logo_url'),
            login_page_text=config.get('login_page_text', 'Sign in to your workshop'),
            dashboard_welcome_message=config.get('dashboard_welcome_message', 
                                                'Welcome to your command center'),
            footer_text=config.get('footer_text', 'Powered by EKA-AI'),
            help_url=config.get('help_url', 'https://eka-ai.com/support'),
            privacy_url=config.get('privacy_url', 'https://eka-ai.com/privacy'),
            terms_url=config.get('terms_url', 'https://eka-ai.com/terms'),
            enabled_features=config.get('enabled_features', ['all']),
            disabled_features=config.get('disabled_features', []),
            integrations=config.get('integrations', {}),
            mobile_app_branding=config.get('mobile_app_branding', {}),
            support_phone=config.get('support_phone'),
            support_email=config.get('support_email'),
            support_chat_enabled=config.get('support_chat_enabled', False)
        )
        
        # Store configuration
        self._save_white_label_config(white_label)
        
        return white_label
    
    def get_branding_for_request(self, domain: str) -> Optional[WhiteLabelConfig]:
        """
        Get white-label config based on request domain.
        Called on every request to serve correct branding.
        """
        # Check if this is a custom domain
        if domain.endswith('.eka-ai.com'):
            # Extract subdomain
            subdomain = domain.replace('.eka-ai.com', '')
            return self._get_by_subdomain(subdomain)
        
        # Check custom domains
        return self._get_by_custom_domain(domain)
    
    def generate_email_template(self, tenant_id: str, template_type: str, 
                                 variables: Dict) -> Tuple[str, str]:
        """
        Generate branded email for white-label tenant.
        Returns: (subject, html_body)
        """
        config = self._get_config(tenant_id)
        
        templates = {
            'job_card_created': {
                'subject': f'Your vehicle service has started - {config.company_name}',
                'body': f'''
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="text-align: center; padding: 20px;">
                        <img src="{config.email_logo_url or config.logo_url}" 
                             style="max-width: 200px;" />
                    </div>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: {config.primary_color};">
                            Service Started
                        </h2>
                        <p>Hi {variables.get('customer_name')},</p>
                        <p>We've started working on your {variables.get('vehicle_model')}.</p>
                        <p><strong>Job Card:</strong> #{variables.get('job_card_number')}</p>
                        <p><strong>Estimated Completion:</strong> {variables.get('eta')}</p>
                        <br/>
                        <a href="{variables.get('tracking_url')}" 
                           style="background: {config.primary_color}; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                            Track Progress
                        </a>
                        <br/><br/>
                        <p style="color: #666; font-size: 12px;">
                            {config.footer_text}<br/>
                            {config.support_phone} | {config.support_email}
                        </p>
                    </div>
                </body>
                </html>
                '''
            },
            'invoice_ready': {
                'subject': f'Your invoice is ready - {config.company_name}',
                'body': f'''
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <div style="text-align: center; padding: 20px;">
                        <img src="{config.email_logo_url or config.logo_url}" 
                             style="max-width: 200px;" />
                    </div>
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: {config.primary_color};">Invoice Ready</h2>
                        <p>Your vehicle service is complete.</p>
                        <p><strong>Amount:</strong> ₹{variables.get('amount')}</p>
                        <p><strong>Invoice #:</strong> {variables.get('invoice_number')}</p>
                        <br/>
                        <a href="{variables.get('payment_url')}" 
                           style="background: {config.primary_color}; color: white; 
                                  padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                            Pay Now
                        </a>
                        <br/><br/>
                        <p>Thank you for choosing {config.company_name}!</p>
                    </div>
                </body>
                </html>
                '''
            }
        }
        
        template = templates.get(template_type, templates['job_card_created'])
        return template['subject'], template['body']
    
    def get_custom_css(self, tenant_id: str) -> str:
        """
        Generate custom CSS for white-label branding.
        Injected into the frontend.
        """
        config = self._get_config(tenant_id)
        
        return f'''
        :root {{
            --brand-primary: {config.primary_color};
            --brand-secondary: {config.secondary_color};
            --brand-logo: url({config.logo_url});
        }}
        
        .custom-logo {{
            content: url({config.logo_url});
        }}
        
        .custom-primary-bg {{
            background-color: {config.primary_color} !important;
        }}
        
        .custom-primary-text {{
            color: {config.primary_color} !important;
        }}
        
        .login-welcome-text::before {{
            content: "{config.login_page_text}";
        }}
        
        .dashboard-welcome::before {{
            content: "{config.dashboard_welcome_message}";
        }}
        
        .custom-footer::before {{
            content: "{config.footer_text}";
        }}
        '''
    
    def _validate_domain(self, domain: str) -> bool:
        """Validate custom domain format"""
        pattern = r'^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, domain))
    
    def _setup_dns(self, domain: str) -> Dict:
        """Setup DNS records for custom domain"""
        return {
            "cname_record": f"{domain} -> cname.eka-ai.com",
            "txt_verification": f"eka-verify-{hash(domain) % 10000}"
        }
    
    def _provision_ssl(self, domain: str) -> Dict:
        """Provision SSL certificate via Let's Encrypt"""
        return {
            "provider": "Let's Encrypt",
            "auto_renew": True,
            "status": "active"
        }
    
    def _save_white_label_config(self, config: WhiteLabelConfig):
        """Save to database"""
        pass  # Implementation
    
    def _get_config(self, tenant_id: str) -> WhiteLabelConfig:
        """Get config from database"""
        # Return default for now
        return WhiteLabelConfig(
            tenant_id=tenant_id,
            company_name="EKA-AI",
            logo_url="/logo.png",
            favicon_url="/favicon.ico",
            primary_color="#f97316",
            secondary_color="#18181b",
            custom_domain="",
            ssl_enabled=True,
            email_from_name="EKA-AI",
            email_from_address="noreply@eka-ai.com",
            email_logo_url="/logo.png",
            login_page_text="Sign in to your workshop",
            dashboard_welcome_message="Welcome to your command center",
            footer_text="Powered by EKA-AI",
            help_url="https://eka-ai.com/support",
            privacy_url="https://eka-ai.com/privacy",
            terms_url="https://eka-ai.com/terms",
            enabled_features=["all"],
            disabled_features=[],
            integrations={},
            mobile_app_branding={},
            support_phone="",
            support_email="",
            support_chat_enabled=False
        )
    
    def _get_by_subdomain(self, subdomain: str) -> Optional[WhiteLabelConfig]:
        """Get white-label config by subdomain"""
        return None  # Implementation
    
    def _get_by_custom_domain(self, domain: str) -> Optional[WhiteLabelConfig]:
        """Get white-label config by custom domain"""
        return None  # Implementation


# Example: Setup white-label for a large chain
def example_setup_mahindra_white_label():
    """
    Example: Mahindra wants their own branded version of EKA-AI
    for their service network.
    """
    manager = WhiteLabelManager(None)
    
    config = {
        "company_name": "Mahindra Service Network",
        "logo_url": "https://mahindra.com/assets/logo.png",
        "primary_color": "#C71718",  # Mahindra Red
        "secondary_color": "#1A1A1A",
        "custom_domain": "service.mahindra.com",
        "email_from_name": "Mahindra Service",
        "email_from_address": "service@mahindra.com",
        "login_page_text": "Welcome to Mahindra Authorized Service Center",
        "dashboard_welcome_message": "Mahindra Service Command Center",
        "footer_text": "Mahindra & Mahindra Ltd. | Service Network",
        "help_url": "https://service.mahindra.com/help",
        "support_phone": "1800-209-6006",
        "support_email": "service.support@mahindra.com",
        "enabled_features": [
            "job_cards", "ai_diagnostics", "inventory", 
            "customer_management", "invoicing", "fleet_management",
            "warranty_management", "genuine_parts_catalog"
        ],
        "disabled_features": ["competitor_comparison", "multi_brand_support"],
        "integrations": {
            "payment_gateway": "payu_mahindra",
            "sms_provider": "valuefirst_mahindra",
            "parts_catalog": "mahindra_genuine_parts_api"
        }
    }
    
    return manager.setup_white_label("tenant_mahindra_001", config)
