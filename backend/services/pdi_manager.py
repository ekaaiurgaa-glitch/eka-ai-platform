"""
PDIManager - Pre-Delivery Inspection Management System
Governed Automobile Intelligence System for Go4Garage Private Limited

Features:
- 16-item standardized checklist
- Evidence upload management
- Critical safety gates
- Completion validation
- PDF Report Generation
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)

# Try to import WeasyPrint for PDF generation
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    logger.warning("WeasyPrint not available. PDF generation will be disabled.")


class PDIStatus(str, Enum):
    """PDI item status"""
    PENDING = "PENDING"
    PASS = "PASS"
    FAIL = "FAIL"
    NA = "NA"  # Not Applicable


class PDICategory(str, Enum):
    """PDI checklist categories"""
    STANDARD = "STANDARD"
    HEAVY = "HEAVY"
    LIGHT = "LIGHT"


# ═══════════════════════════════════════════════════════════════
# STANDARD 16-ITEM PDI CHECKLIST
# ═══════════════════════════════════════════════════════════════

STANDARD_PDI_ITEMS = [
    {
        "code": "EXT_BODY",
        "task": "Exterior Body Inspection - Check for dents, scratches, paint defects",
        "category": "STANDARD",
        "critical": False
    },
    {
        "code": "EXT_LIGHTS",
        "task": "Exterior Lights - Headlights, taillights, indicators, brake lights",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "WINDSHIELD",
        "task": "Windshield & Wipers - Glass condition, wiper operation, washer fluid",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "TIRES",
        "task": "Tires & Wheels - Tread depth, pressure, damage, wheel alignment",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "BRAKES",
        "task": "Brake System - Pad thickness, fluid level, pedal feel, parking brake",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "ENGINE_OIL",
        "task": "Engine Oil Level & Condition",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "COOLANT",
        "task": "Coolant Level & Condition - Check for leaks",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "BATTERY",
        "task": "Battery - Voltage, terminals, charge status",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "INT_CLEAN",
        "task": "Interior Cleanliness - Seats, carpets, dashboard, trunk",
        "category": "STANDARD",
        "critical": False
    },
    {
        "code": "INT_CONTROLS",
        "task": "Interior Controls - AC, heater, power windows, mirrors, locks",
        "category": "STANDARD",
        "critical": False
    },
    {
        "code": "SEATBELTS",
        "task": "Seatbelts - Retraction, locking, condition",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "AIRBAG",
        "task": "Airbag System - Warning light, visual inspection",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "FLUID_LEAKS",
        "task": "Under Vehicle - Check for fluid leaks",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "STEERING",
        "task": "Steering System - Power steering fluid, play in wheel",
        "category": "STANDARD",
        "critical": True
    },
    {
        "code": "HORN",
        "task": "Horn Operation",
        "category": "STANDARD",
        "critical": False
    },
    {
        "code": "DOC_CHECK",
        "task": "Documentation - Service history, warranty, manual present",
        "category": "STANDARD",
        "critical": False
    }
]


@dataclass
class PDIChecklistItem:
    """Individual PDI checklist item"""
    code: str
    task: str
    status: PDIStatus = PDIStatus.PENDING
    notes: Optional[str] = None
    evidence_urls: List[str] = field(default_factory=list)
    critical: bool = False
    category: str = "STANDARD"
    checked_by: Optional[str] = None
    checked_at: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "task": self.task,
            "status": self.status.value,
            "notes": self.notes,
            "evidence_urls": self.evidence_urls,
            "critical": self.critical,
            "category": self.category,
            "checked_by": self.checked_by,
            "checked_at": self.checked_at.isoformat() if self.checked_at else None
        }


@dataclass
class PDIChecklist:
    """Complete PDI checklist for a job card"""
    id: str
    job_card_id: str
    workshop_id: str
    items: List[PDIChecklistItem] = field(default_factory=list)
    status: str = "IN_PROGRESS"  # IN_PROGRESS, COMPLETED, FAILED
    technician_declaration: bool = False
    technician_id: Optional[str] = None
    supervisor_id: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "job_card_id": self.job_card_id,
            "workshop_id": self.workshop_id,
            "items": [item.to_dict() for item in self.items],
            "status": self.status,
            "progress": self.calculate_progress(),
            "critical_items": self.get_critical_items_status(),
            "technician_declaration": self.technician_declaration,
            "technician_id": self.technician_id,
            "supervisor_id": self.supervisor_id,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

    def calculate_progress(self) -> Dict[str, Any]:
        """Calculate checklist completion progress"""
        total = len(self.items)
        if total == 0:
            return {"percentage": 0, "completed": 0, "total": 0}
        
        completed = sum(1 for item in self.items if item.status != PDIStatus.PENDING)
        passed = sum(1 for item in self.items if item.status == PDIStatus.PASS)
        failed = sum(1 for item in self.items if item.status == PDIStatus.FAIL)
        
        return {
            "percentage": round((completed / total) * 100, 1),
            "completed": completed,
            "total": total,
            "passed": passed,
            "failed": failed
        }

    def get_critical_items_status(self) -> Dict[str, Any]:
        """Get status of critical safety items"""
        critical_items = [item for item in self.items if item.critical]
        failed_critical = [item for item in critical_items if item.status == PDIStatus.FAIL]
        pending_critical = [item for item in critical_items if item.status == PDIStatus.PENDING]
        
        return {
            "total_critical": len(critical_items),
            "failed": len(failed_critical),
            "pending": len(pending_critical),
            "safe_to_deliver": len(failed_critical) == 0 and len(pending_critical) == 0,
            "failed_items": [item.code for item in failed_critical]
        }

    def can_complete(self) -> Tuple[bool, str]:
        """Check if checklist can be marked complete"""
        # Check all items are checked
        pending = [item for item in self.items if item.status == PDIStatus.PENDING]
        if pending:
            return False, f"{len(pending)} items still pending"
        
        # Check critical items
        critical_status = self.get_critical_items_status()
        if not critical_status["safe_to_deliver"]:
            if critical_status["failed"] > 0:
                return False, f"Critical items failed: {critical_status['failed_items']}"
        
        # Check technician declaration
        if not self.technician_declaration:
            return False, "Technician declaration required"
        
        return True, "Ready for completion"


@dataclass
class PDIEvidence:
    """PDI evidence record"""
    id: str
    job_card_id: str
    checklist_item_code: str
    file_url: str
    file_type: str  # image, video
    uploaded_at: datetime
    uploaded_by: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "job_card_id": self.job_card_id,
            "checklist_item_code": self.checklist_item_code,
            "file_url": self.file_url,
            "file_type": self.file_type,
            "uploaded_at": self.uploaded_at.isoformat(),
            "uploaded_by": self.uploaded_by,
            "verified_by": self.verified_by,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "notes": self.notes
        }


class PDIManager:
    """
    PDI Manager - Pre-Delivery Inspection Management
    
    Responsibilities:
    - Create and manage PDI checklists
    - Track checklist item status
    - Manage evidence uploads
    - Enforce completion rules
    """
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.checklists_table = "pdi_checklists"
        self.evidence_table = "pdi_evidence"
        self.audit_table = "audit_logs"
    
    # ═══════════════════════════════════════════════════════════════
    # CHECKLIST MANAGEMENT
    # ═══════════════════════════════════════════════════════════════
    
    def create_checklist(
        self,
        job_card_id: str,
        workshop_id: str,
        category: PDICategory = PDICategory.STANDARD,
        custom_items: Optional[List[Dict]] = None,
        created_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Create a new PDI checklist for a job card
        
        Returns:
            (success: bool, result: dict with checklist or error)
        """
        try:
            checklist_id = str(uuid.uuid4())
            
            # Get checklist items
            if custom_items:
                items_data = custom_items
            else:
                # Use standard 16-item checklist
                items_data = STANDARD_PDI_ITEMS
            
            # Create checklist items
            items = [
                PDIChecklistItem(
                    code=item["code"],
                    task=item["task"],
                    status=PDIStatus.PENDING,
                    critical=item.get("critical", False),
                    category=item.get("category", "STANDARD")
                )
                for item in items_data
            ]
            
            # Serialize items for storage
            items_json = [
                {
                    "code": item.code,
                    "task": item.task,
                    "status": item.status.value,
                    "notes": item.notes,
                    "evidence_urls": item.evidence_urls,
                    "critical": item.critical,
                    "category": item.category,
                    "checked_by": item.checked_by,
                    "checked_at": item.checked_at.isoformat() if item.checked_at else None
                }
                for item in items
            ]
            
            checklist_data = {
                "id": checklist_id,
                "job_card_id": job_card_id,
                "workshop_id": workshop_id,
                "name": f"PDI - {category.value}",
                "category": category.value,
                "items": items_json,
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.checklists_table).insert(checklist_data).execute()
            
            if not result.data:
                return False, {"error": "Failed to create checklist"}
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=created_by,
                action="CREATE_PDI_CHECKLIST",
                entity_type="PDI_CHECKLIST",
                entity_id=checklist_id,
                new_values={"job_card_id": job_card_id, "item_count": len(items)}
            )
            
            checklist = self._dict_to_checklist(result.data[0])
            return True, {"checklist": checklist.to_dict()}
            
        except Exception as e:
            logger.error(f"Error creating PDI checklist: {e}")
            return False, {"error": str(e)}
    
    def get_checklist(
        self,
        checklist_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get a PDI checklist by ID
        
        Returns:
            (success: bool, result: dict with checklist or error)
        """
        try:
            query = self.supabase.table(self.checklists_table).select("*").eq("id", checklist_id)
            
            if workshop_id:
                query = query.eq("workshop_id", workshop_id)
            
            result = query.execute()
            
            if not result.data:
                return False, {"error": "Checklist not found"}
            
            checklist = self._dict_to_checklist(result.data[0])
            return True, {"checklist": checklist.to_dict()}
            
        except Exception as e:
            logger.error(f"Error fetching checklist: {e}")
            return False, {"error": str(e)}
    
    def get_checklist_by_job(
        self,
        job_card_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get PDI checklist for a job card
        
        Returns:
            (success: bool, result: dict with checklist or error)
        """
        try:
            query = self.supabase.table(self.checklists_table)\
                .select("*")\
                .eq("job_card_id", job_card_id)
            
            if workshop_id:
                query = query.eq("workshop_id", workshop_id)
            
            result = query.execute()
            
            if not result.data:
                return False, {"error": "No checklist found for this job card"}
            
            checklist = self._dict_to_checklist(result.data[0])
            return True, {"checklist": checklist.to_dict()}
            
        except Exception as e:
            logger.error(f"Error fetching checklist by job: {e}")
            return False, {"error": str(e)}
    
    def update_checklist_item(
        self,
        checklist_id: str,
        item_code: str,
        status: PDIStatus,
        workshop_id: str,
        notes: Optional[str] = None,
        updated_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Update the status of a checklist item
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            # Get current checklist
            success, result = self.get_checklist(checklist_id, workshop_id)
            if not success:
                return False, result
            
            checklist = self._dict_to_checklist(result["checklist"])
            
            # Find and update the item
            item_found = False
            for item in checklist.items:
                if item.code == item_code:
                    item.status = status
                    item.notes = notes
                    item.checked_by = updated_by
                    item.checked_at = datetime.now(timezone.utc)
                    item_found = True
                    break
            
            if not item_found:
                return False, {"error": f"Item {item_code} not found in checklist"}
            
            # Save updated checklist
            items_json = [
                {
                    "code": item.code,
                    "task": item.task,
                    "status": item.status.value,
                    "notes": item.notes,
                    "evidence_urls": item.evidence_urls,
                    "critical": item.critical,
                    "category": item.category,
                    "checked_by": item.checked_by,
                    "checked_at": item.checked_at.isoformat() if item.checked_at else None
                }
                for item in checklist.items
            ]
            
            update_data = {
                "items": items_json,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.checklists_table)\
                .update(update_data)\
                .eq("id", checklist_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Failed to update checklist"}
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=updated_by,
                action="UPDATE_PDI_ITEM",
                entity_type="PDI_CHECKLIST",
                entity_id=checklist_id,
                new_values={"item_code": item_code, "status": status.value, "notes": notes}
            )
            
            updated_checklist = self._dict_to_checklist(result.data[0])
            return True, {
                "success": True,
                "checklist": updated_checklist.to_dict(),
                "updated_item": item_code
            }
            
        except Exception as e:
            logger.error(f"Error updating checklist item: {e}")
            return False, {"error": str(e)}
    
    def set_technician_declaration(
        self,
        checklist_id: str,
        workshop_id: str,
        declared: bool,
        technician_id: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Set technician declaration for PDI completion
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            update_data = {
                "technician_declaration": declared,
                "technician_id": technician_id if declared else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.checklists_table)\
                .update(update_data)\
                .eq("id", checklist_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Checklist not found"}
            
            self._log_audit(
                workshop_id=workshop_id,
                user_id=technician_id,
                action="PDI_TECH_DECLARATION",
                entity_type="PDI_CHECKLIST",
                entity_id=checklist_id,
                new_values={"declared": declared}
            )
            
            return True, {"success": True, "declared": declared}
            
        except Exception as e:
            logger.error(f"Error setting technician declaration: {e}")
            return False, {"error": str(e)}
    
    def complete_checklist(
        self,
        checklist_id: str,
        workshop_id: str,
        supervisor_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Mark PDI checklist as complete
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            # Get checklist
            success, result = self.get_checklist(checklist_id, workshop_id)
            if not success:
                return False, result
            
            checklist = self._dict_to_checklist(result["checklist"])
            
            # Validate can complete
            can_complete, message = checklist.can_complete()
            if not can_complete:
                return False, {"error": message, "code": "COMPLETION_BLOCKED"}
            
            # Check critical items
            critical_status = checklist.get_critical_items_status()
            
            # Determine final status
            if critical_status["failed"] > 0:
                final_status = "FAILED"
            else:
                final_status = "COMPLETED"
            
            update_data = {
                "status": final_status,
                "supervisor_id": supervisor_id,
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            result = self.supabase.table(self.checklists_table)\
                .update(update_data)\
                .eq("id", checklist_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Failed to complete checklist"}
            
            self._log_audit(
                workshop_id=workshop_id,
                user_id=supervisor_id,
                action="COMPLETE_PDI",
                entity_type="PDI_CHECKLIST",
                entity_id=checklist_id,
                new_values={"status": final_status}
            )
            
            return True, {
                "success": True,
                "status": final_status,
                "critical_items": critical_status,
                "message": "PDI completed successfully" if final_status == "COMPLETED" else "PDI completed with critical failures"
            }
            
        except Exception as e:
            logger.error(f"Error completing checklist: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # EVIDENCE MANAGEMENT
    # ═══════════════════════════════════════════════════════════════
    
    def add_evidence(
        self,
        job_card_id: str,
        checklist_item_code: str,
        file_url: str,
        file_type: str,
        uploaded_by: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Add evidence to a checklist item
        
        Returns:
            (success: bool, result: dict with evidence or error)
        """
        try:
            evidence_id = str(uuid.uuid4())
            
            evidence_data = {
                "id": evidence_id,
                "job_card_id": job_card_id,
                "checklist_item": checklist_item_code,
                "file_url": file_url,
                "file_type": file_type,
                "uploaded_at": datetime.now(timezone.utc).isoformat(),
                "uploaded_by": uploaded_by,
                "notes": notes
            }
            
            result = self.supabase.table(self.evidence_table).insert(evidence_data).execute()
            
            if not result.data:
                return False, {"error": "Failed to record evidence"}
            
            # Also update the checklist item with evidence URL
            self._add_evidence_to_checklist_item(job_card_id, checklist_item_code, file_url)
            
            evidence = self._dict_to_evidence(result.data[0])
            return True, {"evidence": evidence.to_dict()}
            
        except Exception as e:
            logger.error(f"Error adding evidence: {e}")
            return False, {"error": str(e)}
    
    def get_evidence(
        self,
        job_card_id: str,
        checklist_item_code: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get evidence for a job card
        
        Returns:
            (success: bool, result: dict with evidence list)
        """
        try:
            query = self.supabase.table(self.evidence_table)\
                .select("*")\
                .eq("job_card_id", job_card_id)
            
            if checklist_item_code:
                query = query.eq("checklist_item", checklist_item_code)
            
            result = query.order("uploaded_at", desc=True).execute()
            
            evidence_list = [self._dict_to_evidence(row).to_dict() for row in result.data]
            
            return True, {"evidence": evidence_list, "count": len(evidence_list)}
            
        except Exception as e:
            logger.error(f"Error fetching evidence: {e}")
            return False, {"error": str(e)}
    
    def verify_evidence(
        self,
        evidence_id: str,
        verified_by: str,
        notes: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Verify/approve evidence (supervisor action)
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            update_data = {
                "verified_by": verified_by,
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "notes": notes
            }
            
            result = self.supabase.table(self.evidence_table)\
                .update(update_data)\
                .eq("id", evidence_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Evidence not found"}
            
            return True, {"success": True}
            
        except Exception as e:
            logger.error(f"Error verifying evidence: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ═══════════════════════════════════════════════════════════════
    
    def _dict_to_checklist(self, data: Dict[str, Any]) -> PDIChecklist:
        """Convert dictionary to PDIChecklist"""
        items = []
        for item_data in data.get("items", []):
            items.append(PDIChecklistItem(
                code=item_data["code"],
                task=item_data["task"],
                status=PDIStatus(item_data.get("status", "PENDING")),
                notes=item_data.get("notes"),
                evidence_urls=item_data.get("evidence_urls", []),
                critical=item_data.get("critical", False),
                category=item_data.get("category", "STANDARD"),
                checked_by=item_data.get("checked_by"),
                checked_at=datetime.fromisoformat(item_data["checked_at"].replace("Z", "+00:00")) if item_data.get("checked_at") else None
            ))
        
        return PDIChecklist(
            id=data["id"],
            job_card_id=data["job_card_id"],
            workshop_id=data["workshop_id"],
            items=items,
            status=data.get("status", "IN_PROGRESS"),
            technician_declaration=data.get("technician_declaration", False),
            technician_id=data.get("technician_id"),
            supervisor_id=data.get("supervisor_id"),
            completed_at=datetime.fromisoformat(data["completed_at"].replace("Z", "+00:00")) if data.get("completed_at") else None,
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")) if data.get("updated_at") else datetime.now(timezone.utc)
        )
    
    def _dict_to_evidence(self, data: Dict[str, Any]) -> PDIEvidence:
        """Convert dictionary to PDIEvidence"""
        return PDIEvidence(
            id=data["id"],
            job_card_id=data["job_card_id"],
            checklist_item_code=data["checklist_item"],
            file_url=data["file_url"],
            file_type=data["file_type"],
            uploaded_at=datetime.fromisoformat(data["uploaded_at"].replace("Z", "+00:00")),
            uploaded_by=data.get("uploaded_by"),
            verified_by=data.get("verified_by"),
            verified_at=datetime.fromisoformat(data["verified_at"].replace("Z", "+00:00")) if data.get("verified_at") else None,
            notes=data.get("notes")
        )
    
    def _add_evidence_to_checklist_item(
        self,
        job_card_id: str,
        item_code: str,
        file_url: str
    ):
        """Add evidence URL to checklist item"""
        try:
            # Get checklist
            result = self.supabase.table(self.checklists_table)\
                .select("*")\
                .eq("job_card_id", job_card_id)\
                .execute()
            
            if not result.data:
                return
            
            checklist_data = result.data[0]
            items = checklist_data.get("items", [])
            
            # Update the specific item
            for item in items:
                if item["code"] == item_code:
                    if "evidence_urls" not in item:
                        item["evidence_urls"] = []
                    item["evidence_urls"].append(file_url)
                    break
            
            # Save back
            self.supabase.table(self.checklists_table)\
                .update({"items": items, "updated_at": datetime.now(timezone.utc).isoformat()})\
                .eq("id", checklist_data["id"])\
                .execute()
                
        except Exception as e:
            logger.error(f"Error adding evidence to checklist item: {e}")
    
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
    # PDF REPORT GENERATION
    # ═══════════════════════════════════════════════════════════════
    
    def generate_pdi_report_pdf(
        self,
        checklist_id: str,
        workshop_id: str,
        workshop_details: Optional[Dict[str, Any]] = None,
        vehicle_details: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, bytes]:
        """
        Generate PDF PDI Report
        
        Args:
            checklist_id: PDI Checklist ID
            workshop_id: Workshop ID
            workshop_details: Workshop info (name, address, GSTIN, logo)
            vehicle_details: Vehicle info (brand, model, reg_number)
        
        Returns:
            (success: bool, pdf_bytes or error message)
        """
        if not WEASYPRINT_AVAILABLE:
            return False, b"PDF generation not available"
        
        try:
            # Get checklist with full details
            success, result = self.get_checklist(checklist_id, workshop_id)
            if not success:
                return False, result["error"].encode()
            
            checklist = result.get("checklist", {})
            
            # Get evidence for this checklist
            evidence_result = self.supabase.table(self.evidence_table)\
                .select("*")\
                .eq("checklist_id", checklist_id)\
                .execute()
            evidence_list = evidence_result.data or []
            
            # Generate HTML
            html_content = self._generate_pdi_report_html(
                checklist, evidence_list, workshop_details, vehicle_details
            )
            
            # Generate PDF
            html = HTML(string=html_content)
            pdf_bytes = html.write_pdf()
            
            return True, pdf_bytes
            
        except Exception as e:
            logger.error(f"Error generating PDI report PDF: {e}")
            return False, str(e).encode()
    
    def _generate_pdi_report_html(
        self,
        checklist: Dict[str, Any],
        evidence_list: List[Dict],
        workshop_details: Optional[Dict[str, Any]] = None,
        vehicle_details: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate HTML for PDI Report PDF"""
        
        workshop = workshop_details or {}
        vehicle = vehicle_details or {}
        
        # Build checklist items rows
        items = checklist.get('items', [])
        items_html = ""
        
        for item in items:
            status = item.get('status', 'PENDING')
            status_color = {
                'PASS': '#28a745',
                'FAIL': '#dc3545',
                'NA': '#6c757d',
                'PENDING': '#ffc107'
            }.get(status, '#333')
            
            is_critical = item.get('critical', False)
            critical_badge = "<span style='background:#dc3545;color:white;padding:2px 5px;border-radius:3px;font-size:8px;'>CRITICAL</span>" if is_critical else ""
            
            # Find evidence for this item
            item_evidence = [e for e in evidence_list if e.get('checklist_item') == item.get('code')]
            evidence_count = len(item_evidence)
            
            items_html += f"""
            <tr>
                <td>{item.get('code', 'N/A')}</td>
                <td>
                    {item.get('task', 'N/A')}
                    {critical_badge}
                </td>
                <td style="color: {status_color}; font-weight: bold;">{status}</td>
                <td>{item.get('notes', '-')}</td>
                <td>{evidence_count} photo(s)</td>
            </tr>
            """
        
        if not items_html:
            items_html = "<tr><td colspan='5' style='text-align:center;'>No checklist items</td></tr>"
        
        # Calculate progress
        total = len(items)
        passed = sum(1 for i in items if i.get('status') == 'PASS')
        failed = sum(1 for i in items if i.get('status') == 'FAIL')
        pending = sum(1 for i in items if i.get('status') == 'PENDING')
        
        progress_html = f"""
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">Inspection Summary</h4>
            <div style="display: flex; justify-content: space-between;">
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #333;">{total}</div>
                    <div style="font-size: 10px; color: #666;">TOTAL ITEMS</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #28a745;">{passed}</div>
                    <div style="font-size: 10px; color: #666;">PASSED</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc3545;">{failed}</div>
                    <div style="font-size: 10px; color: #666;">FAILED</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #ffc107;">{pending}</div>
                    <div style="font-size: 10px; color: #666;">PENDING</div>
                </div>
            </div>
        </div>
        """
        
        # Check if checklist is complete
        is_complete = checklist.get('is_complete', False)
        completion_status = "<span style='background:#28a745;color:white;padding:5px 15px;border-radius:5px;font-weight:bold;'>✓ COMPLETE</span>" if is_complete else "<span style='background:#ffc107;color:#333;padding:5px 15px;border-radius:5px;font-weight:bold;'>⚠ INCOMPLETE</span>"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>PDI Report {checklist.get('id', 'N/A')[:8]}</title>
            <style>
                @page {{ size: A4; margin: 2cm; }}
                body {{ font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }}
                .header {{ text-align: center; border-bottom: 3px solid #f18a22; padding-bottom: 10px; margin-bottom: 20px; }}
                .header h1 {{ margin: 0; color: #333; font-size: 24pt; }}
                .workshop-info {{ text-align: center; margin-bottom: 20px; }}
                .section {{ margin-bottom: 15px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }}
                .section h3 {{ margin: 0 0 10px 0; color: #f18a22; border-bottom: 1px solid #eee; padding-bottom: 5px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 9pt; }}
                th {{ background-color: #f5f5f5; font-weight: bold; }}
                .footer {{ margin-top: 30px; padding-top: 10px; border-top: 2px solid #f18a22; text-align: center; font-size: 9pt; color: #666; }}
                .declaration {{ background: #f0f8ff; padding: 15px; border-left: 4px solid #f18a22; margin: 20px 0; }}
                .signature-section {{ margin-top: 40px; }}
                .signature-line {{ border-top: 1px solid #333; width: 200px; margin-top: 50px; padding-top: 5px; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>PRE-DELIVERY INSPECTION REPORT</h1>
                <p style="font-size: 12pt; color: #666;">Go4Garage Private Limited</p>
            </div>
            
            <div class="workshop-info">
                <h2>{workshop.get('name', 'Go4Garage Workshop')}</h2>
                <p>{workshop.get('address', '')}</p>
                <p>GSTIN: {workshop.get('gstin', 'N/A')} | Phone: {workshop.get('phone', 'N/A')}</p>
            </div>
            
            <div style="text-align: center; margin-bottom: 20px;">
                {completion_status}
            </div>
            
            <div class="section">
                <h3>Inspection Details</h3>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <p><strong>Report ID:</strong> {checklist.get('id', 'N/A')}</p>
                        <p><strong>Job Card ID:</strong> {checklist.get('job_card_id', 'N/A')}</p>
                        <p><strong>Category:</strong> {checklist.get('category', 'STANDARD')}</p>
                    </div>
                    <div>
                        <p><strong>Vehicle:</strong> {vehicle.get('brand', 'N/A')} {vehicle.get('model', 'N/A')}</p>
                        <p><strong>Registration:</strong> {vehicle.get('registration_number', 'N/A')}</p>
                        <p><strong>Created:</strong> {checklist.get('created_at', 'N/A')[:10]}</p>
                    </div>
                </div>
            </div>
            
            {progress_html}
            
            <div class="section">
                <h3>Inspection Checklist</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 10%;">Code</th>
                            <th style="width: 35%;">Task</th>
                            <th style="width: 10%;">Status</th>
                            <th style="width: 25%;">Notes</th>
                            <th style="width: 20%;">Evidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                    </tbody>
                </table>
            </div>
            
            <div class="declaration">
                <h4 style="margin-top: 0;">Technician Declaration</h4>
                <p style="font-style: italic;">
                    "I hereby certify that I have thoroughly inspected the vehicle according to the checklist above. 
                    All items marked as PASS meet the required standards. Any items marked as FAIL have been documented 
                    and communicated to the customer."
                </p>
                <p style="margin-top: 15px;">
                    <strong>Declared by:</strong> {checklist.get('technician_declaration', {}).get('declared_by', 'N/A')}<br>
                    <strong>Date:</strong> {checklist.get('technician_declaration', {}).get('declared_at', 'N/A')[:10] if checklist.get('technician_declaration') else 'N/A'}
                </p>
            </div>
            
            <div class="signature-section">
                <div style="display: flex; justify-content: space-between;">
                    <div class="signature-line">
                        <strong>Technician Signature</strong>
                    </div>
                    <div class="signature-line">
                        <strong>Customer Signature</strong>
                    </div>
                    <div class="signature-line">
                        <strong>Manager Approval</strong>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>This is an official Pre-Delivery Inspection report from Go4Garage.</p>
                <p>Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p style="font-size: 8pt; margin-top: 10px;">
                    <strong>Disclaimer:</strong> This report is based on visual inspection and testing at the time of inspection. 
                    Go4Garage is not liable for issues that may arise after vehicle delivery unless covered under warranty.
                </p>
            </div>
        </body>
        </html>
        """
        
        return html


# ═══════════════════════════════════════════════════════════════
# SINGLETON INSTANCE
# ═══════════════════════════════════════════════════════════════

_pdi_manager: Optional[PDIManager] = None


def get_pdi_manager(supabase_client) -> PDIManager:
    """Get or create PDIManager singleton"""
    global _pdi_manager
    if _pdi_manager is None:
        _pdi_manager = PDIManager(supabase_client)
    return _pdi_manager
