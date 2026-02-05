"""
InvoiceManager - GST-Compliant Invoice Generation System
Governed Automobile Intelligence System for Go4Garage Private Limited

Features:
- Unique invoice numbering (PREFIX-YYYY-XXXXX)
- GST-compliant structure (CGST/SGST/IGST)
- PDF generation with WeasyPrint
- Credit/Debit note support
"""

from datetime import datetime, timezone, date
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
import uuid
import logging
import os

logger = logging.getLogger(__name__)

# Try to import WeasyPrint for PDF generation
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    logger.warning("WeasyPrint not available. PDF generation will be disabled.")


class InvoiceStatus(str, Enum):
    """Invoice status values"""
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"


class InvoiceItemType(str, Enum):
    """Invoice item types"""
    PART = "PART"
    LABOR = "LABOR"
    MG_ADJUSTMENT = "MG_ADJUSTMENT"


class TaxType(str, Enum):
    """Tax types for invoicing"""
    CGST_SGST = "CGST_SGST"
    IGST = "IGST"


@dataclass
class InvoiceItem:
    """Individual invoice line item"""
    id: Optional[str] = None
    invoice_id: Optional[str] = None
    item_type: InvoiceItemType = InvoiceItemType.PART
    description: str = ""
    hsn_sac_code: str = ""
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    gst_rate: Decimal = Decimal("18")
    
    # Calculated fields
    taxable_value: Decimal = field(init=False)
    tax_amount: Decimal = field(init=False)
    igst_amount: Decimal = field(init=False)
    cgst_amount: Decimal = field(init=False)
    sgst_amount: Decimal = field(init=False)
    total_amount: Decimal = field(init=False)
    
    def __post_init__(self):
        self.calculate_amounts()
    
    def calculate_amounts(self):
        """Calculate all monetary amounts"""
        # Taxable value
        self.taxable_value = (self.quantity * self.unit_price) - self.discount_amount
        self.taxable_value = self.taxable_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        # Tax calculations
        self.tax_amount = (self.taxable_value * self.gst_rate / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        # Split for CGST/SGST
        self.igst_amount = Decimal("0")
        self.cgst_amount = (self.tax_amount / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.sgst_amount = (self.tax_amount / 2).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        
        # Total
        self.total_amount = self.taxable_value + self.tax_amount
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "invoice_id": self.invoice_id,
            "item_type": self.item_type.value,
            "description": self.description,
            "hsn_sac_code": self.hsn_sac_code,
            "quantity": float(self.quantity),
            "unit_price": float(self.unit_price),
            "discount_amount": float(self.discount_amount),
            "gst_rate": float(self.gst_rate),
            "taxable_value": float(self.taxable_value),
            "tax_amount": float(self.tax_amount),
            "igst_amount": float(self.igst_amount),
            "cgst_amount": float(self.cgst_amount),
            "sgst_amount": float(self.sgst_amount),
            "total_amount": float(self.total_amount)
        }


@dataclass
class Invoice:
    """Complete invoice data structure"""
    id: str
    job_card_id: str
    workshop_id: str
    invoice_number: str
    customer_gstin: Optional[str] = None
    customer_name: str = ""
    customer_address: str = ""
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    tax_type: TaxType = TaxType.CGST_SGST
    
    # Financial fields (calculated)
    total_taxable_value: Decimal = field(default_factory=lambda: Decimal("0"))
    total_tax_amount: Decimal = field(default_factory=lambda: Decimal("0"))
    grand_total: Decimal = field(default_factory=lambda: Decimal("0"))
    
    status: InvoiceStatus = InvoiceStatus.DRAFT
    due_date: Optional[date] = None
    
    # Timestamps
    generated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    generated_by: Optional[str] = None
    finalized_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    
    notes: Optional[str] = None
    items: List[InvoiceItem] = field(default_factory=list)
    
    def calculate_totals(self):
        """Recalculate all invoice totals"""
        self.total_taxable_value = sum(item.taxable_value for item in self.items)
        self.total_tax_amount = sum(item.tax_amount for item in self.items)
        self.grand_total = sum(item.total_amount for item in self.items)
        
        # Round all values
        self.total_taxable_value = self.total_taxable_value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.total_tax_amount = self.total_tax_amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        self.grand_total = self.grand_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "job_card_id": self.job_card_id,
            "workshop_id": self.workshop_id,
            "invoice_number": self.invoice_number,
            "customer_gstin": self.customer_gstin,
            "customer_name": self.customer_name,
            "customer_address": self.customer_address,
            "customer_phone": self.customer_phone,
            "customer_email": self.customer_email,
            "tax_type": self.tax_type.value,
            "total_taxable_value": float(self.total_taxable_value),
            "total_tax_amount": float(self.total_tax_amount),
            "grand_total": float(self.grand_total),
            "status": self.status.value,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "generated_at": self.generated_at.isoformat(),
            "generated_by": self.generated_by,
            "finalized_at": self.finalized_at.isoformat() if self.finalized_at else None,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
            "notes": self.notes,
            "items": [item.to_dict() for item in self.items]
        }


