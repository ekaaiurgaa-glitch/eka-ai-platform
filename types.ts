
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/GST, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // Mode 0 Statuses
  | 'IGNITION_TRIAGE'
  | 'RSA_ACTIVE'
  | 'URGAA_QUERY'
  // Mode 1 Statuses (Workshop)
  | 'AUTH_INTAKE'
  | 'SYMPTOM_RECORDING'
  | 'DIAGNOSTICS_WISDOM'
  | 'INVENTORY_GATING'
  | 'ESTIMATE_GOVERNANCE'
  | 'APPROVAL_GATE'
  | 'EXECUTION_QUALITY'
  | 'PDI_CHECKLIST'
  | 'CLOSED'
  // Mode 2 Statuses (Fleet)
  | 'CONTRACT_VALIDATION'
  | 'UTILIZATION_TRACKING'
  | 'SETTLEMENT_LOGIC'
  | 'SLA_BREACH_CHECK'
  | 'MG_COMPLETE';

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

export interface MGLineItem {
  item: string;
  category: 'PREVENTIVE' | 'ACCIDENTAL' | 'WEAR_TEAR' | 'ABUSE' | 'COSMETIC' | 'DIAGNOSTIC';
  classification: 'MG_COVERED' | 'NON_MG_PAYABLE';
  cost: number;
}

export interface MGAnalysis {
  contract_status: 'ACTIVE' | 'INACTIVE';
  mg_type: 'COST_BASED' | 'USAGE_BASED';
  line_item_analysis: MGLineItem[];
  financial_summary: {
    mg_monthly_limit: number;
    actual_utilization: number;
    utilization_status: 'UNDER_RUN' | 'OVER_RUN' | 'EXACT';
    invoice_split: {
      billed_to_mg_pool: number;
      billed_to_customer: number;
      unused_buffer_value: number;
    };
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
  
  if (ctx.vehicleType === '4W') {
    if (!ctx.vin) return false;
  }

  if (ctx.fuelType === 'Electric') {
    return baseComplete && !!ctx.batteryCapacity && !!ctx.motorPower && !!ctx.hvSafetyConfirmed;
  }
  
  if (ctx.fuelType === 'Hybrid') {
    return baseComplete && !!ctx.hvSafetyConfirmed;
  }
  
  return baseComplete;
};
