"""
Unit tests for MG (Minimum Guarantee) Fleet Model
Run with: python -m unittest backend.tests.test_mg_logic
"""

import unittest
from decimal import Decimal
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.mg_service import MGEngine


class TestMGFleetModel(unittest.TestCase):
    """Test cases for MG billing calculations."""
    
    def test_under_utilization(self):
        """Scenario: Assured 12,000/yr (1,000/mo). Actual 800. Rate 10."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('10.0'), 800)
        self.assertEqual(res['billable_km'], 1000.0)
        self.assertEqual(res['final_amount'], 10000.0)
        self.assertEqual(res['utilization_type'], 'UNDER_UTILIZED')
        self.assertTrue(res['is_audit_safe'])

    def test_over_utilization(self):
        """Scenario: Assured 12,000/yr (1,000/mo). Actual 1,500. Rate 10."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('10.0'), 1500)
        self.assertEqual(res['billable_km'], 1500.0)
        self.assertEqual(res['final_amount'], 15000.0)
        self.assertEqual(res['utilization_type'], 'OVER_UTILIZED')
        self.assertTrue(res['is_audit_safe'])

    def test_exact_utilization(self):
        """Edge case: Exact match to assured KM."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('10.0'), 1000)
        self.assertEqual(res['utilization_type'], 'OVER_UTILIZED')
        self.assertEqual(res['final_amount'], 10000.0)

    def test_zero_actual_km(self):
        """Edge case: Vehicle not used at all."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('5.0'), 0)
        self.assertEqual(res['billable_km'], 1000.0)
        self.assertEqual(res['final_amount'], 5000.0)
        self.assertEqual(res['utilization_type'], 'UNDER_UTILIZED')

    def test_multi_month_cycle(self):
        """Test quarterly billing cycle (3 months)."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('10.0'), 2500, months_in_cycle=3)
        # Assured for 3 months = 3000 KM
        # Actual = 2500 KM (under-utilized)
        self.assertEqual(res['billable_km'], 3000.0)
        self.assertEqual(res['final_amount'], 30000.0)
        self.assertEqual(res['utilization_type'], 'UNDER_UTILIZED')

    def test_high_rate_precision(self):
        """Test with decimal rate for precision."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('12.50'), 1000)
        self.assertEqual(res['final_amount'], 12500.0)

    def test_odometer_valid(self):
        """Test valid odometer reading."""
        self.assertTrue(MGEngine.validate_odometer_reading(10000, 10500))
        self.assertTrue(MGEngine.validate_odometer_reading(0, 100))

    def test_odometer_invalid_same(self):
        """Test invalid - same reading."""
        self.assertFalse(MGEngine.validate_odometer_reading(10000, 10000))

    def test_odometer_invalid_decreasing(self):
        """Test invalid - decreasing reading."""
        self.assertFalse(MGEngine.validate_odometer_reading(10500, 10000))

    def test_odometer_invalid_negative(self):
        """Test invalid - negative reading."""
        self.assertFalse(MGEngine.validate_odometer_reading(-100, 100))
        self.assertFalse(MGEngine.validate_odometer_reading(100, -100))


class TestMGExcessModel(unittest.TestCase):
    """Test cases for MG billing with excess rates."""
    
    def test_excess_under_utilization(self):
        """Excess model: Under utilization should still bill assured."""
        res = MGEngine.calculate_excess_bill(
            assured_km_annual=12000,
            rate_per_km=Decimal('10.0'),
            excess_rate_per_km=Decimal('15.0'),
            actual_km_run=800,
            months_in_cycle=1
        )
        self.assertEqual(res['utilization_type'], 'UNDER_UTILIZED')
        self.assertEqual(res['billable_km'], 1000.0)
        self.assertEqual(res['excess_km'], 0.0)
        self.assertEqual(res['base_amount'], 10000.0)
        self.assertEqual(res['excess_amount'], 0.0)
        self.assertEqual(res['final_amount'], 10000.0)

    def test_excess_over_utilization(self):
        """Excess model: Over utilization bills excess at higher rate."""
        res = MGEngine.calculate_excess_bill(
            assured_km_annual=12000,
            rate_per_km=Decimal('10.0'),
            excess_rate_per_km=Decimal('15.0'),
            actual_km_run=1500,
            months_in_cycle=1
        )
        self.assertEqual(res['utilization_type'], 'OVER_UTILIZED')
        self.assertEqual(res['billable_km'], 1500.0)
        self.assertEqual(res['excess_km'], 500.0)
        self.assertEqual(res['base_amount'], 10000.0)  # 1000 * 10
        self.assertEqual(res['excess_amount'], 7500.0)  # 500 * 15
        self.assertEqual(res['final_amount'], 17500.0)

    def test_excess_exact_utilization(self):
        """Excess model: Exact utilization - no excess charge."""
        res = MGEngine.calculate_excess_bill(
            assured_km_annual=12000,
            rate_per_km=Decimal('10.0'),
            excess_rate_per_km=Decimal('15.0'),
            actual_km_run=1000,
            months_in_cycle=1
        )
        self.assertEqual(res['utilization_type'], 'EXACT_UTILIZATION')
        self.assertEqual(res['excess_km'], 0.0)
        self.assertEqual(res['excess_amount'], 0.0)
        self.assertEqual(res['final_amount'], 10000.0)


class TestMGAuditSafety(unittest.TestCase):
    """Test audit safety flags and metadata."""
    
    def test_all_results_audit_safe(self):
        """All calculation results should be marked audit safe."""
        test_cases = [
            (12000, Decimal('10.0'), 800),
            (12000, Decimal('10.0'), 1500),
            (12000, Decimal('10.0'), 1000),
            (12000, Decimal('10.0'), 0),
        ]
        
        for assured, rate, actual in test_cases:
            res = MGEngine.calculate_monthly_bill(assured, rate, actual)
            self.assertTrue(res['is_audit_safe'], 
                          f"Failed for assured={assured}, rate={rate}, actual={actual}")

    def test_calculation_method_present(self):
        """All results should include calculation method."""
        res = MGEngine.calculate_monthly_bill(12000, Decimal('10.0'), 1000)
        self.assertIn('calculation_method', res)
        self.assertEqual(res['calculation_method'], 'MAX(assured, actual)')


if __name__ == '__main__':
    unittest.main(verbosity=2)
