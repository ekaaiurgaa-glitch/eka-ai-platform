"""
EKA-AI Platform: GST E-Invoicing (IRN) Integration
Generates IRN-compliant JSON for Invoice Registration Portal (IRP).
Compliant with GST Council e-Invoice schema INV-01.
"""

import json
import hashlib
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)


class GSPClient:
    """
    GST Suvidha Provider (GSP) API Client.
    Handles IRN generation via NIC or authorized GSP.
    """
    
    def __init__(self, gsp_api_key: str, gsp_api_secret: str, sandbox: bool = True):
        self.api_key = gsp_api_key
        self.api_secret = gsp_api_secret
        self.sandbox = sandbox
        self.base_url = "https://einv-apisandbox.nic.in" if sandbox else "https://einv-api.nic.in"
    
    def generate_irn(self, invoice_data: Dict) -> Dict[str, Any]:
        """
        Generate IRN (Invoice Reference Number) for invoice.
        
        Args:
            invoice_data: JSON payload per INV-01 schema
            
        Returns:
            Dict with IRN, QR code, and signed invoice
        """
        # In production: POST to /eicore/v1.03/Invoice
        # For now, return mock response
        
        irn = self._calculate_irn(invoice_data)
        
        return {
            "success": True,
            "irn": irn,
            "irn_status": "ACT",
            "irn_gen_date": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "qr_code": f"data:image/png;base64,{self._mock_qr_code()}",
            "ack_no": str(uuid.uuid4().int % 1000000000),
            "ack_date": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "signed_invoice": self._mock_signed_invoice(invoice_data),
            "status": "SUCCESS"
        }
    
    def _calculate_irn(self, invoice_data: Dict) -> str:
        """
        Calculate IRN hash from supplier GSTIN, invoice number, and date.
        Formula: SHA256(GSTIN | InvoiceNo | InvoiceDate)
        """
        seller_gstin = invoice_data.get('SellerDtls', {}).get('Gstin', '')
        doc_no = invoice_data.get('DocDtls', {}).get('No', '')
        doc_date = invoice_data.get('DocDtls', {}).get('Dt', '')
        
        hash_input = f"{seller_gstin}|{doc_no}|{doc_date}"
        return hashlib.sha256(hash_input.encode()).hexdigest().upper()
    
    def _mock_qr_code(self) -> str:
        """Generate mock QR code (base64)"""
        return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
    
    def _mock_signed_invoice(self, invoice_data: Dict) -> str:
        """Generate mock signed invoice"""
        return hashlib.sha256(json.dumps(invoice_data).encode()).hexdigest()


