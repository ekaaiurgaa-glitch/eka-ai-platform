import os
import requests
import base64

class WhatsappService:
    BASE_URL = "https://api.interakt.ai/v1/public"
    
    def __init__(self):
        self.api_key = os.getenv("INTERAKT_API_KEY")
        self.headers = {
            "Authorization": f"Basic {self.api_key}",
            "Content-Type": "application/json"
        }

    def send_template_message(self, phone_number, template_name, body_values=None):
        """
        Sends a template message via Interakt.
        phone_number: Format with country code (e.g., 919876543210)
        body_values: List of strings to replace variables {{1}}, {{2}} in template
        """
        payload = {
            "fullPhoneNumber": phone_number,
            "type": "Template",
            "template": {
                "name": template_name,
                "languageCode": "en",
                "bodyValues": body_values or []
            }
        }
        
        response = requests.post(
            f"{self.BASE_URL}/message/",
            json=payload,
            headers=self.headers
        )
        return response.json()

    def send_pdf_document(self, phone_number, pdf_url, filename="Invoice.pdf"):
        """Sends a PDF link (WhatsApp renders preview)"""
        # Note: Direct PDF binary upload requires media API; 
        # For MVP, we send a template with a link to the PDF hosted on Supabase Storage.
        return self.send_template_message(
            phone_number, 
            template_name="document_delivery", 
            body_values=[filename, pdf_url]
        )
