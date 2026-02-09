/**
 * EKA-AI Platform - Complete API Type Definitions
 * Based on INTEGRATION_ASSESSMENT.md and E2E_TEST_RESULTS.md
 */

// ═══════════════════════════════════════════════════════════════
// USER & AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

export type UserRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'ADMIN' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  workshop_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  is_active: boolean;
}

export interface UserProfile {
  user_id: string;
  workshop_id: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  email: string;
  permissions: string[];
}

export interface Workshop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

// ═══════════════════════════════════════════════════════════════
// JOB CARD MANAGEMENT - Complete 9-State FSM
// ═══════════════════════════════════════════════════════════════

export type JobCardStatus = 
  | 'CREATED'
  | 'CONTEXT_VERIFIED'
  | 'DIAGNOSED'
  | 'ESTIMATED'
  | 'CUSTOMER_APPROVAL'
  | 'IN_PROGRESS'
  | 'PDI'
  | 'PDI_COMPLETED'
  | 'INVOICED'
  | 'CLOSED'
  | 'CANCELLED';

// Valid state transitions based on JobCardManager FSM
export const VALID_JOB_TRANSITIONS: Record<JobCardStatus, JobCardStatus[]> = {
  'CREATED': ['CONTEXT_VERIFIED', 'CANCELLED'],
  'CONTEXT_VERIFIED': ['DIAGNOSED', 'CANCELLED'],
  'DIAGNOSED': ['ESTIMATED', 'CANCELLED'],
  'ESTIMATED': ['CUSTOMER_APPROVAL', 'CANCELLED'],
  'CUSTOMER_APPROVAL': ['IN_PROGRESS', 'CANCELLED'],
  'IN_PROGRESS': ['PDI', 'CANCELLED'],
  'PDI': ['PDI_COMPLETED', 'CANCELLED'],
  'PDI_COMPLETED': ['INVOICED', 'CANCELLED'],
  'INVOICED': ['CLOSED', 'CANCELLED'],
  'CLOSED': [],
  'CANCELLED': []
};

export interface JobCard {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  
  // Customer Information
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  
  // Vehicle Information
  registration_number: string;
  vehicle_details?: string;
  odometer_reading?: number;
  fuel_level?: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  
  // Job Details
  status: JobCardStatus;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  symptoms: string[];
  reported_issues: string;
  diagnosis?: string;
  notes?: string;
  
  // Approval System
  customer_approval_token?: string;
  approval_expires_at?: string;
  customer_approved_at?: string;
  
  // State Management
  allowed_transitions: JobCardStatus[];
  state_history: JobCardStateHistory[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
  created_by: string;
  assigned_to?: string;
  
  // Relations
  pdi_checklist?: PDIChecklist;
  invoice?: Invoice;
}

export interface JobCardStateHistory {
  id: string;
  job_card_id: string;
  from_state: JobCardStatus;
  to_state: JobCardStatus;
  transitioned_by: string;
  actor_type: 'USER' | 'AI' | 'SYSTEM';
  reason?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════
// PDI CHECKLIST - 16-Item Standardized Checklist
// ═══════════════════════════════════════════════════════════════

export interface PDIChecklist {
  id: string;
  job_card_id: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  items: PDIChecklistItem[];
  
  // Completion Requirements
  technician_declaration: boolean;
  declared_by?: string;
  declared_at?: string;
  
  // Evidence
  evidence_provided: boolean;
  evidence_count: number;
  
  created_at: string;
  completed_at?: string;
}

export interface PDIChecklistItem {
  id: string;
  checklist_id: string;
  category: PDICategory;
  task: string;
  description: string;
  is_critical: boolean;
  
  // Status
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
  notes?: string;
  
