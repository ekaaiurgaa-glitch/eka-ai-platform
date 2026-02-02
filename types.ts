
export type MessageRole = 'user' | 'assistant';

export type OperatingMode = 0 | 1 | 2; // 0: Default, 1: Job Card, 2: MG Fleet

export type JobStatus = 
  | 'CREATED' 
  | 'JOB_CARD_OPENING'
  | 'PROBLEM_INTAKE'
  | 'DIAGNOSTIC_REASONING'
  | 'ESTIMATE_PREPARATION'
  | 'CUSTOMER_APPROVAL_GATE'
  | 'WORK_EXECUTION'
  | 'INVOICING'
  | 'VEHICLE_CONTEXT_COLLECTED' 
  | 'CLOSED'
  | 'MG_CONTRACT_SETUP'
  | 'MG_PERIOD_TRACKING'
  | 'MG_SETTLEMENT'
  | 'MG_REPORTING'
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