class EInvoiceGenerator:
    """
    Generates INV-01 compliant e-Invoice JSON.
    """
    
    # SAC Codes for automobile services
    SAC_CODES = {
        "repair_maintenance": "998714",      # Maintenance and repair services
        "cleaning_services": "998719",        # Other maintenance services
        "towing": "998731",                   # Road freight transport
        "diagnostic": "998714",               # Same as repair
        "saas_platform": "998431",            # Online information database access
        "consulting": "998341",               # Management consulting
    }
    
    def __init__(self, gsp_client: Optional[GSPClient] = None):
        self.gsp_client = gsp_client
    
    def generate_invoice_json(
        self,
        invoice_number: str,
        invoice_date: str,
        seller_gstin: str,
        seller_name: str,
        seller_address: str,
        seller_state_code: str,
        buyer_gstin: str,
        buyer_name: str,
        buyer_address: str,
        buyer_state_code: str,
        items: list,
        total_assessable_value: Decimal,
        total_igst: Decimal,
        total_cgst: Decimal,
        total_sgst: Decimal,
        total_invoice_value: Decimal,
        is_reverse_charge: bool = False,
        is_export: bool = False
    ) -> Dict[str, Any]:
        """
        Generate INV-01 compliant JSON payload.
        
        Args:
            invoice_number: Unique invoice number
            invoice_date: DD/MM/YYYY format
            seller_gstin: 15-digit GSTIN
            seller_name: Legal name
            seller_address: Address
            seller_state_code: 2-digit state code (e.g., '27' for MH)
            buyer_gstin: 15-digit GSTIN
            buyer_name: Legal name
            buyer_address: Address
            buyer_state_code: 2-digit state code
            items: List of items with HSN/SAC, quantity, value
            total_assessable_value: Pre-tax total
            total_igst: IGST amount
            total_cgst: CGST amount
            total_sgst: SGST amount
            total_invoice_value: Final total
            is_reverse_charge: RCM applicable
            is_export: SEZ/export invoice
        """
        
        # Transaction details
        is_interstate = seller_state_code != buyer_state_code
        supply_type = "EXP" if is_export else ("INTER" if is_interstate else "INTRA")
        
        invoice_json = {
            "Version": "1.1",
            "TranDtls": {
                "TaxSch": "GST",
                "SupTyp": supply_type,
                "RegRev": "Y" if is_reverse_charge else "N",
                "EcmGstin": None,
                "IgstOnIntra": "N"
            },
            "DocDtls": {
                "Typ": "INV",
                "No": invoice_number,
                "Dt": invoice_date
            },
            "SellerDtls": {
                "Gstin": seller_gstin,
                "LglNm": seller_name,
                "TrdNm": seller_name,
                "Addr1": seller_address[:100],
                "Addr2": "",
                "Loc": self._get_city_from_address(seller_address),
                "Pin": self._get_pincode_from_address(seller_address) or "400069",
                "Stcd": seller_state_code,
                "Ph": None,
                "Em": None
            },
            "BuyerDtls": {
                "Gstin": buyer_gstin,
                "LglNm": buyer_name,
                "TrdNm": buyer_name,
                "Pos": buyer_state_code,  # Place of supply
                "Addr1": buyer_address[:100],
                "Addr2": "",
                "Loc": self._get_city_from_address(buyer_address),
                "Pin": self._get_pincode_from_address(buyer_address) or "400069",
                "Stcd": buyer_state_code,
                "Ph": None,
                "Em": None
            },
            "DispDtls": None,  # Dispatch from (if different from seller)
            "ShipDtls": None,  # Ship to (if different from buyer)
            "ItemList": [],
            "ValDtls": {
                "AssVal": float(total_assessable_value),
                "CgstVal": float(total_cgst),
                "SgstVal": float(total_sgst),
                "IgstVal": float(total_igst),
                "CesVal": 0,
                "StCesVal": 0,
                "Discount": 0,
                "OthChrg": 0,
                "RndOffAmt": 0,
                "TotInvVal": float(total_invoice_value),
                "TotInvValFc": None
            },
            "PayDtls": None,  # Payment details (optional)
            "RefDtls": None,  # Reference details (optional)
            "AddlDocDtls": [],  # Additional documents
            "ExpDtls": None,  # Export details (if applicable)
            "EwbDtls": None,  # E-way bill details (optional)
        }
        
        # Add items
        for idx, item in enumerate(items, 1):
            invoice_json["ItemList"].append({
                "SlNo": str(idx),
                "PrdDesc": item.get('description', 'Service')[:300],
                "IsServc": "Y",
                "HsnCd": item.get('hsn_sac_code', '998714'),
                "Barcde": None,
                "Qty": float(item.get('quantity', 1)),
                "FreeQty": 0,
                "Unit": item.get('unit', 'NOS'),
                "UnitPrice": float(item.get('unit_price', 0)),
                "TotAmt": float(item.get('total_amount', 0)),
                "Discount": float(item.get('discount', 0)),
                "PreTaxVal": float(item.get('taxable_value', 0)),
                "AssAmt": float(item.get('taxable_value', 0)),
                "GstRt": float(item.get('gst_rate', 18)),
                "IgstAmt": float(item.get('igst_amount', 0)),
                "CgstAmt": float(item.get('cgst_amount', 0)),
                "SgstAmt": float(item.get('sgst_amount', 0)),
                "CesRt": 0,
                "CesAmt": 0,
                "CesNonAdvlAmt": 0,
                "StateCesRt": 0,
                "StateCesAmt": 0,
                "StateCesNonAdvlAmt": 0,
                "OthChrg": 0,
                "TotItemVal": float(item.get('total_with_tax', item.get('total_amount', 0)))
            })
        
        return invoice_json
    
    def submit_to_irp(self, invoice_json: Dict) -> Dict[str, Any]:
        """
        Submit invoice to IRP for IRN generation.
        
        Returns:
            Dict with IRN, QR code, and acknowledgement
        """
        if not self.gsp_client:
            logger.error("GSP client not configured")
            return {
                "success": False,
                "error": "GSP client not configured",
                "irn": None
            }
        
        try:
            result = self.gsp_client.generate_irn(invoice_json)
            logger.info("IRN generated successfully", extra={
                "irn": result.get('irn'),
                "ack_no": result.get('ack_no')
            })
            return result
        except Exception as e:
            logger.error(f"IRN generation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "irn": None
            }
    
    def _get_city_from_address(self, address: str) -> str:
        """Extract city from address (simplified)"""
        parts = address.split(',')
        if len(parts) >= 2:
            return parts[-2].strip()[:50]
        return "Mumbai"
    
    def _get_pincode_from_address(self, address: str) -> Optional[str]:
        """Extract 6-digit PIN code from address"""
        import re
        match = re.search(r'\b\d{6}\b', address)
        return match.group(0) if match else None


