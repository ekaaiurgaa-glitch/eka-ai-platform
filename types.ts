
export type MessageRole = 'user' | 'assistant';

export type JobStatus = 
  | 'CREATED' 
  | 'VEHICLE_CONTEXT_COLLECTED' 
  | 'CONFIDENCE_CONFIRMED' 
  | 'READY_FOR_PRICING' 
  | 'IN_PROGRESS' 
  | 'PDI_COMPLETED' 
  | 'CUSTOMER_APPROVED' 
  | 'INVOICED' 
  | 'CLOSED';

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
