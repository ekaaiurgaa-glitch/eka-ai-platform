import os
import requests

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

    def send_pdf_template(self, phone_number, template_name, pdf_url, variables=None):
        """
        Sends a template message with PDF header via Interakt.
        The PDF URL must be in headerValues for document templates.
        """
        payload = {
            "fullPhoneNumber": phone_number,
            "type": "Template",
            "template": {
                "name": template_name,
                "languageCode": "en",
                "headerValues": [pdf_url],  # Correct placement for PDF/document media
                "bodyValues": variables or []  # Text variables for body
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
        # Uses a template with document header and body text
        return self.send_pdf_template(
            phone_number, 
            template_name="document_delivery", 
            pdf_url=pdf_url,
            variables=[filename, pdf_url]
        )
