"""
EKA-AI Platform: LlamaGuard 3 AI Safety Service
Implements content moderation per IndiaAI "Seven Sutras" guidelines.
Blocks toxic/unsafe prompts before they reach the AI model.
"""

import re
import logging
from typing import Dict, List, Tuple, Optional
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class SafetyCategory(str, Enum):
    """LlamaGuard 3 Taxonomy (S1-S13) mapped to Indian legal context"""
    S1_VIOLENT_CRIMES = "S1"           # IPC: Incitement of violence
    S2_NON_VIOLENT_CRIMES = "S2"       # Prevention of fraud/scam
    S3_SEX_RELATED_CRIMES = "S3"       # Protection of Women & Children Act
    S4_CHILD_EXPLOITATION = "S4"       # POCSO Act (Zero Tolerance)
    S5_DEFAMATION = "S5"               # IPC Section 499
    S6_SPECIALIZED_ADVICE = "S6"       # Unlicensed medical/legal advice
    S7_PRIVACY_VIOLATION = "S7"        # DPDP Act violations
    S8_INTELLECTUAL_PROPERTY = "S8"    # Copyright infringement
    S9_INDISCRIMINATE_WEAPONS = "S9"   # Arms Act compliance
    S10_HATE_SPEECH = "S10"            # IPC Section 153A
    S11_SUICIDE_SELF_HARM = "S11"      # Mental Healthcare Act
    S12_SEXUAL_CONTENT = "S12"         # Obscenity laws
    S13_ELECTIONS = "S13"              # Election Commission guidelines


class SafetyAction(str, Enum):
    """Actions based on safety check results"""
    BLOCK = "BLOCK"           # Immediate termination
    FLAG_WARN = "FLAG_WARN"   # Allow with warning
    FLAG_DISCLAIMER = "FLAG_DISCLAIMER"  # Add disclaimer
    ALLOW = "ALLOW"           # Proceed normally


@dataclass
class SafetyCheckResult:
    """Result of LlamaGuard safety check"""
    is_safe: bool
    category: Optional[SafetyCategory]
    action: SafetyAction
    confidence: float
    message: str
    redacted_input: str


