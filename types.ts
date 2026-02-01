
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
  content: string;
  timestamp: Date;
  isValidated?: boolean;
  validationError?: boolean;
}

export interface VehicleContext {
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;
}