# Company details for Go4Garage Private Limited
COMPANY_DETAILS = {
    "legal_name": "Go4Garage Private Limited",
    "trade_name": "EKA-AI",
    "gstin": "27AABCG1234D1Z5",  # Update with actual GSTIN
    "address": "123, Techno Park, Andheri East, Mumbai - 400069",
    "state_code": "27",  # Maharashtra
    "city": "Mumbai",
    "pincode": "400069",
    "email": "billing@eka-ai.com",
    "phone": "+91-22-1234-5678"
}


def generate_einvoice_for_job(
    job_card_id: str,
    customer_name: str,
    customer_gstin: str,
    customer_address: str,
    customer_state_code: str,
    items: list,
    subtotal: Decimal,
    gst_total: Decimal,
    grand_total: Decimal,
    gsp_client: Optional[GSPClient] = None
) -> Dict[str, Any]:
    """
    Convenience function to generate e-invoice for a job card.
    
    Args:
        job_card_id: Internal job card reference
        customer_name: Customer legal name
        customer_gstin: Customer GSTIN
        customer_address: Customer address
        customer_state_code: Customer state code
        items: List of items with pricing
        subtotal: Pre-tax amount
        gst_total: Total GST
        grand_total: Final amount
        gsp_client: Optional GSP client for IRN generation
        
    Returns:
        Dict with invoice JSON and IRN (if generated)
    """
    generator = EInvoiceGenerator(gsp_client)
    
    invoice_date = datetime.now().strftime("%d/%m/%Y")
    invoice_number = f"EKA-{job_card_id}-{datetime.now().strftime('%Y%m%d')}"
    
    # Calculate tax split
    is_interstate = COMPANY_DETAILS["state_code"] != customer_state_code
    
    if is_interstate:
        total_igst = gst_total
        total_cgst = Decimal(0)
        total_sgst = Decimal(0)
    else:
        total_igst = Decimal(0)
        tax_half = gst_total / 2
        total_cgst = tax_half
        total_sgst = tax_half
    
    # Generate invoice JSON
    invoice_json = generator.generate_invoice_json(
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        seller_gstin=COMPANY_DETAILS["gstin"],
        seller_name=COMPANY_DETAILS["legal_name"],
        seller_address=COMPANY_DETAILS["address"],
        seller_state_code=COMPANY_DETAILS["state_code"],
        buyer_gstin=customer_gstin or "URP",  # Unregistered Person
        buyer_name=customer_name,
        buyer_address=customer_address,
        buyer_state_code=customer_state_code or COMPANY_DETAILS["state_code"],
        items=items,
        total_assessable_value=subtotal,
        total_igst=total_igst,
        total_cgst=total_cgst,
        total_sgst=total_sgst,
        total_invoice_value=grand_total
    )
    
    result = {
        "success": True,
        "invoice_json": invoice_json,
        "irn": None,
        "qr_code": None
    }
    
    # Generate IRN if GSP client available
    if gsp_client:
        irn_result = generator.submit_to_irp(invoice_json)
        if irn_result.get("success"):
            result["irn"] = irn_result.get("irn")
            result["qr_code"] = irn_result.get("qr_code")
            result["ack_no"] = irn_result.get("ack_no")
            result["ack_date"] = irn_result.get("ack_date")
    
    return result
