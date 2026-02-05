
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/Workshop, 2: MG Fleet

// Primary Job Card Lifecycle States (9-state pipeline)
export type JobCardLifecycleStatus = 
  | 'CREATED'
  | 'CONTEXT_VERIFIED'
  | 'DIAGNOSED'
  | 'ESTIMATED'
  | 'CUSTOMER_APPROVAL'
  | 'IN_PROGRESS'
  | 'PDI'
  | 'INVOICED'
  | 'CLOSED';

export type JobStatus = 
  | 'CREATED' 
  // MG State Machine (Advanced)
  | 'MG_CREATED' 
  | 'MG_ACTIVE' 
  | 'MG_CONSUMING' 
  | 'MG_THRESHOLD_ALERT' 
  | 'MG_EXHAUSTED' 
  | 'MG_CLOSED'
  | 'BILLING_CYCLE_CLOSED'
  | 'SETTLED'
  | 'TERMINATED'
  // Strict Job Card Flow
  | 'CONTEXT_VERIFIED'
  | 'DIAGNOSED' 
  | 'ESTIMATED' 
  | 'CUSTOMER_APPROVAL'
  | 'CUSTOMER_APPROVED' 
  | 'CONCERN_RAISED'
  | 'IN_PROGRESS'
  | 'PDI'
  | 'PDI_COMPLETED' 
  | 'INVOICED' 
  | 'CLOSED'
  // Transitionary / Internal Gates
  | 'INTAKE'
  | 'DIAGNOSIS'
  | 'ESTIMATION'
  | 'APPROVAL'
  | 'EXECUTION'
  | 'COMPLETION'
  | 'INVOICING'
  // Diagnostic Gates
  | 'AWAITING_ROOT_CAUSE'
  | 'INVOICE_ELIGIBLE'
  // Compatibility
  | 'IGNITION_TRIAGE'
  | 'AUTH_INTAKE'
  | 'RSA_ACTIVE';

// Audit Trail Types
export type AuditActorType = 'USER' | 'AI' | 'SYSTEM';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: AuditActorType;
  actor_id?: string;
  confidence_score?: number;
  metadata?: Record<string, unknown>;
}

// PDI Evidence Types
export interface PDIEvidence {
  id: string;
  checklist_item_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  uploaded_at: string;
  uploaded_by?: string;
}

// Job Card Interface
export interface JobCard {
  id: string;
  vehicle_id: string;
  status: JobStatus;
  created_at: string;
  updated_at?: string;
  customer_phone?: string;
  customer_approval_token?: string;
  approval_expires_at?: string;
  pdi_evidence?: PDIEvidence[];
  audit_trail: AuditEntry[];
  created_by?: string;
}

export type IntelligenceMode = 'FAST' | 'THINKING' | 'DEEP_CONTEXT';

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface ServiceHistoryItem {
  date: string;
  service_type: string;
  odometer: string;
  notes: string;
}

export interface EstimateItem {
  id: string;
  description: string;
  hsn_code: string;
  price_range: string;
  unit_price: number;
  quantity: number;
  gst_rate: 18 | 28;
  type: 'PART' | 'LABOR';
}

export interface EstimateData {
  estimate_id: string;
  items: EstimateItem[];
  currency: string;
  tax_type: 'CGST_SGST' | 'IGST';
}

export interface MGAnalysis {
  contract_status: string;
  mg_type: string;
  risk_profile: {
    base_risk_score: number;
    safety_buffer_percent: number;
  };
  financial_summary: {
    utilization_status: 'SAFE' | 'WARNING' | 'BREACHED';
    actual_utilization: number;
    mg_monthly_limit: number;
    invoice_split: {
      billed_to_mg_pool: number;
      billed_to_customer: number;
      unused_buffer_value: number;
    };
  };
  audit_trail: {
    risk_weights_used: string;
    formula_used: string;
  };
  parameters?: {
    assured_kilometers: number;
    rate_per_km: number;
    billing_cycle: string;
    monthly_assured_km: number;
    monthly_assured_revenue: number;
  };
}

export interface DiagnosticData {
  code: string;
  description: string;
  severity: 'CRITICAL' | 'MODERATE' | 'ADVISORY';
  confidence_score: number;
  possible_causes: string[];
  recommended_actions: string[];
  systems_affected: string[];
  root_cause_identified?: boolean;
}

export interface RecallData {
  model_year: string;
  recalls: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    date: string;
    remedy: string;
  }>;
  common_issues: Array<{
    component: string;
    symptoms: string[];
    description: string;
    prevalence: string;
  }>;
}

