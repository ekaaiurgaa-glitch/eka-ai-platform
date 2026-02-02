
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
  batteryCapacity?: string;
  motorPower?: string;
  hvSafetyConfirmed?: boolean;
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  const baseComplete = !!(ctx.vehicleType && ctx.brand && ctx.model && ctx.year && ctx.fuelType);
  
  if (ctx.fuelType === 'Electric') {
    return baseComplete && !!ctx.batteryCapacity && !!ctx.motorPower && !!ctx.hvSafetyConfirmed;
  }
  
  if (ctx.fuelType === 'Hybrid') {
    return baseComplete && !!ctx.hvSafetyConfirmed;
  }
  
  return baseComplete;
};
