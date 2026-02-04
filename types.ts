// src/types.ts

export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default, 1: Workshop, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // New Job Card Flow (Strict)
  | 'DIAGNOSED' 
  | 'ESTIMATED' 
  | 'CUSTOMER_APPROVED' 
  | 'PDI_COMPLETED' 
  | 'INVOICED' 
  | 'CLOSED'
  // Legacy/Other Statuses (Kept for safety)
  | 'IGNITION_TRIAGE' | 'RSA_ACTIVE' | 'URGAA_QUERY'
  | 'AUTH_INTAKE' | 'SYMPTOM_RECORDING' | 'DIAGNOSTICS_WISDOM'
  | 'INVENTORY_GATING' | 'ESTIMATE_GOVERNANCE' | 'APPROVAL_GATE'
  | 'EXECUTION_QUALITY' | 'PDI_CHECKLIST'
  | 'CONTRACT_VALIDATION' | 'UTILIZATION_TRACKING' | 'SETTLEMENT_LOGIC'
  | 'SLA_BREACH_CHECK' | 'MG_COMPLETE';

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
  contract_status: 'ACTIVE' | 'INACTIVE' | 'BREACHED';
  mg_type: 'KM_BASED'; 
  parameters: {
    assured_kilometers: number;
    rate_per_km: number;
    billing_cycle: string;
  };
  cycle_data: {
    actual_km_run: number;
    shortfall_km: number;
    excess_km: number;
  };
  financials: {
    base_fee: number;
    excess_fee: number;
    total_invoice: number;
  };
  audit_log: string;
}

export interface DiagnosticData {
  code: string;
  description: string;
  severity: 'CRITICAL' | 'MODERATE' | 'ADVISORY';
  possible_causes: string[];
  recommended_actions: string[];
  systems_affected: string[];
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
  batteryCapacity?: string;
  motorPower?: string;
  hvSafetyConfirmed?: boolean;
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  const baseComplete = !!(ctx.vehicleType && ctx.brand && ctx.model && ctx.year && ctx.fuelType);
  if (ctx.vehicleType === '4W' && !ctx.vin) return false;
  return baseComplete;
};