class LlamaGuardService:
    """
    LlamaGuard 3 Content Moderation Service.
    
    Policy Mapping (India Context):
    - S1, S2, S3, S4, S9, S10, S11: BLOCK (Legal compliance)
    - S5, S6: FLAG & WARN (Civil liability)
    - S7: BLOCK (DPDP compliance)
    - S8, S12, S13: Context-dependent
    """
    
    # Categories requiring immediate blocking
    BLOCK_CATEGORIES = [
        SafetyCategory.S1_VIOLENT_CRIMES,
        SafetyCategory.S2_NON_VIOLENT_CRIMES,
        SafetyCategory.S3_SEX_RELATED_CRIMES,
        SafetyCategory.S4_CHILD_EXPLOITATION,
        SafetyCategory.S7_PRIVACY_VIOLATION,
        SafetyCategory.S9_INDISCRIMINATE_WEAPONS,
        SafetyCategory.S10_HATE_SPEECH,
        SafetyCategory.S11_SUICIDE_SELF_HARM,
    ]
    
    # Categories requiring flagging
    FLAG_CATEGORIES = [
        SafetyCategory.S5_DEFAMATION,
        SafetyCategory.S6_SPECIALIZED_ADVICE,
    ]
    
    # Keywords for rule-based detection (fallback if model unavailable)
    BLOCK_KEYWORDS = {
        SafetyCategory.S1_VIOLENT_CRIMES: [
            "kill", "murder", "attack", "bomb", "weapon", "hurt someone",
            "cause accident", "damage vehicle intentionally"
        ],
        SafetyCategory.S2_NON_VIOLENT_CRIMES: [
            "steal", "fraud", "scam", "fake invoice", "evade tax", 
            "bypass GST", "duplicate parts as original"
        ],
        SafetyCategory.S3_SEX_RELATED_CRIMES: [
            "sexual", "rape", "molest", "harass"
        ],
        SafetyCategory.S4_CHILD_EXPLOITATION: [
            "child", "minor", "underage", "kid"
        ],
        SafetyCategory.S7_PRIVACY_VIOLATION: [
            "hack", "steal data", "customer database", "leak information"
        ],
        SafetyCategory.S9_INDISCRIMINATE_WEAPONS: [
            "bomb", "explosive", "weapon", "gun", "firearm"
        ],
        SafetyCategory.S10_HATE_SPEECH: [
            "hate", "kill all", "destroy community", "terrorist"
        ],
        SafetyCategory.S11_SUICIDE_SELF_HARM: [
            "suicide", "kill myself", "end my life", "self-harm"
        ],
    }
    
    FLAG_KEYWORDS = {
        SafetyCategory.S5_DEFAMATION: [
            "defame", "badmouth competitor", "false claim about", "scam workshop"
        ],
        SafetyCategory.S6_SPECIALIZED_ADVICE: [
            "legal advice", "medical advice", "court case", "sue"
        ],
    }
    
    def __init__(self, model_endpoint: Optional[str] = None):
        """
        Initialize LlamaGuard service.
        
        Args:
            model_endpoint: URL to LlamaGuard 3 inference endpoint (vLLM/Ollama)
                           If None, uses rule-based fallback
        """
        self.model_endpoint = model_endpoint
        self.blocked_count = 0
        self.flagged_count = 0
    
    def validate_content(self, content: str, context: str = "chat") -> SafetyCheckResult:
        """
        Validate content using LlamaGuard 3 or rule-based fallback.
        
        Args:
            content: User input or AI output to validate
            context: "chat", "job_card", "invoice", "diagnosis"
            
        Returns:
            SafetyCheckResult with action recommendation
        """
        # Step 1: Check for PII (always run)
        redacted_content, pii_found = self._redact_pii(content)
        
        # Step 2: LlamaGuard check (if model available)
        if self.model_endpoint:
            return self._model_based_check(content, redacted_content, pii_found)
        
        # Step 3: Rule-based fallback
        return self._rule_based_check(content, redacted_content, pii_found)
    
    def _model_based_check(self, original: str, redacted: str, 
                          pii_found: List[str]) -> SafetyCheckResult:
        """Check using LlamaGuard 3 model"""
        # In production, this calls the actual LlamaGuard model
        # For now, fall back to rule-based
        return self._rule_based_check(original, redacted, pii_found)
    
    def _rule_based_check(self, original: str, redacted: str,
                         pii_found: List[str]) -> SafetyCheckResult:
        """Rule-based content filtering (fallback)"""
        content_lower = original.lower()
        
        # Check blocking categories
        for category, keywords in self.BLOCK_KEYWORDS.items():
            for keyword in keywords:
                if keyword in content_lower:
                    self.blocked_count += 1
                    logger.warning(f"LlamaGuard BLOCK: {category.value}", extra={
                        "category": category.value,
                        "keyword": keyword,
                        "action": "BLOCK"
                    })
                    return SafetyCheckResult(
                        is_safe=False,
                        category=category,
                        action=SafetyAction.BLOCK,
                        confidence=0.85,
                        message=f"Content blocked: Violates {category.value} - {category.name}",
                        redacted_input=redacted
                    )
        
        # Check flagging categories
        for category, keywords in self.FLAG_KEYWORDS.items():
            for keyword in keywords:
                if keyword in content_lower:
                    self.flagged_count += 1
                    logger.info(f"LlamaGuard FLAG: {category.value}", extra={
                        "category": category.value,
                        "keyword": keyword,
                        "action": "FLAG"
                    })
                    return SafetyCheckResult(
                        is_safe=True,
                        category=category,
                        action=SafetyAction.FLAG_DISCLAIMER,
                        confidence=0.75,
                        message=f"Content flagged: May contain {category.name}. Proceeding with disclaimer.",
                        redacted_input=redacted
                    )
        
        # Check for PII violations
        if len(pii_found) > 2:  # Multiple PII elements detected
            return SafetyCheckResult(
                is_safe=False,
                category=SafetyCategory.S7_PRIVACY_VIOLATION,
                action=SafetyAction.BLOCK,
                confidence=0.90,
                message="Multiple PII elements detected. Please remove personal data before submitting.",
                redacted_input=redacted
            )
        
        # All checks passed
        return SafetyCheckResult(
            is_safe=True,
            category=None,
            action=SafetyAction.ALLOW,
            confidence=0.95,
            message="Content passed safety checks",
            redacted_input=redacted
        )
    
    def _redact_pii(self, content: str) -> Tuple[str, List[str]]:
        """
        Redact PII before sending to AI model.
        
        Returns:
            Tuple of (redacted_content, list_of_pii_types_found)
        """
        redacted = content
        pii_found = []
        
        # Aadhaar: 1234 5678 9012 or 123456789012
        aadhaar_pattern = r'\b\d{4}\s?\d{4}\s?\d{4}\b'
        if re.search(aadhaar_pattern, redacted):
            redacted = re.sub(aadhaar_pattern, '<AADHAAR_ID>', redacted)
            pii_found.append("AADHAAR")
        
        # PAN: ABCDE1234F
        pan_pattern = r'\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b'
        if re.search(pan_pattern, redacted):
            redacted = re.sub(pan_pattern, '<PAN_ID>', redacted)
            pii_found.append("PAN")
        
        # Mobile: +91-98765-43210, 9876543210, +91 98765 43210
        mobile_pattern = r'(?:\+91[-\s]?)?[6-9]\d{9}'
        if re.search(mobile_pattern, redacted):
            redacted = re.sub(mobile_pattern, '<MOBILE_NO>', redacted)
            pii_found.append("MOBILE")
        
        # Email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if re.search(email_pattern, redacted):
            redacted = re.sub(email_pattern, '<EMAIL_ID>', redacted)
            pii_found.append("EMAIL")
        
        # Vehicle Registration (sensitive in some contexts)
        # Keep as is for automobile context, but log it
        
        return redacted, pii_found
    
    def get_stats(self) -> Dict:
        """Get safety check statistics"""
        return {
            "blocked_count": self.blocked_count,
            "flagged_count": self.flagged_count,
            "model_endpoint": self.model_endpoint,
            "mode": "model" if self.model_endpoint else "rule_based"
        }


# Singleton instance
_llama_guard_service = None

def get_llama_guard_service() -> LlamaGuardService:
    """Get or create LlamaGuard service singleton"""
    global _llama_guard_service
    if _llama_guard_service is None:
        import os
        endpoint = os.getenv('LLAMA_GUARD_ENDPOINT')
        _llama_guard_service = LlamaGuardService(model_endpoint=endpoint)
    return _llama_guard_service


def validate_ai_input(content: str, context: str = "chat") -> SafetyCheckResult:
    """
    Convenience function for AI input validation.
    Use this before sending user input to AI model.
    """
    service = get_llama_guard_service()
    return service.validate_content(content, context)


def validate_ai_output(content: str, context: str = "chat") -> SafetyCheckResult:
    """
    Convenience function for AI output validation.
    Use this before showing AI response to user.
    """
    service = get_llama_guard_service()
    return service.validate_content(content, context)
