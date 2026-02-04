
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/GST, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // MG State Machine (Risk-Weighted Model)
  | 'MG_CREATED'
  | 'MG_ACTIVE'
  | 'MG_CONSUMING'
  | 'MG_THRESHOLD_ALERT'
  | 'MG_EXHAUSTED'
  | 'MG_CLOSED'
  // Legacy MG States
  | 'BILLING_CYCLE_CLOSED'
  | 'SETTLED'
  | 'TERMINATED'
  | 'CONTRACT_VALIDATION'
  // Job Card Flow (Section B)
  | 'INTAKE'
  | 'DIAGNOSIS'
  | 'ESTIMATION'
  | 'APPROVAL'
  | 'EXECUTION'
  | 'PDI'
  | 'COMPLETION'
  | 'INVOICING'
  | 'CLOSED'
  // Diagnostic Gates
  | 'AWAITING_ROOT_CAUSE'
  | 'INVOICE_ELIGIBLE'
  // Compatibility/Legacy status support
  | 'IGNITION_TRIAGE'
  | 'AUTH_INTAKE'
  | 'SYMPTOM_RECORDING'
  | 'ESTIMATE_GOVERNANCE'
  | 'APPROVAL_GATE'
  | 'MG_COMPLETE'
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
  price_range: string; // Range only, never exact price
  unit_price: number; // Added to support calculations in EstimateGovernance
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

// MG Contract Status (Risk-Weighted State Machine)
export type MGContractStatus = 'MG_CREATED' | 'MG_ACTIVE' | 'MG_CONSUMING' | 'MG_THRESHOLD_ALERT' | 'MG_EXHAUSTED' | 'MG_CLOSED';

// MG Type Classification
export type MGType = 'COST_BASED' | 'USAGE_BASED';

// Utilization Status for Financial Summary
export type UtilizationStatus = 'SAFE' | 'WARNING' | 'BREACHED';

export interface MGAnalysis {
  fleet_id: string;
  vehicle_id: string;
  // Risk-Weighted Contract Status
  contract_status: MGContractStatus;
  mg_type: MGType;
  contract_period: {
    start: string;
    end: string;
  };
  // Risk Profile (New for Risk-Weighted Model)
  risk_profile: {
    base_risk_score: number;
    safety_buffer_percent: number; // e.g., 15%
  };
  assured_metrics: {
    total_assured_km: number;
    monthly_assured_km: number;
    rate_per_km: number;
    monthly_assured_revenue: number;
  };
  cycle_data: {
    billing_cycle: string;
    actual_km_run: number;
    shortfall_km?: number;
    excess_km?: number;
  };
  financials: {
    revenue_payable: number;
    status: 'MINIMUM_GUARANTEE_APPLIED' | 'OVER_UTILIZATION_CHARGED';
  };
  // Financial Summary with Invoice Split (Risk-Weighted Model)
  financial_summary: {
    mg_monthly_limit: number;
    actual_utilization: number;
    utilization_status: UtilizationStatus;
    invoice_split: {
      billed_to_mg_pool: number;
      billed_to_customer: number;
      unused_buffer_value: number;
    };
  };
  intelligence: {
    utilization_ratio: number;
    revenue_stability_index: number;
    asset_efficiency_score: number;
    contract_health: 'Healthy' | 'Risk' | 'Loss';
  };
  audit_trail: {
    logic_applied: string;
    formula_used: string;
    risk_weights_used: string; // e.g., "Brakes: 1.3x, Filters: 1.0x"
  };
}

export interface DiagnosticData {
  code: string;
  description: string;
  severity: 'CRITICAL' | 'MODERATE' | 'ADVISORY';
  confidence_score: number; // 0-100, requires >90 for diagnosis
  possible_causes: string[];
  recommended_actions: string[];
  systems_affected: string[];
  missing_info?: string[];
}

export interface VisualMetric {
  type: 'PROGRESS' | 'PIE' | 'BAR' | 'RADAR' | 'AREA' | 'RADIAL';
  label: string;
  data: Array<{ name: string; value: number; color?: string; fullMark?: number }>;
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
  service_history?: ServiceHistoryItem[];
  estimate_data?: EstimateData;
  mg_analysis?: MGAnalysis;
  grounding_links?: GroundingLink[];
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
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  return !!(ctx.vehicleType && ctx.brand && ctx.model && ctx.year && ctx.fuelType);
};
