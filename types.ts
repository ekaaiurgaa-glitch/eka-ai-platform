
export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface VehicleContext {
  brand?: string;
  model?: string;
  year?: string;
  fuelType?: string;
}
