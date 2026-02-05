"""
Unit tests for Billing and GST Calculations
Run with: python -m unittest backend.tests.test_billing
"""

import unittest
from decimal import Decimal
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.billing import calculate_gst, calculate_invoice_totals, validate_gstin, determine_tax_type


class TestGSTCalculations(unittest.TestCase):
    """Test GST calculation logic."""
    
    def test_cgst_sgst_calculation(self):
        """Intra-state: CGST 9% + SGST 9% = 18%"""
        result = calculate_gst(Decimal('1000.00'), Decimal('18.0'), is_interstate=False)
        
        self.assertEqual(result['tax_type'], 'CGST_SGST')
        self.assertEqual(result['igst_amount'], Decimal('0'))
        self.assertEqual(result['cgst_amount'], Decimal('90.00'))
        self.assertEqual(result['sgst_amount'], Decimal('90.00'))
        self.assertEqual(result['total_tax'], Decimal('180.00'))
    
    def test_igst_calculation(self):
        """Inter-state: IGST 18%"""
        result = calculate_gst(Decimal('1000.00'), Decimal('18.0'), is_interstate=True)
        
        self.assertEqual(result['tax_type'], 'IGST')
        self.assertEqual(result['igst_amount'], Decimal('180.00'))
        self.assertEqual(result['cgst_amount'], Decimal('0'))
        self.assertEqual(result['sgst_amount'], Decimal('0'))
        self.assertEqual(result['total_tax'], Decimal('180.00'))
    
    def test_parts_gst_28_percent(self):
        """Parts GST rate is 28%"""
        result = calculate_gst(Decimal('1000.00'), Decimal('28.0'), is_interstate=False)
        
        self.assertEqual(result['total_tax'], Decimal('280.00'))
        self.assertEqual(result['cgst_amount'], Decimal('140.00'))
        self.assertEqual(result['sgst_amount'], Decimal('140.00'))
    
    def test_rounding_half_up(self):
        """Test rounding behavior"""
        result = calculate_gst(Decimal('100.005'), Decimal('18.0'), is_interstate=False)
        # 100.005 * 0.18 = 18.0009 -> rounds to 18.00
        self.assertEqual(result['total_tax'], Decimal('18.00'))


class TestInvoiceTotals(unittest.TestCase):
    """Test complete invoice calculation."""
    
    def test_intrastate_invoice(self):
        """Invoice within same state (Maharashtra)"""
        items = [
            {'description': 'Brake Pad', 'quantity': 2, 'unit_price': 500.00, 'gst_rate': 28.0},
            {'description': 'Labor', 'quantity': 1, 'unit_price': 800.00, 'gst_rate': 18.0}
        ]
        
        result = calculate_invoice_totals(items, '27', '27')  # MH to MH
        
        self.assertEqual(result['tax_type'], 'CGST_SGST')
        self.assertFalse(result['is_interstate'])
        # Parts: 1000 taxable + 280 tax = 1280
        # Labor: 800 taxable + 144 tax = 944
        # Total: 1800 taxable + 424 tax = 2224
        self.assertEqual(result['total_taxable_value'], 1800.00)
        self.assertEqual(result['total_tax_amount'], 424.00)
        self.assertEqual(result['grand_total'], 2224.00)
    
    def test_interstate_invoice(self):
        """Invoice across states (MH to Karnataka)"""
        items = [
            {'description': 'Service', 'quantity': 1, 'unit_price': 1000.00, 'gst_rate': 18.0}
        ]
        
        result = calculate_invoice_totals(items, '27', '29')  # MH to KA
        
        self.assertEqual(result['tax_type'], 'IGST')
        self.assertTrue(result['is_interstate'])
        self.assertEqual(result['total_taxable_value'], 1000.00)
        self.assertEqual(result['total_tax_amount'], 180.00)
        self.assertEqual(result['grand_total'], 1180.00)
    
    def test_multiple_items(self):
        """Invoice with multiple parts and labor items"""
        items = [
            {'description': 'Part A', 'quantity': 1, 'unit_price': 1000.00, 'gst_rate': 28.0},
            {'description': 'Part B', 'quantity': 2, 'unit_price': 500.00, 'gst_rate': 28.0},
            {'description': 'Labor A', 'quantity': 1, 'unit_price': 500.00, 'gst_rate': 18.0},
            {'description': 'Labor B', 'quantity': 2, 'unit_price': 300.00, 'gst_rate': 18.0}
        ]
        
        result = calculate_invoice_totals(items, '27', '27')
        
        # Parts: 1000 + 1000 = 2000 taxable, 560 tax
        # Labor: 500 + 600 = 1100 taxable, 198 tax
        # Total: 3100 taxable, 758 tax, 3858 grand
        self.assertEqual(result['total_taxable_value'], 3100.00)
        self.assertEqual(result['total_tax_amount'], 758.00)
        self.assertEqual(result['grand_total'], 3858.00)
        self.assertEqual(len(result['items']), 4)
    
    def test_empty_items(self):
        """Empty items should return zeros"""
        result = calculate_invoice_totals([], '27', '27')
        
        self.assertEqual(result['total_taxable_value'], 0.00)
        self.assertEqual(result['total_tax_amount'], 0.00)
        self.assertEqual(result['grand_total'], 0.00)