class InvoiceManager:
    """
    Invoice Manager - GST-Compliant Invoice Generation
    
    Responsibilities:
    - Generate unique invoice numbers
    - Calculate GST (CGST/SGST/IGST)
    - Generate PDF invoices
    - Manage invoice lifecycle
    """
    
    # Default HSN/SAC codes
    HSN_PARTS = "8708"  # 28% GST
    SAC_LABOR = "9987"  # 18% GST
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.invoices_table = "invoices"
        self.items_table = "invoice_items"
        self.sequences_table = "invoice_sequences"
        self.audit_table = "audit_logs"
        
        # Default invoice prefix
        self.default_prefix = os.environ.get("INVOICE_PREFIX", "G4G")
    
    # ═══════════════════════════════════════════════════════════════
    # INVOICE NUMBER GENERATION
    # ═══════════════════════════════════════════════════════════════
    
    def generate_invoice_number(
        self,
        workshop_id: str,
        prefix: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Generate unique invoice number (PREFIX-YYYY-XXXXX)
        
        Format: PREFIX-YYYY-XXXXX (e.g., G4G-2026-00001)
        
        Returns:
            (success: bool, invoice_number or error message)
        """
        try:
            current_year = datetime.now().year
            use_prefix = prefix or self.default_prefix
            fiscal_year = str(current_year)
            
            # Get or create sequence
            result = self.supabase.table(self.sequences_table)\
                .select("*")\
                .eq("workshop_id", workshop_id)\
                .eq("fiscal_year", fiscal_year)\
                .execute()
            
            if result.data:
                # Update existing sequence
                sequence = result.data[0]
                new_number = sequence["last_number"] + 1
                
                self.supabase.table(self.sequences_table)\
                    .update({
                        "last_number": new_number,
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    })\
                    .eq("workshop_id", workshop_id)\
                    .eq("fiscal_year", fiscal_year)\
                    .execute()
            else:
                # Create new sequence
                new_number = 1
                self.supabase.table(self.sequences_table).insert({
                    "workshop_id": workshop_id,
                    "fiscal_year": fiscal_year,
                    "last_number": new_number,
                    "prefix": use_prefix,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }).execute()
            
            # Format: PREFIX-YYYY-XXXXX
            invoice_number = f"{use_prefix}-{fiscal_year}-{new_number:05d}"
            
            return True, invoice_number
            
        except Exception as e:
            logger.error(f"Error generating invoice number: {e}")
            return False, str(e)
    
    # ═══════════════════════════════════════════════════════════════
    # INVOICE CRUD
    # ═══════════════════════════════════════════════════════════════
    
    def create_invoice(
        self,
        job_card_id: str,
        workshop_id: str,
        customer_details: Dict[str, Any],
        items: List[Dict[str, Any]],
        workshop_state: str,
        customer_state: str,
        generated_by: Optional[str] = None,
        notes: Optional[str] = None,
        due_days: int = 15
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Create a new invoice
        
        Args:
            job_card_id: Associated job card ID
            workshop_id: Workshop ID
            customer_details: Dict with customer_gstin, name, address, phone, email
            items: List of item dicts with type, description, qty, price, gst_rate
            workshop_state: Workshop state code (2-digit)
            customer_state: Customer state code (2-digit)
            generated_by: User ID
            notes: Invoice notes
            due_days: Days until due
        
        Returns:
            (success: bool, result: dict with invoice or error)
        """
        try:
            # Generate invoice number
            success, invoice_number = self.generate_invoice_number(workshop_id)
            if not success:
                return False, {"error": f"Failed to generate invoice number: {invoice_number}"}
            
            # Determine tax type
            tax_type = TaxType.IGST if workshop_state != customer_state else TaxType.CGST_SGST
            
            # Create invoice object
            invoice_id = str(uuid.uuid4())
            invoice = Invoice(
                id=invoice_id,
                job_card_id=job_card_id,
                workshop_id=workshop_id,
                invoice_number=invoice_number,
                customer_gstin=customer_details.get("customer_gstin"),
                customer_name=customer_details.get("customer_name", ""),
                customer_address=customer_details.get("customer_address", ""),
                customer_phone=customer_details.get("customer_phone"),
                customer_email=customer_details.get("customer_email"),
                tax_type=tax_type,
                generated_by=generated_by,
                notes=notes,
                due_date=date.today() + __import__("datetime").timedelta(days=due_days)
            )
            
            # Process items
            invoice.items = self._process_invoice_items(items, invoice_id)
            
            # Calculate totals
            invoice.calculate_totals()
            
            # Save to database
            invoice_data = {
                "id": invoice.id,
                "job_card_id": invoice.job_card_id,
                "workshop_id": invoice.workshop_id,
                "invoice_number": invoice.invoice_number,
                "customer_gstin": invoice.customer_gstin,
                "customer_name": invoice.customer_name,
                "customer_address": invoice.customer_address,
                "tax_type": invoice.tax_type.value,
                "total_taxable_value": float(invoice.total_taxable_value),
                "total_tax_amount": float(invoice.total_tax_amount),
                "grand_total": float(invoice.grand_total),
                "status": invoice.status.value,
                "due_date": invoice.due_date.isoformat() if invoice.due_date else None,
                "generated_at": invoice.generated_at.isoformat(),
                "generated_by": invoice.generated_by,
                "notes": invoice.notes
            }
            
            result = self.supabase.table(self.invoices_table).insert(invoice_data).execute()
            
            if not result.data:
                return False, {"error": "Failed to create invoice"}
            
            # Save items
            for item in invoice.items:
                item.id = str(uuid.uuid4())
                item_data = item.to_dict()
                item_data["id"] = item.id
                self.supabase.table(self.items_table).insert(item_data).execute()
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=generated_by,
                action="CREATE_INVOICE",
                entity_type="INVOICE",
                entity_id=invoice_id,
                new_values={"invoice_number": invoice_number, "amount": float(invoice.grand_total)}
            )
            
            return True, {"invoice": invoice.to_dict()}
            
        except Exception as e:
            logger.error(f"Error creating invoice: {e}")
            return False, {"error": str(e)}
    
    def get_invoice(
        self,
        invoice_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get invoice by ID
        
        Returns:
            (success: bool, result: dict with invoice or error)
        """
        try:
            query = self.supabase.table(self.invoices_table).select("*").eq("id", invoice_id)
            if workshop_id:
                query = query.eq("workshop_id", workshop_id)
            
            result = query.execute()
            
            if not result.data:
                return False, {"error": "Invoice not found"}
            
            invoice_data = result.data[0]
            
            # Get items
            items_result = self.supabase.table(self.items_table)\
                .select("*")\
                .eq("invoice_id", invoice_id)\
                .execute()
            
            invoice_data["items"] = items_result.data
            
            return True, {"invoice": invoice_data}
            
        except Exception as e:
            logger.error(f"Error fetching invoice: {e}")
            return False, {"error": str(e)}
    
    def get_invoice_by_number(
        self,
        invoice_number: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """Get invoice by invoice number"""
        try:
            query = self.supabase.table(self.invoices_table)\
                .select("*")\
                .eq("invoice_number", invoice_number)
            
            if workshop_id:
                query = query.eq("workshop_id", workshop_id)
            
            result = query.execute()
            
            if not result.data:
                return False, {"error": "Invoice not found"}
            
            invoice_data = result.data[0]
            
            # Get items
            items_result = self.supabase.table(self.items_table)\
                .select("*")\
                .eq("invoice_id", invoice_data["id"])\
                .execute()
            
            invoice_data["items"] = items_result.data
            
            return True, {"invoice": invoice_data}
            
        except Exception as e:
            logger.error(f"Error fetching invoice by number: {e}")
            return False, {"error": str(e)}
    
    def list_invoices(
        self,
        workshop_id: str,
        status: Optional[InvoiceStatus] = None,
        job_card_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        List invoices with filters
        
        Returns:
            (success: bool, result: dict with invoices and pagination)
        """
        try:
            query = self.supabase.table(self.invoices_table)\
                .select("*", count="exact")\
                .eq("workshop_id", workshop_id)
            
            if status:
                query = query.eq("status", status.value)
            if job_card_id:
                query = query.eq("job_card_id", job_card_id)
            
            query = query.order("generated_at", desc=True)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            return True, {
                "invoices": result.data,
                "count": result.count or len(result.data),
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error listing invoices: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # INVOICE LIFECYCLE
    # ═══════════════════════════════════════════════════════════════
    
    def finalize_invoice(
        self,
        invoice_id: str,
        workshop_id: str,
        finalized_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Finalize invoice (move from DRAFT to SENT)
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            update_data = {
                "status": InvoiceStatus.SENT.value,
                "finalized_at": datetime.now(timezone.utc).isoformat(),
                "sent_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.invoices_table)\
                .update(update_data)\
                .eq("id", invoice_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Invoice not found"}
            
            self._log_audit(
                workshop_id=workshop_id,
                user_id=finalized_by,
                action="FINALIZE_INVOICE",
                entity_type="INVOICE",
                entity_id=invoice_id
            )
            
            return True, {"success": True, "status": InvoiceStatus.SENT.value}
            
        except Exception as e:
            logger.error(f"Error finalizing invoice: {e}")
            return False, {"error": str(e)}
    
    def mark_paid(
        self,
        invoice_id: str,
        workshop_id: str,
        paid_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Mark invoice as paid
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            update_data = {
                "status": InvoiceStatus.PAID.value,
                "paid_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.invoices_table)\
                .update(update_data)\
                .eq("id", invoice_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Invoice not found"}
            
            self._log_audit(
                workshop_id=workshop_id,
                user_id=paid_by,
                action="MARK_INVOICE_PAID",
                entity_type="INVOICE",
                entity_id=invoice_id
            )
            
            return True, {"success": True, "status": InvoiceStatus.PAID.value}
            
        except Exception as e:
            logger.error(f"Error marking invoice paid: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # PDF GENERATION
    # ═══════════════════════════════════════════════════════════════
    
    def generate_pdf(
        self,
        invoice_id: str,
        workshop_id: str,
        workshop_details: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, bytes]:
        """
        Generate PDF invoice
        
        Args:
            invoice_id: Invoice ID
            workshop_id: Workshop ID
            workshop_details: Workshop info (name, address, GSTIN, logo)
        
        Returns:
            (success: bool, pdf_bytes or error message)
        """
        if not WEASYPRINT_AVAILABLE:
            return False, b"PDF generation not available"
        
        try:
            # Get invoice
            success, result = self.get_invoice(invoice_id, workshop_id)
            if not success:
                return False, result["error"].encode()
            
            invoice_data = result["invoice"]
            
            # Generate HTML
            html_content = self._generate_invoice_html(invoice_data, workshop_details)
            
            # Generate PDF
            html = HTML(string=html_content)
            pdf_bytes = html.write_pdf()
            
            return True, pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDF: {e}")
            return False, str(e).encode()
    
    def _generate_invoice_html(
        self,
        invoice: Dict[str, Any],
        workshop_details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate HTML for invoice PDF"""
        
        workshop = workshop_details or {}
        items = invoice.get("items", [])
        
        # Build items rows
        items_html = ""
        for i, item in enumerate(items, 1):
            items_html += f"""
            <tr>
                <td>{i}</td>
                <td>{item['description']}</td>
                <td>{item['hsn_sac_code']}</td>
                <td>{item['quantity']}</td>
                <td>₹{item['unit_price']:.2f}</td>
                <td>₹{item['taxable_value']:.2f}</td>
                <td>{item['gst_rate']:.1f}%</td>
                <td>₹{item['total_amount']:.2f}</td>
            </tr>
            """
        
        # Tax breakdown
        tax_breakdown = ""
        if invoice.get("tax_type") == "CGST_SGST":
            cgst = sum(item.get('cgst_amount', 0) for item in items)
            sgst = sum(item.get('sgst_amount', 0) for item in items)
            tax_breakdown = f"""
                <tr><td>CGST</td><td>₹{cgst:.2f}</td></tr>
                <tr><td>SGST</td><td>₹{sgst:.2f}</td></tr>
            """
        else:
            igst = sum(item.get('igst_amount', 0) for item in items)
            tax_breakdown = f"<tr><td>IGST</td><td>₹{igst:.2f}</td></tr>"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice {invoice['invoice_number']}</title>
            <style>
                @page {{ size: A4; margin: 2cm; }}
                body {{ font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; }}
                .header {{ text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ margin: 0; color: #333; }}
                .workshop-info {{ text-align: center; margin-bottom: 20px; }}
                .invoice-details {{ display: flex; justify-content: space-between; margin-bottom: 20px; }}
                .section {{ margin-bottom: 15px; }}
                .section h3 {{ margin: 0 0 5px 0; color: #555; border-bottom: 1px solid #ddd; }}
                table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #f5f5f5; font-weight: bold; }}
                .totals {{ margin-top: 20px; text-align: right; }}
                .totals table {{ width: 50%; margin-left: auto; }}
                .totals td {{ border: none; padding: 5px; }}
                .grand-total {{ font-size: 14pt; font-weight: bold; color: #333; }}
                .footer {{ margin-top: 30px; padding-top: 10px; border-top: 1px solid #ddd; text-align: center; font-size: 9pt; color: #666; }}
                .gst-badge {{ background: #f18a22; color: white; padding: 2px 8px; border-radius: 3px; font-size: 8pt; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>TAX INVOICE</h1>
                <span class="gst-badge">GST</span>
            </div>
            
            <div class="workshop-info">
                <h2>{workshop.get('name', 'Go4Garage')}</h2>
                <p>{workshop.get('address', '')}</p>
                <p>GSTIN: {workshop.get('gstin', '')} | Phone: {workshop.get('phone', '')}</p>
            </div>
            
            <div class="invoice-details">
                <div class="section">
                    <h3>Invoice Details</h3>
                    <p><strong>Invoice Number:</strong> {invoice['invoice_number']}</p>
                    <p><strong>Date:</strong> {invoice['generated_at'][:10]}</p>
                    <p><strong>Due Date:</strong> {invoice.get('due_date', 'N/A')}</p>
                    <p><strong>Status:</strong> {invoice['status']}</p>
                </div>
                <div class="section">
                    <h3>Bill To</h3>
                    <p><strong>{invoice['customer_name']}</strong></p>
                    <p>{invoice['customer_address']}</p>
                    <p>GSTIN: {invoice.get('customer_gstin', 'N/A')}</p>
                    <p>Phone: {invoice.get('customer_phone', 'N/A')}</p>
                </div>
            </div>
            
            <div class="section">
                <h3>Items</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Description</th>
                            <th>HSN/SAC</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Taxable</th>
                            <th>GST</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
            </div>
            
            <div class="totals">
                <table>
                    <tr><td>Subtotal:</td><td>₹{invoice['total_taxable_value']:.2f}</td></tr>
                    {tax_breakdown}
                    <tr class="grand-total"><td>Grand Total:</td><td>₹{invoice['grand_total']:.2f}</td></tr>
                </table>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>This is a computer-generated invoice.</p>
            </div>
        </body>
        </html>
        """
        
        return html
    
    # ═══════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ═══════════════════════════════════════════════════════════════
    
    def _process_invoice_items(
        self,
        items_data: List[Dict[str, Any]],
        invoice_id: str
    ) -> List[InvoiceItem]:
        """Process raw item data into InvoiceItem objects"""
        items = []
        
        for item_data in items_data:
            item = InvoiceItem(
                id=str(uuid.uuid4()),
                invoice_id=invoice_id,
                item_type=InvoiceItemType(item_data.get("type", "PART")),
                description=item_data.get("description", ""),
                hsn_sac_code=item_data.get("hsn_sac_code", self.HSN_PARTS),
                quantity=Decimal(str(item_data.get("quantity", 1))),
                unit_price=Decimal(str(item_data.get("unit_price", 0))),
                discount_amount=Decimal(str(item_data.get("discount", 0))),
                gst_rate=Decimal(str(item_data.get("gst_rate", 18)))
            )
            items.append(item)
        
        return items
    
    def _log_audit(
        self,
        workshop_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        user_id: Optional[str] = None,
        old_values: Optional[Dict] = None,
        new_values: Optional[Dict] = None
    ):
        """Log audit entry"""
        try:
            self.supabase.table(self.audit_table).insert({
                "workshop_id": workshop_id,
                "user_id": user_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "old_values": old_values,
                "new_values": new_values
            }).execute()
        except Exception as e:
            logger.error(f"Error logging audit: {e}")


# ═══════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════

_invoice_manager: Optional[InvoiceManager] = None


def get_invoice_manager(supabase_client) -> InvoiceManager:
    """Get or create InvoiceManager singleton"""
    global _invoice_manager
    if _invoice_manager is None:
        _invoice_manager = InvoiceManager(supabase_client)
    return _invoice_manager