  // Evidence
  has_evidence: boolean;
  evidence_urls?: string[];
}

export type PDICategory = 
  | 'EXTERIOR'
  | 'INTERIOR'
  | 'MECHANICAL'
  | 'ELECTRICAL'
  | 'SAFETY'
  | 'DOCUMENTATION';

// Standard 16-item PDI checklist as per PDIManager
export const STANDARD_PDI_ITEMS: Omit<PDIChecklistItem, 'id' | 'checklist_id' | 'completed' | 'completed_by' | 'completed_at' | 'notes' | 'has_evidence' | 'evidence_urls'>[] = [
  { category: 'EXTERIOR', task: 'Body Damage Inspection', description: 'Check for dents, scratches, paint damage', is_critical: true },
  { category: 'EXTERIOR', task: 'Glass & Mirrors', description: 'Check windshield, windows, mirrors for cracks', is_critical: true },
  { category: 'EXTERIOR', task: 'Lights & Indicators', description: 'Verify all lights functioning', is_critical: true },
  { category: 'EXTERIOR', task: 'Wiper Condition', description: 'Check wiper blades and washer fluid', is_critical: false },
  { category: 'INTERIOR', task: 'Seat Condition', description: 'Check seats for tears, stains, functionality', is_critical: false },
  { category: 'INTERIOR', task: 'Dashboard Function', description: 'Verify all dashboard indicators and warnings', is_critical: true },
  { category: 'INTERIOR', task: 'AC/Heater Operation', description: 'Test climate control system', is_critical: false },
  { category: 'INTERIOR', task: 'Interior Cleanliness', description: 'Check for cleanliness and odors', is_critical: false },
  { category: 'MECHANICAL', task: 'Engine Oil Level', description: 'Check oil level and condition', is_critical: true },
  { category: 'MECHANICAL', task: 'Brake Fluid Level', description: 'Verify brake fluid at proper level', is_critical: true },
  { category: 'MECHANICAL', task: 'Coolant Level', description: 'Check coolant reservoir', is_critical: true },
  { category: 'MECHANICAL', task: 'Tire Condition', description: 'Check tread depth and tire pressure', is_critical: true },
  { category: 'ELECTRICAL', task: 'Battery Condition', description: 'Check battery terminals and voltage', is_critical: true },
  { category: 'ELECTRICAL', task: 'Electrical Accessories', description: 'Test horn, power windows, central locking', is_critical: false },
  { category: 'SAFETY', task: 'Spare Tire & Tools', description: 'Verify spare tire and jack present', is_critical: true },
  { category: 'DOCUMENTATION', task: 'Service History Review', description: 'Review previous service records', is_critical: false }
];

export interface PDIEvidence {
  id: string;
  checklist_item_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  uploaded_at: string;
  uploaded_by: string;
}

// ═══════════════════════════════════════════════════════════════
// INVOICE MANAGEMENT - GST Compliant
// ═══════════════════════════════════════════════════════════════

export interface Invoice {
  id: string;
  job_card_id: string;
  workshop_id: string;
  
  // Invoice Details
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  
  // Status
  status: 'DRAFT' | 'FINALIZED' | 'SENT' | 'PAID' | 'CANCELLED';
  
  // Customer Details
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  customer_gstin?: string;
  billing_address?: string;
  
  // Vehicle Details
  registration_number: string;
  vehicle_details?: string;
  
  // Line Items
  items: InvoiceItem[];
  
  // Financial Summary
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  tax_type: 'CGST_SGST' | 'IGST';
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_tax: number;
  total_amount: number;
  
  // Payment
  amount_paid: number;
  amount_due: number;
  
  // Timestamps
  created_at: string;
  updated_at?: string;
  finalized_at?: string;
  sent_at?: string;
  paid_at?: string;
  created_by: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  hsn_code?: string;
  type: 'PART' | 'LABOR' | 'SERVICE';
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  
  // Calculated
  subtotal: number;
  discount_amount: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
}

// ═══════════════════════════════════════════════════════════════
// AI & CHAT
// ═══════════════════════════════════════════════════════════════

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  
  // AI Response Metadata
  confidence_score?: number;
  validation_passed?: boolean;
  domain_gate_passed?: boolean;
  
  // Associated Data
  job_card_id?: string;
  diagnostic_data?: DiagnosticData;
  estimate_data?: EstimateData;
  mg_analysis?: MGAnalysis;
  
  // UI Triggers
  ui_triggers?: {
    theme_color?: string;
    show_visuals?: boolean;
  };
}

export interface DiagnosticData {
  code: string;
  description: string;
  severity: 'CRITICAL' | 'MODERATE' | 'ADVISORY';
  confidence_score: number;
  possible_causes: string[];
  recommended_actions: string[];
  systems_affected: string[];
  estimated_cost_range?: {
    min: number;
    max: number;
  };
}

export interface EstimateData {
  estimate_id: string;
  items: EstimateItem[];
  labor_hours: number;
  labor_rate: number;
  total_estimate: number;
}

export interface EstimateItem {
  id: string;
  description: string;
  hsn_code: string;
  price_range: string;
  unit_price: number;
  quantity: number;
  gst_rate: 18 | 28;
  type: 'PART' | 'LABOR';
}

// ═══════════════════════════════════════════════════════════════
// MG FLEET MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export interface MGContract {
  id: string;
  workshop_id: string;
  customer_name: string;
  customer_phone: string;
  
  // Contract Details
  contract_number: string;
  vehicle_registration: string;
  vehicle_model: string;
  
  // Billing Parameters
  assured_kilometers: number;
  rate_per_km: number;
  monthly_assured_km: number;
  monthly_assured_revenue: number;
  billing_cycle_months: number;
  
