/**
 * Job Card Service - API Integration Layer
 * 
 * Provides typed methods for interacting with the Job Card Management API.
 * Based on the API contracts defined in INTEGRATION_ASSESSMENT.md
 */

import api from '../lib/api';
import {
  JobCard,
  JobCardListResponse,
  JobCardStats,
  JobCardStateHistory,
  PDIChecklist,
  PDIChecklistItem,
  PDIEvidence,
  Invoice,
  DashboardMetrics,
  CreateJobCardRequest,
  UpdateJobCardRequest,
  TransitionJobCardRequest,
  JobCardFilters,
  UpdatePDIItemRequest,
  CompletePDIRequest,
  CreateInvoiceRequest,
} from '../types/api.types';

// ═══════════════════════════════════════════════════════════════
// JOB CARD CRUD OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new job card
 * POST /api/job-cards
 */
export const createJobCard = async (data: CreateJobCardRequest): Promise<JobCard> => {
  const response = await api.post('/job-cards', data);
  return response.data;
};

/**
 * Get a single job card by ID
 * GET /api/job-cards/:id
 */
export const getJobCard = async (id: string): Promise<JobCard> => {
  const response = await api.get(`/job-cards/${id}`);
  return response.data;
};

/**
 * List job cards with optional filters
 * GET /api/job-cards
 */
export const listJobCards = async (filters?: JobCardFilters): Promise<JobCardListResponse> => {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);
  }
  
  const response = await api.get(`/job-cards?${params}`);
  return response.data;
};

/**
 * Update a job card
 * PUT /api/job-cards/:id
 */
export const updateJobCard = async (id: string, data: UpdateJobCardRequest): Promise<JobCard> => {
  const response = await api.put(`/job-cards/${id}`, data);
  return response.data;
};

/**
 * Cancel/Delete a job card
 * DELETE /api/job-cards/:id
 */
export const deleteJobCard = async (id: string): Promise<void> => {
  await api.delete(`/job-cards/${id}`);
};

// ═══════════════════════════════════════════════════════════════
// JOB CARD STATE MANAGEMENT (FSM)
// ═══════════════════════════════════════════════════════════════

/**
 * Get valid transitions for a job card
 * GET /api/job-cards/:id/transitions
 */
export const getValidTransitions = async (id: string): Promise<string[]> => {
  const response = await api.get(`/job-cards/${id}/transitions`);
  return response.data.transitions;
};

/**
 * Transition job card to a new state
 * POST /api/job-cards/:id/transition
 */
export const transitionJobCard = async (
  id: string, 
  data: TransitionJobCardRequest
): Promise<JobCard> => {
  const response = await api.post(`/job-cards/${id}/transition`, data);
  return response.data;
};

/**
 * Get job card state history
 * GET /api/job-cards/:id/history
 */
export const getJobCardHistory = async (id: string): Promise<JobCardStateHistory[]> => {
  const response = await api.get(`/job-cards/${id}/history`);
  return response.data.history;
};

/**
 * Generate customer approval link
 * POST /api/job-cards/:id/generate-approval-link
 */
export const generateApprovalLink = async (id: string): Promise<{ token: string; url: string; expires_at: string }> => {
  const response = await api.post(`/job-cards/${id}/generate-approval-link`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// PDI MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Get PDI checklist for a job card
 * GET /api/job-cards/:id/pdi/checklist
 */
export const getPDIChecklist = async (jobCardId: string): Promise<PDIChecklist> => {
  const response = await api.get(`/job-cards/${jobCardId}/pdi/checklist`);
  return response.data;
};

/**
 * Update a PDI checklist item
 * PUT /api/pdi/checklist/:id
 */
export const updatePDIItem = async (
  checklistId: string, 
  data: UpdatePDIItemRequest
): Promise<PDIChecklistItem> => {
  const response = await api.put(`/pdi/checklist/${checklistId}`, data);
  return response.data;
};

/**
 * Complete PDI with technician declaration
 * POST /api/job-cards/:id/pdi/complete
 */
export const completePDI = async (
  jobCardId: string, 
  data: CompletePDIRequest
): Promise<PDIChecklist> => {
  const response = await api.post(`/job-cards/${jobCardId}/pdi/complete`, data);
  return response.data;
};

/**
 * Upload PDI evidence
 * POST /api/job-cards/:id/pdi/evidence
 */
export const uploadPDIEvidence = async (
  jobCardId: string,
  checklistItemId: string,
  file: File
): Promise<PDIEvidence> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('checklist_item_id', checklistItemId);
  
  const response = await api.post(`/job-cards/${jobCardId}/pdi/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * List PDI evidence files
 * GET /api/job-cards/:id/pdi/evidence
 */
export const listPDIEvidence = async (jobCardId: string): Promise<PDIEvidence[]> => {
  const response = await api.get(`/job-cards/${jobCardId}/pdi/evidence`);
  return response.data.evidence;
};

// ═══════════════════════════════════════════════════════════════
// INVOICE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Create invoice for a job card
 * POST /api/job-cards/:id/invoice
 */
export const createInvoice = async (data: CreateInvoiceRequest): Promise<Invoice> => {
  const response = await api.post(`/job-cards/${data.job_card_id}/invoice`, data);
  return response.data;
};

/**
 * Get invoice details
 * GET /api/invoices/:id
 */
export const getInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.get(`/invoices/${id}`);
  return response.data;
};

/**
 * List invoices
 * GET /api/invoices
 */
export const listInvoices = async (filters?: {
  status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}): Promise<{ invoices: Invoice[]; total: number }> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  
  const response = await api.get(`/invoices?${params}`);
  return response.data;
};

/**
 * Generate invoice PDF
 * POST /api/invoices/:id/pdf
 */
export const generateInvoicePDF = async (id: string): Promise<Blob> => {
  const response = await api.post(`/invoices/${id}/pdf`, {}, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Finalize invoice
 * PUT /api/invoices/:id/finalize
 */
export const finalizeInvoice = async (id: string): Promise<Invoice> => {
  const response = await api.put(`/invoices/${id}/finalize`);
  return response.data;
};

/**
 * Send invoice to customer
 * POST /api/invoices/:id/send
 */
export const sendInvoice = async (id: string): Promise<void> => {
  await api.post(`/invoices/${id}/send`);
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD & ANALYTICS
// ═══════════════════════════════════════════════════════════════

/**
 * Get dashboard metrics
 * GET /api/dashboard/metrics
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const response = await api.get('/dashboard/metrics');
  return response.data;
};

/**
 * Get job card statistics
 * GET /api/job-cards/stats
 */
export const getJobCardStats = async (): Promise<JobCardStats> => {
  const response = await api.get('/job-cards/stats');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// EXPORT SERVICE OBJECT
// ═══════════════════════════════════════════════════════════════

export const jobCardService = {
  // CRUD
  createJobCard,
  getJobCard,
  listJobCards,
  updateJobCard,
  deleteJobCard,
  
  // FSM
  getValidTransitions,
  transitionJobCard,
  getJobCardHistory,
  generateApprovalLink,
  
  // PDI
  getPDIChecklist,
  updatePDIItem,
  completePDI,
  uploadPDIEvidence,
  listPDIEvidence,
  
  // Invoices
  createInvoice,
  getInvoice,
  listInvoices,
  generateInvoicePDF,
  finalizeInvoice,
  sendInvoice,
  
  // Dashboard
  getDashboardMetrics,
  getJobCardStats,
};

export default jobCardService;