class TestGSTINValidation(unittest.TestCase):
    """Test GSTIN format validation."""
    
    def test_valid_gstin(self):
        """Valid GSTIN format"""
        # Format: 2 digits + 5 letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
        result = validate_gstin('27AABCU9603R1ZX')
        
        self.assertTrue(result['valid'])
        self.assertEqual(result['state_code'], '27')
        self.assertEqual(result['pan'], 'AABCU9603R')
        self.assertEqual(result['entity_number'], '1')
        self.assertEqual(result['checksum'], 'X')
    
    def test_invalid_length(self):
        """GSTIN must be 15 characters"""
        result = validate_gstin('27AABCU9603R1Z')
        
        self.assertFalse(result['valid'])
        self.assertIn('15 characters', result['error'])
    
    def test_invalid_format(self):
        """Invalid character format"""
        result = validate_gstin('27AABCU9603R1Z!')
        
        self.assertFalse(result['valid'])
        self.assertIn('format', result['error'])
    
    def test_empty_gstin(self):
        """Empty GSTIN is invalid"""
        result = validate_gstin('')
        
        self.assertFalse(result['valid'])
    
    def test_none_gstin(self):
        """None GSTIN is invalid"""
        result = validate_gstin(None)
        
        self.assertFalse(result['valid'])


class TestTaxTypeDetermination(unittest.TestCase):
    """Test tax type determination."""
    
    def test_same_state_cgst_sgst(self):
        """Same state codes = CGST/SGST"""
        result = determine_tax_type('27', '27')
        self.assertEqual(result, 'CGST_SGST')
    
    def test_different_state_igst(self):
        """Different state codes = IGST"""
        result = determine_tax_type('27', '29')
        self.assertEqual(result, 'IGST')
    
    def test_reverse_state_igst(self):
        """Reverse direction still IGST"""
        result = determine_tax_type('29', '27')
        self.assertEqual(result, 'IGST')


class TestBillingAuditSafety(unittest.TestCase):
    """Test that all billing calculations are deterministic."""
    
    def test_deterministic_results(self):
        """Same inputs should always produce same outputs"""
        items = [
            {'description': 'Test', 'quantity': 1, 'unit_price': 1000.00, 'gst_rate': 18.0}
        ]
        
        result1 = calculate_invoice_totals(items, '27', '27')
        result2 = calculate_invoice_totals(items, '27', '27')
        
        self.assertEqual(result1['grand_total'], result2['grand_total'])
        self.assertEqual(result1['total_tax_amount'], result2['total_tax_amount'])
    
    def test_decimal_precision(self):
        """Test financial precision with decimals"""
        items = [
            {'description': 'Precision Test', 'quantity': 3, 'unit_price': 333.33, 'gst_rate': 18.0}
        ]
        
        result = calculate_invoice_totals(items, '27', '27')
        
        # 3 * 333.33 = 999.99 taxable
        # Tax = 999.99 * 0.18 = 179.9982 -> 180.00
        # Total = 999.99 + 180.00 = 1179.99
        self.assertEqual(result['total_taxable_value'], 999.99)
        self.assertEqual(result['total_tax_amount'], 180.00)
        self.assertEqual(result['grand_total'], 1179.99)


if __name__ == '__main__':
    unittest.main(verbosity=2)
