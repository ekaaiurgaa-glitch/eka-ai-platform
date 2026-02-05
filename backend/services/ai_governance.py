"""
AIGovernance - 4-Layer AI Safety System
Governed Automobile Intelligence System for Go4Garage Private Limited

The 4 Gates:
1. Domain Gate - Only automobile queries allowed
2. Confidence Gate - Minimum 0.90 confidence threshold
3. Context Gate - Vehicle details required for accurate responses
4. Permission Gate - Role-based access control
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import re
import logging

logger = logging.getLogger(__name__)


class GateType(str, Enum):
    """Types of governance gates"""
    DOMAIN = "DOMAIN"
    CONFIDENCE = "CONFIDENCE"
    CONTEXT = "CONTEXT"
    PERMISSION = "PERMISSION"


class GateResult(str, Enum):
    """Gate check results"""
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"


class UserRole(str, Enum):
    """User roles for permission gate"""
    OWNER = "OWNER"
    MANAGER = "MANAGER"
    TECHNICIAN = "TECHNICIAN"
    FLEET_MANAGER = "FLEET_MANAGER"
    ACCOUNTANT = "ACCOUNTANT"
    CUSTOMER = "CUSTOMER"


@dataclass
class GateCheck:
    """Individual gate check result"""
    gate_type: GateType
    result: GateResult
    score: float  # 0.0 to 1.0
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "gate_type": self.gate_type.value,
            "result": self.result.value,
            "score": round(self.score, 4),
            "message": self.message,
            "details": self.details
        }


@dataclass
class GovernanceDecision:
    """Complete governance check result"""
    query_id: str
    overall_result: GateResult
    overall_score: float
    gates: List[GateCheck]
    final_action: str  # ALLOW, BLOCK, ESCALATE, CLARIFY
    response_template: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query_id": self.query_id,
            "overall_result": self.overall_result.value,
            "overall_score": round(self.overall_score, 4),
            "gates": [gate.to_dict() for gate in self.gates],
            "final_action": self.final_action,
            "response_template": self.response_template,
            "metadata": self.metadata,
            "timestamp": self.timestamp.isoformat()
        }


class DomainGate:
    """
    Gate 1: Domain Gate
    Ensures queries are related to automobiles only
    """
    
    # Keywords indicating automobile domain
    AUTO_KEYWORDS = [
        # Vehicle parts
        "engine", "transmission", "brake", "clutch", "battery", "alternator", "starter",
        "radiator", "coolant", "oil", "filter", "spark plug", "injector", "pump",
        "tire", "tyre", "wheel", "rim", "suspension", "shock", "strut", "spring",
        "steering", "rack", "pump", "belt", "hose", "pipe", "exhaust", "muffler",
        "catalytic", "converter", "sensor", "ecu", "computer", "module", "relay",
        "fuse", "wire", "cable", "connector", "switch", "button", "knob", "dial",
        "light", "headlight", "taillight", "indicator", "fog", "lamp", "bulb",
        "wiper", "washer", "mirror", "glass", "window", "door", "lock", "handle",
        "bumper", "fender", "hood", "bonnet", "trunk", "boot", "roof", "panel",
        "seat", "belt", "airbag", "dashboard", "console", "glovebox", "trim",
        
        # Vehicle types
        "car", "truck", "bike", "motorcycle", "scooter", "suv", "sedan", "hatchback",
        "van", "bus", "vehicle", "automobile", "auto", "four-wheeler", "two-wheeler",
        "maruti", "suzuki", "toyota", "honda", "hyundai", "tata", "mahindra", "ford",
        "volkswagen", "bmw", "mercedes", "audi", "skoda", "renault", "nissan",
        
        # Maintenance & service
        "service", "repair", "maintenance", "fix", "problem", "issue", "fault",
        "error", "code", "diagnostic", "scan", "check", "inspect", "test",
        "change", "replace", "adjust", "tune", "align", "balance", "rotate",
        "wash", "clean", "polish", "wax", "detail", "paint", "dent", "scratch",
        "noise", "sound", "vibration", "leak", "smell", "smoke", "overheat",
        "start", "crank", "turn over", "idle", "stall", "misfire", "knock",
        "accelerate", "pickup", "power", "mileage", "fuel", "consumption",
        "kmpl", "mpg", "efficiency", "economy", "range", "distance",
        
        # Systems
        "ac", "air conditioning", "heater", "cooling", "ventilation", "hvac",
        "electrical", "electronics", "wiring", "circuit", "battery", "charging",
        "fuel system", "ignition", "injection", "carburetor", "throttle",
        "transmission", "gearbox", "clutch", "differential", "axle", "driveshaft",
        "braking", "abs", "ebd", "esp", "traction", "stability",
        
        # Service terms
        "workshop", "garage", "mechanic", "technician", "estimate", "quotation",
        "bill", "invoice", "charge", "cost", "price", "parts", "labor", "gst",
        "warranty", "insurance", "claim", "accident", "damage", "total loss",
        
        # PDI & Job Card
        "pdi", "pre-delivery", "inspection", "checklist", "job card", "work order"
    ]
    
    # Explicitly blocked topics
    BLOCKED_TOPICS = [
        "politics", "religion", "porn", "sex", "gambling", "drugs", "weapons",
        "hacking", "crack", "password", "bypass", "illegal", "theft", "steal"
    ]
    
    def check(self, query: str, context: Optional[Dict] = None) -> GateCheck:
        """
        Check if query is within automobile domain
        
        Returns:
            GateCheck with result
        """
        query_lower = query.lower()
        
        # Check for blocked topics
        for topic in self.BLOCKED_TOPICS:
            if topic in query_lower:
                return GateCheck(
                    gate_type=GateType.DOMAIN,
                    result=GateResult.FAIL,
                    score=0.0,
                    message=f"Query contains prohibited topic: {topic}",
                    details={"blocked_topic": topic}
                )
        
        # Check for automobile keywords
        keyword_matches = []
        for keyword in self.AUTO_KEYWORDS:
            if keyword in query_lower:
                keyword_matches.append(keyword)
        
        # Score based on keyword matches
        if len(keyword_matches) >= 2:
            score = min(1.0, 0.5 + (len(keyword_matches) * 0.1))
            return GateCheck(
                gate_type=GateType.DOMAIN,
                result=GateResult.PASS,
                score=score,
                message="Query is within automobile domain",
                details={"matched_keywords": keyword_matches[:10]}
            )
        elif len(keyword_matches) == 1:
            return GateCheck(
                gate_type=GateType.DOMAIN,
                result=GateResult.WARNING,
                score=0.5,
                message="Query may be related to automobiles, but ambiguous",
                details={"matched_keyword": keyword_matches[0]}
            )
        else:
            # Check if it might be a greeting or conversational
            conversational = ["hello", "hi", "hey", "good morning", "good afternoon", "how are you"]
            if any(greeting in query_lower for greeting in conversational):
                return GateCheck(
                    gate_type=GateType.DOMAIN,
                    result=GateResult.PASS,
                    score=0.9,
                    message="Conversational greeting allowed",
                    details={"type": "greeting"}
                )
            
            return GateCheck(
                gate_type=GateType.DOMAIN,
                result=GateResult.FAIL,
                score=0.1,
                message="Query is outside automobile domain",
                details={"suggestion": "Please ask about vehicles, repairs, or maintenance"}
            )


class ConfidenceGate:
    """
    Gate 2: Confidence Gate
    Ensures AI confidence meets minimum threshold (0.90)
    """
    
    MIN_CONFIDENCE = 0.90
    
    # Phrases indicating low confidence
    UNCERTAIN_PHRASES = [
        "i think", "maybe", "perhaps", "possibly", "might be", "could be",
        "not sure", "uncertain", "unclear", "ambiguous", "don't know",
        "not certain", "hard to say", "difficult to determine"
    ]
    
    # Phrases indicating hallucination risk
    HALLUCINATION_RISKS = [
        "always", "never", "all", "none", "every", "guaranteed",
        "100%", "definitely will", "certainly", "absolutely"
    ]
    
    def check(
        self,
        query: str,
        ai_response: Optional[str] = None,
        raw_confidence: Optional[float] = None,
        context: Optional[Dict] = None
    ) -> GateCheck:
        """
        Check confidence level of query/response
        
        Returns:
            GateCheck with result
        """
        query_lower = query.lower()
        
        # Start with raw confidence if provided
        if raw_confidence is not None:
            score = raw_confidence
        else:
            # Estimate confidence based on query characteristics
            score = 0.85  # Base score
            
            # Reduce for uncertain phrases
            for phrase in self.UNCERTAIN_PHRASES:
                if phrase in query_lower:
                    score -= 0.15
                    break
            
            # Reduce for vague queries
            if len(query.split()) < 3:
                score -= 0.1
            
            # Boost for specific technical terms
            technical_terms = ["p0", "p1", "p2", "b0", "c0", "error code", "fault code"]
            if any(term in query_lower for term in technical_terms):
                score += 0.05
            
            # Boost for vehicle context
            if context and context.get("registration_number"):
                score += 0.05
        
        score = max(0.0, min(1.0, score))
        
        if score >= self.MIN_CONFIDENCE:
            return GateCheck(
                gate_type=GateType.CONFIDENCE,
                result=GateResult.PASS,
                score=score,
                message=f"Confidence meets threshold ({score:.2f} >= {self.MIN_CONFIDENCE})",
                details={"threshold": self.MIN_CONFIDENCE, "actual": round(score, 4)}
            )
        elif score >= 0.7:
            return GateCheck(
                gate_type=GateType.CONFIDENCE,
                result=GateResult.WARNING,
                score=score,
                message=f"Confidence below threshold ({score:.2f} < {self.MIN_CONFIDENCE})",
                details={"threshold": self.MIN_CONFIDENCE, "actual": round(score, 4)}
            )
        else:
            return GateCheck(
                gate_type=GateType.CONFIDENCE,
                result=GateResult.FAIL,
                score=score,
                message=f"Confidence too low ({score:.2f} < {self.MIN_CONFIDENCE})",
                details={"threshold": self.MIN_CONFIDENCE, "actual": round(score, 4)}
            )


class ContextGate:
    """
    Gate 3: Context Gate
    Ensures vehicle details are available for accurate responses
    """
    
    REQUIRED_FIELDS = ["registration_number"]
    HELPFUL_FIELDS = ["brand", "model", "year", "fuel_type"]
    
    def check(
        self,
        query: str,
        vehicle_context: Optional[Dict] = None
    ) -> GateCheck:
        """
        Check if sufficient vehicle context is available
        
        Returns:
            GateCheck with result
        """
        if not vehicle_context:
            return GateCheck(
                gate_type=GateType.CONTEXT,
                result=GateResult.FAIL,
                score=0.0,
                message="No vehicle context provided",
                details={"required_fields": self.REQUIRED_FIELDS}
            )
        
        # Check required fields
        missing_required = []
        for field in self.REQUIRED_FIELDS:
            if not vehicle_context.get(field):
                missing_required.append(field)
        
        # Check helpful fields
        present_helpful = []
        for field in self.HELPFUL_FIELDS:
            if vehicle_context.get(field):
                present_helpful.append(field)
        
        # Calculate score
        if missing_required:
            score = 0.3
            return GateCheck(
                gate_type=GateType.CONTEXT,
                result=GateResult.FAIL,
                score=score,
                message=f"Missing required context: {', '.join(missing_required)}",
                details={
                    "missing_required": missing_required,
                    "present_helpful": present_helpful
                }
            )
        
        # Base score for having required fields
        score = 0.6
        
        # Bonus for helpful fields
        score += len(present_helpful) * 0.1
        
        # Cap at 1.0
        score = min(1.0, score)
        
        if len(present_helpful) >= 3:
            return GateCheck(
                gate_type=GateType.CONTEXT,
                result=GateResult.PASS,
                score=score,
                message="Complete vehicle context available",
                details={
                    "vehicle_context": {
                        k: v for k, v in vehicle_context.items()
                        if k in self.REQUIRED_FIELDS + self.HELPFUL_FIELDS
                    }
                }
            )
        else:
            return GateCheck(
                gate_type=GateType.CONTEXT,
                result=GateResult.WARNING,
                score=score,
                message="Vehicle context available but incomplete",
                details={
                    "present": present_helpful,
                    "missing": [f for f in self.HELPFUL_FIELDS if f not in present_helpful]
                }
            )


class PermissionGate:
    """
    Gate 4: Permission Gate
    Enforces role-based access control
    """
    
    # Role permissions matrix
    PERMISSIONS = {
        UserRole.OWNER: {
            "can_view_all", "can_modify_pricing", "can_manage_users",
            "can_view_mg", "can_modify_mg", "can_generate_invoices",
            "can_view_analytics", "can_manage_kb"
        },
        UserRole.MANAGER: {
            "can_view_all", "can_modify_pricing", "can_view_mg",
            "can_modify_mg", "can_generate_invoices", "can_view_analytics"
        },
        UserRole.TECHNICIAN: {
            "can_view_jobs", "can_update_jobs", "can_upload_pdi",
            "can_view_kb", "can_run_diagnostics"
        },
        UserRole.FLEET_MANAGER: {
            "can_view_mg", "can_modify_mg", "can_view_fleet",
            "can_generate_mg_reports"
        },
        UserRole.ACCOUNTANT: {
            "can_view_invoices", "can_generate_invoices",
            "can_view_mg_billing", "can_view_pricing"
        },
        UserRole.CUSTOMER: {
            "can_view_own_job", "can_approve_job"
        }
    }
    
    # Required permissions for different query types
    QUERY_PERMISSIONS = {
        "pricing_query": {"can_view_pricing"},
        "pricing_modify": {"can_modify_pricing"},
        "mg_query": {"can_view_mg"},
        "mg_modify": {"can_modify_mg"},
        "invoice_generate": {"can_generate_invoices"},
        "kb_manage": {"can_manage_kb"},
        "user_manage": {"can_manage_users"},
        "diagnostic": {"can_run_diagnostics"},
        "pdi_upload": {"can_upload_pdi"}
    }
    
    def check(
        self,
        user_role: Optional[str] = None,
        required_permission: Optional[str] = None,
        query_type: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> GateCheck:
        """
        Check if user has required permissions
        
        Returns:
            GateCheck with result
        """
        # No role provided
        if not user_role:
            return GateCheck(
                gate_type=GateType.PERMISSION,
                result=GateResult.WARNING,
                score=0.5,
                message="No user role provided - assuming public access",
                details={"access_level": "limited"}
            )
        
        try:
            role = UserRole(user_role.upper())
        except ValueError:
            return GateCheck(
                gate_type=GateType.PERMISSION,
                result=GateResult.FAIL,
                score=0.0,
                message=f"Invalid user role: {user_role}",
                details={"valid_roles": [r.value for r in UserRole]}
            )
        
        # Get user's permissions
        user_permissions = self.PERMISSIONS.get(role, set())
        
        # Determine required permission
        if required_permission:
            required = {required_permission}
        elif query_type and query_type in self.QUERY_PERMISSIONS:
            required = self.QUERY_PERMISSIONS[query_type]
        else:
            # Default - no specific permission required
            return GateCheck(
                gate_type=GateType.PERMISSION,
                result=GateResult.PASS,
                score=1.0,
                message=f"No specific permission required for this query",
                details={"role": role.value, "permissions": list(user_permissions)}
            )
        
        # Check if user has all required permissions
        has_permissions = required.issubset(user_permissions)
        
        if has_permissions:
            return GateCheck(
                gate_type=GateType.PERMISSION,
                result=GateResult.PASS,
                score=1.0,
                message=f"User has required permissions",
                details={
                    "role": role.value,
                    "required": list(required),
                    "user_permissions": list(user_permissions)
                }
            )
        else:
            missing = required - user_permissions
            return GateCheck(
                gate_type=GateType.PERMISSION,
                result=GateResult.FAIL,
                score=0.0,
                message=f"Missing required permissions: {', '.join(missing)}",
                details={
                    "role": role.value,
                    "missing_permissions": list(missing),
                    "user_permissions": list(user_permissions)
                }
            )


class AIGovernance:
    """
    AI Governance - 4-Layer Safety System
    
    Orchestrates all 4 gates to make final decision on AI query processing
    """
    
    def __init__(self, supabase_client=None):
        self.supabase = supabase_client
        self.domain_gate = DomainGate()
        self.confidence_gate = ConfidenceGate()
        self.context_gate = ContextGate()
        self.permission_gate = PermissionGate()
        self.logs_table = "intelligence_logs"
    
    def evaluate(
        self,
        query_id: str,
        query: str,
        user_role: Optional[str] = None,
        vehicle_context: Optional[Dict] = None,
        query_type: Optional[str] = None,
        required_permission: Optional[str] = None,
        raw_confidence: Optional[float] = None,
        log_decision: bool = True
    ) -> GovernanceDecision:
        """
        Evaluate query through all 4 gates
        
        Returns:
            GovernanceDecision with complete evaluation
        """
        gates = []
        
        # Gate 1: Domain Gate
        domain_check = self.domain_gate.check(query, vehicle_context)
        gates.append(domain_check)
        
        # Gate 2: Confidence Gate
        confidence_check = self.confidence_gate.check(
            query, None, raw_confidence, vehicle_context
        )
        gates.append(confidence_check)
        
        # Gate 3: Context Gate
        context_check = self.context_gate.check(query, vehicle_context)
        gates.append(context_check)
        
        # Gate 4: Permission Gate
        permission_check = self.permission_gate.check(
            user_role, required_permission, query_type, vehicle_context
        )
        gates.append(permission_check)
        
        # Calculate overall score (average of all gates)
        overall_score = sum(gate.score for gate in gates) / len(gates)
        
        # Determine overall result
        failures = sum(1 for gate in gates if gate.result == GateResult.FAIL)
        warnings = sum(1 for gate in gates if gate.result == GateResult.WARNING)
        
        if failures > 0:
            overall_result = GateResult.FAIL
        elif warnings > 0:
            overall_result = GateResult.WARNING
        else:
            overall_result = GateResult.PASS
        
        # Determine final action
        if overall_result == GateResult.PASS:
            final_action = "ALLOW"
            response_template = None
        elif failures >= 2:
            final_action = "BLOCK"
            response_template = self._generate_block_response(gates)
        elif domain_check.result == GateResult.FAIL:
            final_action = "BLOCK"
            response_template = "I can only assist with automobile-related queries. Please ask about vehicles, repairs, or maintenance."
        elif confidence_check.result == GateResult.FAIL:
            final_action = "CLARIFY"
            response_template = "I need more information to provide an accurate answer. Could you please provide more details?"
        elif context_check.result == GateResult.FAIL:
            final_action = "CLARIFY"
            response_template = "To help you better, could you provide your vehicle registration number and details?"
        elif permission_check.result == GateResult.FAIL:
            final_action = "ESCALATE"
            response_template = "This query requires elevated permissions. Please contact your manager."
        else:
            final_action = "ALLOW_WITH_WARNING"
            response_template = None
        
        decision = GovernanceDecision(
            query_id=query_id,
            overall_result=overall_result,
            overall_score=overall_score,
            gates=gates,
            final_action=final_action,
            response_template=response_template,
            metadata={
                "query_length": len(query),
                "has_vehicle_context": vehicle_context is not None
            }
        )
        
        # Log the decision
        if log_decision and self.supabase:
            self._log_decision(decision)
        
        return decision
    
    def quick_check(
        self,
        query: str,
        user_role: Optional[str] = None,
        vehicle_context: Optional[Dict] = None
    ) -> Tuple[bool, str]:
        """
        Quick binary check - returns (allowed, message)
        
        Returns:
            (allowed: bool, message: str or None)
        """
        query_id = str(uuid.uuid4())[:8]
        decision = self.evaluate(
            query_id=query_id,
            query=query,
            user_role=user_role,
            vehicle_context=vehicle_context,
            log_decision=False
        )
        
        if decision.final_action == "ALLOW":
            return True, None
        elif decision.final_action == "ALLOW_WITH_WARNING":
            return True, decision.response_template
        else:
            return False, decision.response_template or "Request blocked by governance system"
    
    def _generate_block_response(self, gates: List[GateCheck]) -> str:
        """Generate user-friendly block response"""
        failed_gates = [g for g in gates if g.result == GateResult.FAIL]
        
        if len(failed_gates) == 1:
            return f"Unable to process: {failed_gates[0].message}"
        else:
            messages = [f"- {g.gate_type.value}: {g.message}" for g in failed_gates]
            return "Unable to process request due to:\n" + "\n".join(messages)
    
    def _log_decision(self, decision: GovernanceDecision):
        """Log governance decision to database"""
        try:
            if self.supabase:
                self.supabase.table(self.logs_table).insert({
                    "mode": 6,  # Governance mode
                    "status": decision.overall_result.value,
                    "user_query": decision.metadata.get("query", "")[:500],
                    "ai_response": json.dumps(decision.to_dict())[:1000],
                    "confidence_score": int(decision.overall_score * 100),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error logging governance decision: {e}")
    
    def get_stats(self, workshop_id: Optional[str] = None) -> Dict[str, Any]:
        """Get governance statistics"""
        # This would query the database for stats
        # For now, return placeholder
        return {
            "total_checks": 0,
            "allowed": 0,
            "blocked": 0,
            "escalated": 0,
            "gate_breakdown": {
                "domain": {"pass": 0, "fail": 0},
                "confidence": {"pass": 0, "fail": 0},
                "context": {"pass": 0, "fail": 0},
                "permission": {"pass": 0, "fail": 0}
            }
        }


# ═══════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════

_ai_governance: Optional[AIGovernance] = None


def get_ai_governance(supabase_client=None) -> AIGovernance:
    """Get or create AIGovernance singleton"""
    global _ai_governance
    if _ai_governance is None:
        _ai_governance = AIGovernance(supabase_client)
    return _ai_governance


# Import json at the end to avoid circular import issues
import json
import uuid
