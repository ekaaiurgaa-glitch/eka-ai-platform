// src/types.ts

export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default, 1: Job Card, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // MG States (Section A6)
  | 'MG_CREATED' 
  | 'MG_ACTIVE' 
  | 'BILLING_CYCLE_CLOSED' 
  | 'SETTLED' 
  | 'TERMINATED'
  // Job Card States (Section B)
  | 'INTAKE_PENDING'
  | 'ESTIMATION_PHASE'
  | 'CUSTOMER_APPROVAL_PENDING'
  | 'WORK_IN_PROGRESS'
  | 'PDI_VERIFICATION'
  | 'COMPLETED'  // Work done, PDI done, Evidence Locked (B6)
  | 'CLOSED';    // Payment settled, Learning enabled (B8)

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

// Updated to match Section A2 - A5
export interface MGAnalysis {
  contract_status: 'CREATED' | 'ACTIVE' | 'BILLING_CYCLE_CLOSED' | 'SETTLED' | 'TERMINATED';
  mg_type: 'KM_BASED'; 
  parameters: {
    assured_kilometers: number;
    contract_months: number;
    monthly_assured_km: number;
    rate_per_km: number;
    monthly_assured_revenue: number;
  };
  cycle_data: {
    actual_km_run: number;
    shortfall_km: number; // Section A3
    excess_km: number;    // Section A4
  };
  financials: {
    revenue_payable: number; // Section A3
    excess_revenue: number;  // Section A4
    total_revenue: number;
  };
  fleet_intelligence: { // Section A5
    utilization_ratio: number;
    revenue_stability_index: number;
    asset_efficiency_score: number;
    contract_health: 'HEALTHY' | 'RISK' | 'LOSS';
  };
  audit_log: string;
}

export interface DiagnosticData {
  code: string;
  description: string;
  severity: 'CRITICAL' | 'MODERATE' | 'ADVISORY';
  root_cause_confidence: number; // Section B2 (<90% triggers questions)
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
