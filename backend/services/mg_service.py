"""
MG (Minimum Guarantee) Fleet Model Service
DETERMINISTIC MG CALCULATION - AUDIT GRADE

Rule: If Actual < Assured: Bill Assured. If Actual > Assured: Bill Actual.
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, Any


class MGEngine:
    """
    Deterministic MG calculation engine for fleet billing.
    All calculations use Decimal for financial precision.
    """
    
    @staticmethod
    def calculate_monthly_bill(
        assured_km_annual: int, 
        rate_per_km: Decimal, 
        actual_km_run: int, 
        months_in_cycle: int = 1
    ) -> Dict[str, Any]:
        """
        Calculates MG billing with guaranteed deterministic output.
        
        Args:
            assured_km_annual: Contractual annual KM guarantee
            rate_per_km: Rate per kilometer (Decimal for precision)
            actual_km_run: Actual odometer reading difference
            months_in_cycle: Billing cycle duration (default 1 month)
            
        Returns:
            Dictionary with billable amounts and audit metadata
        """
        # Convert to Decimal for precise arithmetic
        monthly_assured_km = (Decimal(assured_km_annual) / Decimal(12)) * Decimal(months_in_cycle)
        actual_km_dec = Decimal(actual_km_run)
        
        # MG Logic: Bill the HIGHER of (assured, actual)
        if actual_km_dec < monthly_assured_km:
            billable_km = monthly_assured_km
            utilization_type = "UNDER_UTILIZED"
        else:
            billable_km = actual_km_dec
            utilization_type = "OVER_UTILIZED"
            
        # Calculate with 2 decimal precision
        billable_amount = (billable_km * rate_per_km).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return {
            "utilization_type": utilization_type,
            "monthly_assured_km": float(round(monthly_assured_km, 2)),
            "actual_km": int(actual_km_run),
            "billable_km": float(round(billable_km, 2)),
            "rate_per_km": float(rate_per_km),
            "final_amount": float(billable_amount),
            "is_audit_safe": True,
            "calculation_method": "MAX(assured, actual)"
        }

    @staticmethod
    def validate_odometer_reading(opening: int, closing: int) -> bool:
        """
        Validates that closing odometer is greater than opening.
        
        Args:
            opening: Opening odometer reading
            closing: Closing odometer reading
            
        Returns:
            True if valid, False otherwise
        """
        return closing > opening and closing >= 0 and opening >= 0
    
    @staticmethod
    def calculate_excess_bill(
        assured_km_annual: int,
        rate_per_km: Decimal,
        excess_rate_per_km: Decimal,
        actual_km_run: int,
        months_in_cycle: int = 1
    ) -> Dict[str, Any]:
        """
        Calculates MG billing with excess rate for over-utilization.
        
        Args:
            assured_km_annual: Contractual annual KM guarantee
            rate_per_km: Standard rate per kilometer
            excess_rate_per_km: Rate for excess KM over assured
            actual_km_run: Actual odometer reading difference
            months_in_cycle: Billing cycle duration
            
        Returns:
            Dictionary with detailed billing breakdown
        """
        monthly_assured_km = (Decimal(assured_km_annual) / Decimal(12)) * Decimal(months_in_cycle)
        actual_km_dec = Decimal(actual_km_run)
        
        if actual_km_dec <= monthly_assured_km:
            # Under or exact utilization
            billable_km = monthly_assured_km
            excess_km = Decimal(0)
            base_amount = (billable_km * rate_per_km).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            excess_amount = Decimal(0)
            utilization_type = "UNDER_UTILIZED" if actual_km_dec < monthly_assured_km else "EXACT_UTILIZATION"
        else:
            # Over utilization - bill assured at standard rate, excess at excess rate
            billable_km = actual_km_dec
            excess_km = actual_km_dec - monthly_assured_km
            base_amount = (monthly_assured_km * rate_per_km).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            excess_amount = (excess_km * excess_rate_per_km).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            utilization_type = "OVER_UTILIZED"
        
        total_amount = (base_amount + excess_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        return {
            "utilization_type": utilization_type,
            "monthly_assured_km": float(round(monthly_assured_km, 2)),
            "actual_km": int(actual_km_run),
            "billable_km": float(round(billable_km, 2)),
            "excess_km": float(round(excess_km, 2)),
            "base_rate_per_km": float(rate_per_km),
            "excess_rate_per_km": float(excess_rate_per_km),
            "base_amount": float(base_amount),
            "excess_amount": float(excess_amount),
            "final_amount": float(total_amount),
            "is_audit_safe": True,
            "calculation_method": "BASE(assured) + EXCESS(over_assured)" if excess_km > 0 else "MAX(assured, actual)"
        }
