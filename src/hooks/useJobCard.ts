import { useState, useCallback, useRef } from 'react';
import { 
  JobCard, 
  JobStatus, 
  VehicleContext, 
  EstimateData,
  AuditEntry,
  PDIEvidence,
  mapStatusToLifecycleState,
  JOB_CARD_LIFECYCLE_STATES
} from '../types';

interface UseJobCardState {
  jobCard: JobCard | null;
  currentStatus: JobStatus;
  vehicleData: VehicleContext | null;
  estimateData: EstimateData | null;
  pdiData: { items: { task: string; completed: boolean }[]; technician_declaration: boolean; evidence_provided: boolean } | null;
  isLoading: boolean;
  error: string | null;
}

interface UseJobCardActions {
  initializeJobCard: (vehicleContext: VehicleContext) => void;
  updateStatus: (newStatus: JobStatus, metadata?: Record<string, unknown>) => void;
  setVehicleData: (data: VehicleContext) => void;
  setEstimateData: (data: EstimateData) => void;
  setPdiData: (data: UseJobCardState['pdiData']) => void;
  addAuditEntry: (action: string, actor: AuditEntry['actor'], confidence_score?: number) => void;
  addPdiEvidence: (evidence: PDIEvidence) => void;
  canTransitionTo: (targetStatus: JobStatus) => boolean;
  getLifecycleProgress: () => { current: number; total: number; percentage: number };
  reset: () => void;
}

// Valid state transitions map
const VALID_TRANSITIONS: Partial<Record<JobStatus, JobStatus[]>> = {
  'CREATED': ['CONTEXT_VERIFIED', 'INTAKE', 'AUTH_INTAKE'],
  'CONTEXT_VERIFIED': ['DIAGNOSED', 'DIAGNOSIS'],
  'DIAGNOSED': ['ESTIMATED', 'ESTIMATION'],
  'ESTIMATED': ['CUSTOMER_APPROVAL', 'APPROVAL'],
  'CUSTOMER_APPROVAL': ['CUSTOMER_APPROVED', 'IN_PROGRESS'],
  'CUSTOMER_APPROVED': ['IN_PROGRESS', 'EXECUTION'],
  'IN_PROGRESS': ['PDI', 'PDI_COMPLETED'],
  'PDI': ['PDI_COMPLETED', 'INVOICED'],
  'PDI_COMPLETED': ['INVOICED', 'INVOICING'],
  'INVOICED': ['CLOSED', 'SETTLED'],
  // Also support going back for corrections (limited)
  'INTAKE': ['CONTEXT_VERIFIED'],
  'AUTH_INTAKE': ['CONTEXT_VERIFIED'],
  'DIAGNOSIS': ['DIAGNOSED'],
  'ESTIMATION': ['ESTIMATED'],
  'APPROVAL': ['CUSTOMER_APPROVAL', 'CUSTOMER_APPROVED'],
  'EXECUTION': ['IN_PROGRESS', 'PDI'],
  'INVOICING': ['INVOICED'],
};

