
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
  content: string; // Keep original for compatibility/logs
  visual_content?: string;
  audio_content?: string;
  language_code?: string;
  available_translations?: string[];
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