  // Risk Profile
  safety_buffer_percent: number;
  base_risk_score: number;
  
  status: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED';
  created_at: string;
  updated_at?: string;
}

export interface MGVehicleLog {
  id: string;
  contract_id: string;
  
  // Odometer Reading
  opening_km: number;
  closing_km: number;
  actual_km: number;
  
  // Billing Period
  month: number;
  year: number;
  
  // Calculated Values
  utilization_status: 'SAFE' | 'WARNING' | 'BREACHED';
  billed_to_mg_pool: number;
  billed_to_customer: number;
  unused_buffer_value: number;
  
  created_at: string;
}

export interface MGAnalysis {
  contract_status: string;
  mg_type: string;
  risk_profile: {
    base_risk_score: number;
    safety_buffer_percent: number;
  };
  financial_summary: {
    utilization_status: 'SAFE' | 'WARNING' | 'BREACHED';
    actual_utilization: number;
    mg_monthly_limit: number;
    invoice_split: {
      billed_to_mg_pool: number;
      billed_to_customer: number;
      unused_buffer_value: number;
    };
  };
  audit_trail: {
    risk_weights_used: string;
    formula_used: string;
  };
  parameters?: {
    assured_kilometers: number;
    rate_per_km: number;
    billing_cycle: string;
    monthly_assured_km: number;
    monthly_assured_revenue: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// API REQUEST/RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════

// Job Cards API
export interface CreateJobCardRequest {
  registration_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  symptoms: string[];
  reported_issues?: string;
  odometer_reading?: number;
  fuel_level?: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface UpdateJobCardRequest {
  customer_name?: string;
  customer_phone?: string;
  symptoms?: string[];
  reported_issues?: string;
  odometer_reading?: number;
  fuel_level?: 'EMPTY' | 'QUARTER' | 'HALF' | 'THREE_QUARTER' | 'FULL';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

export interface TransitionJobCardRequest {
  target_state: JobCardStatus;
  reason?: string;
}

export interface JobCardListResponse {
  job_cards: JobCard[];
  total: number;
  page: number;
  per_page: number;
}

export interface JobCardStats {
  total: number;
  active: number;
  by_status: Record<JobCardStatus, number>;
  by_priority: Record<string, number>;
}

// PDI API
export interface UpdatePDIItemRequest {
  item_id: string;
  completed: boolean;
  notes?: string;
}

export interface CompletePDIRequest {
  technician_declaration: boolean;
  declaration_text?: string;
}

// Invoice API
export interface CreateInvoiceRequest {
  job_card_id: string;
  items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'subtotal' | 'taxable_amount' | 'cgst_amount' | 'sgst_amount' | 'igst_amount' | 'total_amount'>[];
  discount_amount?: number;
  customer_gstin?: string;
  billing_address?: string;
}

// Chat API
export interface ChatRequest {
  message: string;
  job_card_id?: string;
  vehicle_context?: {
    registration_number?: string;
    brand?: string;
    model?: string;
    year?: string;
  };
  history?: ChatMessage[];
}

export interface ChatResponse {
  message: ChatMessage;
  actions?: {
    type: 'CREATE_JOB_CARD' | 'UPDATE_STATUS' | 'GENERATE_ESTIMATE' | 'SCHEDULE_FOLLOWUP';
    data?: any;
  }[];
}

// ═══════════════════════════════════════════════════════════════
// FILTER & QUERY TYPES
// ═══════════════════════════════════════════════════════════════

export interface JobCardFilters {
  status?: JobCardStatus;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  search?: string;
  date_from?: string;
  date_to?: string;
  assigned_to?: string;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'priority';
  sort_order?: 'asc' | 'desc';
}

export interface InvoiceFilters {
  status?: 'DRAFT' | 'FINALIZED' | 'SENT' | 'PAID' | 'CANCELLED';
  date_from?: string;
  date_to?: string;
  customer_name?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════

export interface DashboardMetrics {
  // Job Cards
  active_job_cards: number;
  jobs_created_today: number;
  jobs_completed_today: number;
  
  // Revenue
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  pending_invoices_amount: number;
  
  // PDI
  pending_pdi_count: number;
  pdi_completed_today: number;
  
  // Customers
  new_customers_this_month: number;
  returning_customers: number;
  
  // Workshop
  technician_utilization: number;
  average_job_duration_hours: number;
}

export interface ActivityItem {
  id: string;
  type: 'JOB_CREATED' | 'STATUS_CHANGED' | 'INVOICE_GENERATED' | 'PAYMENT_RECEIVED' | 'PDI_COMPLETED';
  description: string;
  actor: string;
  actor_role: UserRole;
  timestamp: string;
  metadata?: Record<string, any>;
}