const generateId = (): string => {
  return `JC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

const generateAuditId = (): string => {
  return `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export function useJobCard(): [UseJobCardState, UseJobCardActions] {
  const [state, setState] = useState<UseJobCardState>({
    jobCard: null,
    currentStatus: 'CREATED',
    vehicleData: null,
    estimateData: null,
    pdiData: null,
    isLoading: false,
    error: null,
  });

  // Request deduplication - track pending requests
  const pendingRequests = useRef<Set<string>>(new Set());

  const addAuditEntry = useCallback((
    action: string, 
    actor: AuditEntry['actor'], 
    confidence_score?: number
  ) => {
    const entry: AuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      action,
      actor,
      confidence_score,
    };

    setState(prev => ({
      ...prev,
      jobCard: prev.jobCard ? {
        ...prev.jobCard,
        audit_trail: [...prev.jobCard.audit_trail, entry],
        updated_at: new Date().toISOString(),
      } : null,
    }));
  }, []);

  const initializeJobCard = useCallback((vehicleContext: VehicleContext) => {
    const requestKey = `init-${vehicleContext.registrationNumber || 'new'}`;
    if (pendingRequests.current.has(requestKey)) return;
    
    pendingRequests.current.add(requestKey);
    
    const newJobCard: JobCard = {
      id: generateId(),
      vehicle_id: vehicleContext.registrationNumber || vehicleContext.vin || generateId(),
      status: 'CREATED',
      created_at: new Date().toISOString(),
      audit_trail: [{
        id: generateAuditId(),
        timestamp: new Date().toISOString(),
        action: 'Job card created',
        actor: 'SYSTEM',
      }],
    };

    setState(prev => ({
      ...prev,
      jobCard: newJobCard,
      currentStatus: 'CREATED',
      vehicleData: vehicleContext,
      isLoading: false,
      error: null,
    }));

    pendingRequests.current.delete(requestKey);
  }, []);

  const updateStatus = useCallback((
    newStatus: JobStatus, 
    metadata?: Record<string, unknown>
  ) => {
    const requestKey = `status-${newStatus}`;
    if (pendingRequests.current.has(requestKey)) return;
    
    pendingRequests.current.add(requestKey);

    setState(prev => {
      // Optimistic update
      const updatedJobCard = prev.jobCard ? {
        ...prev.jobCard,
        status: newStatus,
        updated_at: new Date().toISOString(),
        audit_trail: [
          ...prev.jobCard.audit_trail,
          {
            id: generateAuditId(),
            timestamp: new Date().toISOString(),
            action: `Status changed to ${newStatus}`,
            actor: 'SYSTEM' as const,
            metadata,
          }
        ],
      } : null;

      return {
        ...prev,
        currentStatus: newStatus,
        jobCard: updatedJobCard,
      };
    });

    pendingRequests.current.delete(requestKey);
  }, []);

  const setVehicleData = useCallback((data: VehicleContext) => {
    setState(prev => ({
      ...prev,
      vehicleData: data,
    }));
  }, []);

  const setEstimateData = useCallback((data: EstimateData) => {
    setState(prev => ({
      ...prev,
      estimateData: data,
    }));
  }, []);

  const setPdiData = useCallback((data: UseJobCardState['pdiData']) => {
    setState(prev => ({
      ...prev,
      pdiData: data,
    }));
  }, []);

  const addPdiEvidence = useCallback((evidence: PDIEvidence) => {
    setState(prev => ({
      ...prev,
      jobCard: prev.jobCard ? {
        ...prev.jobCard,
        pdi_evidence: [...(prev.jobCard.pdi_evidence || []), evidence],
        updated_at: new Date().toISOString(),
      } : null,
    }));
  }, []);

  const canTransitionTo = useCallback((targetStatus: JobStatus): boolean => {
    const validTargets = VALID_TRANSITIONS[state.currentStatus];
    return validTargets?.includes(targetStatus) ?? false;
  }, [state.currentStatus]);

  const getLifecycleProgress = useCallback(() => {
    const lifecycleState = mapStatusToLifecycleState(state.currentStatus);
    const currentIndex = JOB_CARD_LIFECYCLE_STATES.findIndex(s => s.id === lifecycleState);
    const total = JOB_CARD_LIFECYCLE_STATES.length;
    const current = currentIndex + 1;
    const percentage = Math.round((current / total) * 100);
    
    return { current, total, percentage };
  }, [state.currentStatus]);

  const reset = useCallback(() => {
    setState({
      jobCard: null,
      currentStatus: 'CREATED',
      vehicleData: null,
      estimateData: null,
      pdiData: null,
      isLoading: false,
      error: null,
    });
    pendingRequests.current.clear();
  }, []);

  const actions: UseJobCardActions = {
    initializeJobCard,
    updateStatus,
    setVehicleData,
    setEstimateData,
    setPdiData,
    addAuditEntry,
    addPdiEvidence,
    canTransitionTo,
    getLifecycleProgress,
    reset,
  };

  return [state, actions];
}

export default useJobCard;
