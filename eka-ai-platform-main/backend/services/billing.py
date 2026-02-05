"""
Invoice Governance Service
Handles GST calculations and invoice totals with financial precision.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Literal

TaxType = Literal["CGST_SGST", "IGST"]


def calculate_gst(amount: Decimal, gst_rate: Decimal, is_interstate: bool) -> Dict[str, Decimal]:
    """
    Computes GST split based on interstate vs intrastate transaction.
    
    State Logic: 
    - Same State: CGST (9%) + SGST (9%) = 18%
    - Different State: IGST (18%)
    
    Args:
        amount: Taxable amount
        gst_rate: GST rate percentage (e.g., 18.0 for 18%)
        is_interstate: True if inter-state transaction
        
    Returns:
        Dictionary with tax breakdown
    """
    tax_amount = (amount * (gst_rate / Decimal(100))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    
    if is_interstate:
        return {
            "tax_type": "IGST",
            "igst_amount": tax_amount,
            "cgst_amount": Decimal(0),
            "sgst_amount": Decimal(0),
            "total_tax": tax_amount
        }
    else:
        half_tax = (tax_amount / Decimal(2)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return {
            "tax_type": "CGST_SGST",
            "igst_amount": Decimal(0),
            "cgst_amount": half_tax,
            "sgst_amount": half_tax,
            "total_tax": tax_amount
        }


def calculate_invoice_totals(
    items: List[Dict], 
    workshop_state: str, 
    customer_state: str
) -> Dict:
    """
    Calculates totals with proper GST handling for invoice generation.
    
    Args:
        items: List of invoice items with quantity, unit_price, gst_rate
        workshop_state: State code of workshop (e.g., '27' for Maharashtra)
        customer_state: State code of customer
        
    Returns:
        Dictionary with invoice totals
    """
    is_interstate = workshop_state != customer_state
    total_taxable = Decimal(0)
    total_tax = Decimal(0)
    
    processed_items = []
    
    for item in items:
        quantity = Decimal(str(item.get('quantity', 0)))
        unit_price = Decimal(str(item.get('unit_price', 0)))
        gst_rate = Decimal(str(item.get('gst_rate', 0)))
        
        taxable = (quantity * unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        tax = calculate_gst(taxable, gst_rate, is_interstate)
        
        total_taxable += taxable
        total_tax += tax['total_tax']
        
        processed_items.append({
            **item,
            "taxable_value": float(taxable),
            "tax_amount": float(tax['total_tax']),
            "igst_amount": float(tax['igst_amount']),
            "cgst_amount": float(tax['cgst_amount']),
            "sgst_amount": float(tax['sgst_amount'])
        })
    
    grand_total = total_taxable + total_tax
    
    return {
        "tax_type": "IGST" if is_interstate else "CGST_SGST",
        "total_taxable_value": float(total_taxable.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        "total_tax_amount": float(total_tax.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        "grand_total": float(grand_total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
        "is_interstate": is_interstate,
        "items": processed_items
    }


def validate_gstin(gstin: str) -> Dict[str, any]:
    """
    Validates GSTIN format and extracts state code.
    
    GSTIN Format: 2-digit state code + PAN (10) + entity (1) + Z + checksum (1)
    Total: 15 characters
    
    Args:
        gstin: GST identification number
        
    Returns:
        Dictionary with validation result and extracted info
    """
    if not gstin or len(gstin) != 15:
        return {"valid": False, "error": "GSTIN must be 15 characters"}
    
    # State code extraction (first 2 digits)
    state_code = gstin[:2]
    
    # Basic format validation
    import re
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    
    if not re.match(pattern, gstin):
        return {"valid": False, "error": "Invalid GSTIN format"}
    
    return {
        "valid": True,
        "state_code": state_code,
        "pan": gstin[2:12],
        "entity_number": gstin[12],
        "checksum": gstin[14]
    }


def determine_tax_type(workshop_state: str, customer_state: str) -> TaxType:
    """
    Determines tax type based on state codes.
    
    Args:
        workshop_state: Workshop state code
        customer_state: Customer state code
        
    Returns:
        'IGST' if interstate, 'CGST_SGST' if intrastate
    """
    return "IGST" if workshop_state != customer_state else "CGST_SGST"
