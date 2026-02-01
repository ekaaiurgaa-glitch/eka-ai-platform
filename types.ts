
export type MessageRole = 'user' | 'assistant';

export type JobStatus = 
  | 'CREATED' 
  | 'CONFIDENCE_CONFIRMED'
  | 'VEHICLE_CONTEXT_COLLECTED' 
  | 'DIAGNOSIS_READY'
  | 'ESTIMATE_READY'
  | 'CUSTOMER_APPROVED' 
  | 'IN_PROGRESS' 
  | 'PDI_COMPLETED' 
  | 'INVOICED' 
  | 'CLOSED';

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
  grounding_urls?: { title: string; uri: string }[];
  timestamp: Date;
  isValidated?: boolean;
  validationError?: boolean;
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
