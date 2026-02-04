
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/Workshop, 2: MG Fleet

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
  | 'DIAGNOSED' 
  | 'ESTIMATED' 
  | 'CUSTOMER_APPROVED' 
  | 'PDI_COMPLETED' 
  | 'INVOICED' 
  | 'CLOSED'
  // Transitionary / Internal Gates
  | 'INTAKE'
  | 'DIAGNOSIS'
  | 'ESTIMATION'
  | 'APPROVAL'
  | 'EXECUTION'
  | 'PDI'
  | 'COMPLETION'
  | 'INVOICING'
  // Diagnostic Gates
  | 'AWAITING_ROOT_CAUSE'
  | 'INVOICE_ELIGIBLE'
  // Compatibility
  | 'IGNITION_TRIAGE'
  | 'AUTH_INTAKE'
  | 'RSA_ACTIVE';

export type IntelligenceMode = 'FAST' | 'THINKING';

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
