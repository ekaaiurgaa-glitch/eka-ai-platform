
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/GST, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // MG State Machine (A6)
  | 'MG_ACTIVE'
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

export interface MGAnalysis {
  fleet_id: string;
  vehicle_id: string;
  contract_period: {
    start: string;
    end: string;
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
  intelligence: {
    utilization_ratio: number;
    revenue_stability_index: number;
    asset_efficiency_score: number;
    contract_health: 'Healthy' | 'Risk' | 'Loss';
  };
  audit_trail: {
    logic_applied: string;
    formula_used: string;
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
