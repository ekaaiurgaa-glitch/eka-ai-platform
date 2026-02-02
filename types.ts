
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default/Ignition, 1: Job Card/GST, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  // Mode 0 Statuses
  | 'RSA_TRIAGE'
  | 'CHARGER_LOCATING'
  | 'SYMPTOM_TRIAGE'
  // Mode 1 Statuses
  | 'AUTH_INTAKE'
  | 'DIAGNOSTICS_WISDOM'
  | 'ESTIMATE_GOVERNANCE'
  | 'APPROVAL_GATE'
  | 'EXECUTION_QUALITY'
  | 'CLOSED'
  // Mode 2 Statuses
  | 'CONTRACT_VALIDATION'
  | 'UTILIZATION_TRACKING'
  | 'UPTIME_PENALTY_GOVERNANCE'
  | 'SETTLEMENT_REPORTING'
  | 'MG_COMPLETE';

export type IntelligenceMode = 'FAST' | 'THINKING';

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
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  return !!(ctx.vehicleType && ctx.brand && ctx.model && ctx.year && ctx.fuelType);
};