export interface VisualMetric {
  type: 'PROGRESS' | 'PIE' | 'BAR' | 'RADAR' | 'AREA' | 'RADIAL' | 'LINE' | 'COMPOSED';
  label: string;
  data: Array<{ name: string; value: number; color?: string; fullMark?: number; unit?: string }>;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string; 
  response_content?: {
    visual_text: string;
    audio_text: string;
  };
  job_status_update?: JobStatus;
  ui_triggers?: {
    theme_color: string;
    brand_identity: string;
    show_orange_border: boolean;
  };
  visual_assets?: {
    vehicle_display_query: string;
    part_display_query: string | null;
  };
  visual_metrics?: VisualMetric;
  diagnostic_data?: DiagnosticData;
  recall_data?: RecallData;
  service_history?: ServiceHistoryItem[];
  estimate_data?: EstimateData;
  mg_analysis?: MGAnalysis;
  grounding_links?: GroundingLink[];
  pdi_checklist?: {
    items: { task: string; completed: boolean }[];
    technician_declaration: boolean;
    evidence_provided: boolean;
  };
  timestamp: Date;
  isValidated?: boolean;
  validationError?: boolean;
  intelligenceMode?: IntelligenceMode;
  operatingMode?: OperatingMode;
}

export interface VehicleContext {
  vehicleType: '2W' | '4W' | '';
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  registrationNumber?: string;
  vin?: string;
  pdiVerified?: boolean;
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  return !!(ctx.vehicleType && ctx.brand && ctx.model && ctx.year && ctx.fuelType);
};

// Job Card Lifecycle States Configuration (9-state pipeline)
export const JOB_CARD_LIFECYCLE_STATES: {
  id: JobCardLifecycleStatus;
  label: string;
  description: string;
}[] = [
  { id: 'CREATED', label: 'Created', description: 'Job card initiated' },
  { id: 'CONTEXT_VERIFIED', label: 'Context', description: 'Vehicle details verified' },
  { id: 'DIAGNOSED', label: 'Diagnosed', description: 'Issue analysis complete' },
  { id: 'ESTIMATED', label: 'Estimated', description: 'Cost estimate prepared' },
  { id: 'CUSTOMER_APPROVAL', label: 'Approval', description: 'Awaiting customer approval' },
  { id: 'IN_PROGRESS', label: 'In Progress', description: 'Work in progress' },
  { id: 'PDI', label: 'PDI', description: 'Pre-delivery inspection' },
  { id: 'INVOICED', label: 'Invoiced', description: 'Invoice generated' },
  { id: 'CLOSED', label: 'Closed', description: 'Job completed' }
];

// Map JobStatus to lifecycle state for progress display
export const mapStatusToLifecycleState = (status: JobStatus): JobCardLifecycleStatus => {
  const statusMap: Partial<Record<JobStatus, JobCardLifecycleStatus>> = {
    'CREATED': 'CREATED',
    'INTAKE': 'CREATED',
    'AUTH_INTAKE': 'CREATED',
    'IGNITION_TRIAGE': 'CREATED',
    'CONTEXT_VERIFIED': 'CONTEXT_VERIFIED',
    'DIAGNOSIS': 'DIAGNOSED',
    'DIAGNOSED': 'DIAGNOSED',
    'AWAITING_ROOT_CAUSE': 'DIAGNOSED',
    'ESTIMATION': 'ESTIMATED',
    'ESTIMATED': 'ESTIMATED',
    'APPROVAL': 'CUSTOMER_APPROVAL',
    'CUSTOMER_APPROVAL': 'CUSTOMER_APPROVAL',
    'CUSTOMER_APPROVED': 'IN_PROGRESS',
    'EXECUTION': 'IN_PROGRESS',
    'IN_PROGRESS': 'IN_PROGRESS',
    'PDI': 'PDI',
    'PDI_COMPLETED': 'PDI',
    'COMPLETION': 'PDI',
    'INVOICING': 'INVOICED',
    'INVOICED': 'INVOICED',
    'INVOICE_ELIGIBLE': 'INVOICED',
    'CLOSED': 'CLOSED',
    'SETTLED': 'CLOSED',
    'TERMINATED': 'CLOSED'
  };
  return statusMap[status] || 'CREATED';
};

// Validation utilities
export const validateVIN = (vin: string): { valid: boolean; error?: string } => {
  if (!vin) return { valid: false, error: 'VIN is required' };
  // VIN should be 17 characters, no I, O, or Q
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  if (vin.length !== 17) return { valid: false, error: 'VIN must be exactly 17 characters' };
  if (/[IOQ]/i.test(vin)) return { valid: false, error: 'VIN cannot contain I, O, or Q' };
  if (!vinRegex.test(vin)) return { valid: false, error: 'VIN contains invalid characters' };
  return { valid: true };
};

export const validateIndianPhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  // Indian phone format: +91XXXXXXXXXX or 10 digits
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!phoneRegex.test(cleanPhone)) return { valid: false, error: 'Invalid Indian phone format (+91XXXXXXXXXX)' };
  return { valid: true };
};

export const validateOdometer = (reading: string | number): { valid: boolean; error?: string } => {
  const value = typeof reading === 'string' ? parseInt(reading, 10) : reading;
  if (isNaN(value)) return { valid: false, error: 'Odometer must be a number' };
  if (value < 0) return { valid: false, error: 'Odometer cannot be negative' };
  if (value > 1000000) return { valid: false, error: 'Odometer reading seems unrealistic (>1,000,000 km)' };
  return { valid: true };
};
