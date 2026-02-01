
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

export interface Message {
  id: string;
  role: MessageRole;
  content: string; // Used for User messages and fallback
  response_content?: {
    visual_text: string;
    audio_text: string;
  };
  ui_triggers?: {
    theme_color: string;
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
  brand: string;
  model: string;
  year: string;
  fuelType: string;
}

export const isContextComplete = (ctx: VehicleContext): boolean => {
  return !!(ctx.brand && ctx.model && ctx.year && ctx.fuelType);
};
