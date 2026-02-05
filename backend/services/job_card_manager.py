"""
JobCardManager - Core Workshop Job Card Brain
Governed Automobile Intelligence System for Go4Garage Private Limited

Features:
- Full FSM (Finite State Machine) enforcement
- Workshop isolation
- Comprehensive audit logging
- State transition validation
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import uuid
import logging

logger = logging.getLogger(__name__)


class JobStatus(str, Enum):
    """9-State Job Card Lifecycle"""
    CREATED = "CREATED"
    CONTEXT_VERIFIED = "CONTEXT_VERIFIED"
    DIAGNOSED = "DIAGNOSED"
    ESTIMATED = "ESTIMATED"
    CUSTOMER_APPROVAL = "CUSTOMER_APPROVAL"
    IN_PROGRESS = "IN_PROGRESS"
    PDI = "PDI"
    INVOICED = "INVOICED"
    CLOSED = "CLOSED"
    CONCERN_RAISED = "CONCERN_RAISED"
    CANCELLED = "CANCELLED"


class JobPriority(str, Enum):
    """Job card priority levels"""
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# Valid FSM Transitions
VALID_TRANSITIONS: Dict[JobStatus, List[JobStatus]] = {
    JobStatus.CREATED: [JobStatus.CONTEXT_VERIFIED],
    JobStatus.CONTEXT_VERIFIED: [JobStatus.DIAGNOSED],
    JobStatus.DIAGNOSED: [JobStatus.ESTIMATED],
    JobStatus.ESTIMATED: [JobStatus.CUSTOMER_APPROVAL],
    JobStatus.CUSTOMER_APPROVAL: [JobStatus.IN_PROGRESS, JobStatus.CONCERN_RAISED],
    JobStatus.CONCERN_RAISED: [JobStatus.ESTIMATED, JobStatus.CANCELLED],
    JobStatus.IN_PROGRESS: [JobStatus.PDI],
    JobStatus.PDI: [JobStatus.INVOICED],
    JobStatus.INVOICED: [JobStatus.CLOSED],
    JobStatus.CLOSED: [],  # Terminal state
    JobStatus.CANCELLED: []  # Terminal state
}


@dataclass
class VehicleContext:
    """Vehicle context for job card"""
    registration_number: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: Optional[str] = None
    vin: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None


@dataclass
class JobCard:
    """Job Card data structure"""
    id: str
    vehicle_id: Optional[str]
    workshop_id: str
    registration_number: str
    status: JobStatus = JobStatus.CREATED
    priority: JobPriority = JobPriority.NORMAL
    symptoms: List[str] = field(default_factory=list)
    diagnosis: Optional[Dict[str, Any]] = None
    estimate: Optional[Dict[str, Any]] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    technician_id: Optional[str] = None
    notes: Optional[str] = None
    approval_token: Optional[str] = None
    approval_expires_at: Optional[datetime] = None
    customer_approved_at: Optional[datetime] = None
    sent_for_approval_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None
    status_notes: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "vehicle_id": self.vehicle_id,
            "workshop_id": self.workshop_id,
            "registration_number": self.registration_number,
            "status": self.status.value,
            "priority": self.priority.value,
            "symptoms": self.symptoms,
            "diagnosis": self.diagnosis,
            "estimate": self.estimate,
            "customer_phone": self.customer_phone,
            "customer_email": self.customer_email,
            "technician_id": self.technician_id,
            "notes": self.notes,
            "approval_expires_at": self.approval_expires_at.isoformat() if self.approval_expires_at else None,
            "customer_approved_at": self.customer_approved_at.isoformat() if self.customer_approved_at else None,
            "sent_for_approval_at": self.sent_for_approval_at.isoformat() if self.sent_for_approval_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "updated_by": self.updated_by,
            "status_notes": self.status_notes,
            "metadata": self.metadata,
            "allowed_transitions": [t.value for t in VALID_TRANSITIONS.get(self.status, [])]
        }


class JobCardManager:
    """
    Job Card Manager - Core business logic for workshop job cards
    
    Responsibilities:
    - CRUD operations for job cards
    - FSM state transition enforcement
    - Workshop isolation
    - Audit logging
    """
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.table = "job_cards"
        self.states_table = "job_card_states"
        self.audit_table = "audit_logs"
    
    # ═══════════════════════════════════════════════════════════════
    # CRUD OPERATIONS
    # ═══════════════════════════════════════════════════════════════
    
    def create_job_card(
        self,
        workshop_id: str,
        registration_number: str,
        vehicle_id: Optional[str] = None,
        symptoms: Optional[List[str]] = None,
        customer_phone: Optional[str] = None,
        customer_email: Optional[str] = None,
        priority: JobPriority = JobPriority.NORMAL,
        notes: Optional[str] = None,
        created_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Create a new job card
        
        Returns:
            (success: bool, result: dict with job_card or error)
        """
        try:
            job_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)
            
            job_data = {
                "id": job_id,
                "workshop_id": workshop_id,
                "vehicle_id": vehicle_id,
                "registration_number": registration_number.upper().strip(),
                "status": JobStatus.CREATED.value,
                "priority": priority.value,
                "symptoms": symptoms or [],
                "customer_phone": customer_phone,
                "customer_email": customer_email,
                "notes": notes,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "updated_by": created_by
            }
            
            result = self.supabase.table(self.table).insert(job_data).execute()
            
            if not result.data:
                return False, {"error": "Failed to create job card"}
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=created_by,
                action="CREATE",
                entity_type="JOB_CARD",
                entity_id=job_id,
                new_values=job_data
            )
            
            job_card = self._dict_to_job_card(result.data[0])
            return True, {"job_card": job_card.to_dict()}
            
        except Exception as e:
            logger.error(f"Error creating job card: {e}")
            return False, {"error": str(e)}
    
    def get_job_card(
        self,
        job_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get a job card by ID
        
        Args:
            job_id: Job card UUID
            workshop_id: Optional workshop ID for isolation check
        
        Returns:
            (success: bool, result: dict with job_card or error)
        """
        try:
            query = self.supabase.table(self.table).select("*").eq("id", job_id)
            
            if workshop_id:
                query = query.eq("workshop_id", workshop_id)
            
            result = query.execute()
            
            if not result.data:
                return False, {"error": "Job card not found"}
            
            job_card = self._dict_to_job_card(result.data[0])
            return True, {"job_card": job_card.to_dict()}
            
        except Exception as e:
            logger.error(f"Error fetching job card: {e}")
            return False, {"error": str(e)}
    
    def get_job_card_by_token(
        self,
        token: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get job card by approval token (for public access)
        
        Returns:
            (success: bool, result: dict with job_card or error)
        """
        try:
            result = self.supabase.table(self.table)\
                .select("*")\
                .eq("approval_token", token)\
                .execute()
            
            if not result.data:
                return False, {"error": "Invalid token"}
            
            job_card = self._dict_to_job_card(result.data[0])
            
            # Check if token expired
            if job_card.approval_expires_at and job_card.approval_expires_at < datetime.now(timezone.utc):
                return False, {"error": "Token expired"}
            
            return True, {"job_card": job_card.to_dict()}
            
        except Exception as e:
            logger.error(f"Error fetching job card by token: {e}")
            return False, {"error": str(e)}
    
    def list_job_cards(
        self,
        workshop_id: str,
        status: Optional[JobStatus] = None,
        technician_id: Optional[str] = None,
        priority: Optional[JobPriority] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        List job cards with filters
        
        Returns:
            (success: bool, result: dict with job_cards, count, pagination)
        """
        try:
            query = self.supabase.table(self.table)\
                .select("*", count="exact")\
                .eq("workshop_id", workshop_id)
            
            if status:
                query = query.eq("status", status.value)
            if technician_id:
                query = query.eq("technician_id", technician_id)
            if priority:
                query = query.eq("priority", priority.value)
            
            query = query.order("created_at", desc=True)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            job_cards = [self._dict_to_job_card(row).to_dict() for row in result.data]
            count = result.count if result.count else len(job_cards)
            
            return True, {
                "job_cards": job_cards,
                "count": count,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            logger.error(f"Error listing job cards: {e}")
            return False, {"error": str(e)}
    
    def update_job_card(
        self,
        job_id: str,
        workshop_id: str,
        updates: Dict[str, Any],
        updated_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Update job card fields (non-status updates)
        
        Returns:
            (success: bool, result: dict with job_card or error)
        """
        try:
            # Get current state
            success, result = self.get_job_card(job_id, workshop_id)
            if not success:
                return False, result
            
            old_values = result["job_card"]
            
            # Filter out protected fields
            allowed_fields = {
                "symptoms", "customer_phone", "customer_email",
                "technician_id", "notes", "priority", "diagnosis", "estimate"
            }
            filtered_updates = {k: v for k, v in updates.items() if k in allowed_fields}
            
            filtered_updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            filtered_updates["updated_by"] = updated_by
            
            result = self.supabase.table(self.table)\
                .update(filtered_updates)\
                .eq("id", job_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Job card not found or access denied"}
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=updated_by,
                action="UPDATE",
                entity_type="JOB_CARD",
                entity_id=job_id,
                old_values={k: old_values.get(k) for k in filtered_updates.keys()},
                new_values=filtered_updates
            )
            
            job_card = self._dict_to_job_card(result.data[0])
            return True, {"job_card": job_card.to_dict()}
            
        except Exception as e:
            logger.error(f"Error updating job card: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # FSM STATE TRANSITIONS
    # ═══════════════════════════════════════════════════════════════
    
    def transition_state(
        self,
        job_id: str,
        target_state: JobStatus,
        workshop_id: str,
        updated_by: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Transition job card to new state with FSM validation
        
        Returns:
            (success: bool, result: dict with transition details or error)
        """
        try:
            # Get current job card
            success, result = self.get_job_card(job_id, workshop_id)
            if not success:
                return False, result
            
            job_card = self._dict_to_job_card(result["job_card"])
            current_state = job_card.status
            
            # Validate transition
            allowed_states = VALID_TRANSITIONS.get(current_state, [])
            if target_state not in allowed_states:
                return False, {
                    "error": "Invalid state transition",
                    "code": "INVALID_TRANSITION",
                    "current": current_state.value,
                    "requested": target_state.value,
                    "allowed": [s.value for s in allowed_states]
                }
            
            # Check state-specific requirements
            requirement_check = self._check_state_requirements(job_card, target_state)
            if not requirement_check["valid"]:
                return False, {
                    "error": f"State requirements not met: {requirement_check['message']}",
                    "code": "REQUIREMENTS_NOT_MET",
                    "requirements": requirement_check["requirements"]
                }
            
            # Build update data
            now = datetime.now(timezone.utc)
            update_data = {
                "status": target_state.value,
                "updated_at": now.isoformat(),
                "updated_by": updated_by,
                "status_notes": notes
            }
            
            # Add state-specific timestamps
            if target_state == JobStatus.CUSTOMER_APPROVAL:
                update_data["sent_for_approval_at"] = now.isoformat()
            elif target_state == JobStatus.IN_PROGRESS:
                update_data["started_at"] = now.isoformat()
            elif target_state == JobStatus.CLOSED:
                update_data["closed_at"] = now.isoformat()
            
            # Execute update
            result = self.supabase.table(self.table)\
                .update(update_data)\
                .eq("id", job_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Job card not found or access denied"}
            
            # Log state change in history table
            self._log_state_change(
                job_id=job_id,
                previous_state=current_state,
                new_state=target_state,
                changed_by=updated_by,
                notes=notes
            )
            
            # Log audit
            self._log_audit(
                workshop_id=workshop_id,
                user_id=updated_by,
                action="STATE_TRANSITION",
                entity_type="JOB_CARD",
                entity_id=job_id,
                old_values={"status": current_state.value},
                new_values={"status": target_state.value, "notes": notes}
            )
            
            job_card = self._dict_to_job_card(result.data[0])
            return True, {
                "success": True,
                "job_card": job_card.to_dict(),
                "previous_state": current_state.value,
                "new_state": target_state.value,
                "allowed_transitions": [t.value for t in VALID_TRANSITIONS.get(target_state, [])]
            }
            
        except Exception as e:
            logger.error(f"Error transitioning job card state: {e}")
            return False, {"error": str(e)}
    
    def get_valid_transitions(
        self,
        job_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get valid transitions for a job card
        
        Returns:
            (success: bool, result: dict with transitions or error)
        """
        try:
            success, result = self.get_job_card(job_id, workshop_id)
            if not success:
                return False, result
            
            current_state = JobStatus(result["job_card"]["status"])
            allowed = VALID_TRANSITIONS.get(current_state, [])
            
            return True, {
                "job_id": job_id,
                "current_state": current_state.value,
                "allowed_transitions": [t.value for t in allowed],
                "all_states": [s.value for s in JobStatus]
            }
            
        except Exception as e:
            logger.error(f"Error getting valid transitions: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # APPROVAL TOKEN MANAGEMENT
    # ═══════════════════════════════════════════════════════════════
    
    def set_approval_token(
        self,
        job_id: str,
        workshop_id: str,
        token: str,
        expires_at: datetime,
        updated_by: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Set approval token for customer approval
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            update_data = {
                "approval_token": token,
                "approval_expires_at": expires_at.isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "updated_by": updated_by
            }
            
            result = self.supabase.table(self.table)\
                .update(update_data)\
                .eq("id", job_id)\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Job card not found or access denied"}
            
            self._log_audit(
                workshop_id=workshop_id,
                user_id=updated_by,
                action="SET_APPROVAL_TOKEN",
                entity_type="JOB_CARD",
                entity_id=job_id
            )
            
            return True, {"success": True}
            
        except Exception as e:
            logger.error(f"Error setting approval token: {e}")
            return False, {"error": str(e)}
    
    def process_approval_action(
        self,
        token: str,
        action: str  # 'approve', 'reject', 'concern'
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Process customer approval action via token
        
        Returns:
            (success: bool, result: dict)
        """
        try:
            # Get job by token
            success, result = self.get_job_card_by_token(token)
            if not success:
                return False, result
            
            job_card = self._dict_to_job_card(result["job_card"])
            
            # Map action to state
            action_map = {
                "approve": JobStatus.IN_PROGRESS,
                "reject": JobStatus.CREATED,
                "concern": JobStatus.CONCERN_RAISED
            }
            
            if action not in action_map:
                return False, {"error": "Invalid action"}
            
            target_state = action_map[action]
            
            # Special handling for approval
            update_data = {
                "status": target_state.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            if action == "approve":
                update_data["customer_approved_at"] = datetime.now(timezone.utc).isoformat()
                update_data["started_at"] = datetime.now(timezone.utc).isoformat()
            
            result = self.supabase.table(self.table)\
                .update(update_data)\
                .eq("id", job_card.id)\
                .execute()
            
            if not result.data:
                return False, {"error": "Failed to update job card"}
            
            # Log state change
            self._log_state_change(
                job_id=job_card.id,
                previous_state=job_card.status,
                new_state=target_state,
                notes=f"Customer action: {action}"
            )
            
            return True, {
                "success": True,
                "job_id": job_card.id,
                "new_status": target_state.value
            }
            
        except Exception as e:
            logger.error(f"Error processing approval action: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # STATISTICS & REPORTING
    # ═══════════════════════════════════════════════════════════════
    
    def get_workshop_stats(
        self,
        workshop_id: str
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get job card statistics for a workshop
        
        Returns:
            (success: bool, result: dict with stats)
        """
        try:
            # Get counts by status
            result = self.supabase.table(self.table)\
                .select("status")\
                .eq("workshop_id", workshop_id)\
                .execute()
            
            status_counts = {}
            for row in result.data:
                status = row["status"]
                status_counts[status] = status_counts.get(status, 0) + 1
            
            total = len(result.data)
            active = sum(count for status, count in status_counts.items() 
                        if status not in [JobStatus.CLOSED.value, JobStatus.CANCELLED.value])
            
            return True, {
                "total": total,
                "active": active,
                "by_status": status_counts,
                "workshop_id": workshop_id
            }
            
        except Exception as e:
            logger.error(f"Error getting workshop stats: {e}")
            return False, {"error": str(e)}
    
    def get_state_history(
        self,
        job_id: str,
        workshop_id: Optional[str] = None
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Get state transition history for a job card
        
        Returns:
            (success: bool, result: dict with history)
        """
        try:
            # First verify access
            if workshop_id:
                success, _ = self.get_job_card(job_id, workshop_id)
                if not success:
                    return False, {"error": "Access denied"}
            
            result = self.supabase.table(self.states_table)\
                .select("*")\
                .eq("job_card_id", job_id)\
                .order("changed_at", desc=True)\
                .execute()
            
            history = [
                {
                    "id": row["id"],
                    "previous_status": row["previous_status"],
                    "new_status": row["new_status"],
                    "changed_by": row["changed_by"],
                    "changed_at": row["changed_at"],
                    "notes": row["notes"]
                }
                for row in result.data
            ]
            
            return True, {"history": history, "count": len(history)}
            
        except Exception as e:
            logger.error(f"Error getting state history: {e}")
            return False, {"error": str(e)}
    
    # ═══════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ═══════════════════════════════════════════════════════════════
    
    def _dict_to_job_card(self, data: Dict[str, Any]) -> JobCard:
        """Convert dictionary to JobCard dataclass"""
        return JobCard(
            id=data["id"],
            vehicle_id=data.get("vehicle_id"),
            workshop_id=data["workshop_id"],
            registration_number=data["registration_number"],
            status=JobStatus(data["status"]),
            priority=JobPriority(data.get("priority", "NORMAL")),
            symptoms=data.get("symptoms", []),
            diagnosis=data.get("diagnosis"),
            estimate=data.get("estimate"),
            customer_phone=data.get("customer_phone"),
            customer_email=data.get("customer_email"),
            technician_id=data.get("technician_id"),
            notes=data.get("notes"),
            approval_token=data.get("approval_token"),
            approval_expires_at=datetime.fromisoformat(data["approval_expires_at"].replace("Z", "+00:00")) if data.get("approval_expires_at") else None,
            customer_approved_at=datetime.fromisoformat(data["customer_approved_at"].replace("Z", "+00:00")) if data.get("customer_approved_at") else None,
            sent_for_approval_at=datetime.fromisoformat(data["sent_for_approval_at"].replace("Z", "+00:00")) if data.get("sent_for_approval_at") else None,
            started_at=datetime.fromisoformat(data["started_at"].replace("Z", "+00:00")) if data.get("started_at") else None,
            closed_at=datetime.fromisoformat(data["closed_at"].replace("Z", "+00:00")) if data.get("closed_at") else None,
            created_at=datetime.fromisoformat(data["created_at"].replace("Z", "+00:00")),
            updated_at=datetime.fromisoformat(data["updated_at"].replace("Z", "+00:00")),
            updated_by=data.get("updated_by"),
            status_notes=data.get("status_notes"),
            metadata=data.get("metadata", {})
        )
    
    def _check_state_requirements(
        self,
        job_card: JobCard,
        target_state: JobStatus
    ) -> Dict[str, Any]:
        """Check if job card meets requirements for state transition"""
        requirements = []
        
        if target_state == JobStatus.CONTEXT_VERIFIED:
            requirements.append({
                "field": "vehicle_context",
                "valid": bool(job_card.registration_number),
                "message": "Registration number required"
            })
        
        elif target_state == JobStatus.DIAGNOSED:
            requirements.append({
                "field": "symptoms",
                "valid": len(job_card.symptoms) > 0,
                "message": "At least one symptom required"
            })
        
        elif target_state == JobStatus.ESTIMATED:
            requirements.append({
                "field": "diagnosis",
                "valid": job_card.diagnosis is not None,
                "message": "Diagnosis required before estimation"
            })
        
        elif target_state == JobStatus.IN_PROGRESS:
            requirements.append({
                "field": "customer_approval",
                "valid": job_card.status == JobStatus.CUSTOMER_APPROVAL,
                "message": "Must be in CUSTOMER_APPROVAL state"
            })
        
        elif target_state == JobStatus.PDI:
            requirements.append({
                "field": "in_progress",
                "valid": job_card.status == JobStatus.IN_PROGRESS,
                "message": "Must complete IN_PROGRESS phase"
            })
        
        all_valid = all(r["valid"] for r in requirements)
        
        return {
            "valid": all_valid,
            "requirements": requirements,
            "message": ", ".join([r["message"] for r in requirements if not r["valid"]])
        }
    
    def _log_state_change(
        self,
        job_id: str,
        previous_state: JobStatus,
        new_state: JobStatus,
        changed_by: Optional[str] = None,
        notes: Optional[str] = None
    ):
        """Log state change to history table"""
        try:
            self.supabase.table(self.states_table).insert({
                "job_card_id": job_id,
                "previous_status": previous_state.value,
                "new_status": new_state.value,
                "changed_by": changed_by,
                "notes": notes
            }).execute()
        except Exception as e:
            logger.error(f"Error logging state change: {e}")
    
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

_job_card_manager: Optional[JobCardManager] = None


def get_job_card_manager(supabase_client) -> JobCardManager:
    """Get or create JobCardManager singleton"""
    global _job_card_manager
    if _job_card_manager is None:
        _job_card_manager = JobCardManager(supabase_client)
    return _job_card_manager
