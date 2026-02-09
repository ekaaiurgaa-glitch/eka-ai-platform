/**
 * MG Fleet Service - API Integration Layer
 * 
 * Provides typed methods for MG Fleet Management API.
 */

import api from '../lib/api';
import { MGContract, MGVehicleLog, MGAnalysis } from '../types/api.types';

/**
 * List MG contracts
 * GET /api/mg/contracts
 */
export const listContracts = async (): Promise<MGContract[]> => {
  const response = await api.get('/mg/contracts');
  return response.data.contracts;
};

/**
 * Create MG contract
 * POST /api/mg/contracts
 */
export const createContract = async (data: {
  customer_name: string;
  customer_phone: string;
  vehicle_registration: string;
  vehicle_model: string;
  assured_kilometers: number;
  rate_per_km: number;
  billing_cycle_months: number;
}): Promise<MGContract> => {
  const response = await api.post('/mg/contracts', data);
  return response.data;
};

/**
 * Calculate MG billing
 * POST /api/mg/calculate
 */
export const calculateBilling = async (data: {
  contract_id: string;
  opening_km: number;
  closing_km: number;
  month: number;
  year: number;
}): Promise<{
  calculation: MGAnalysis;
  invoice_split: {
    billed_to_mg_pool: number;
    billed_to_customer: number;
    unused_buffer_value: number;
  };
}> => {
  const response = await api.post('/mg/calculate', data);
  return response.data;
};

/**
 * Validate odometer reading
 * POST /api/mg/validate-odometer
 */
export const validateOdometer = async (data: {
  contract_id: string;
  odometer_reading: number;
  expected_range?: { min: number; max: number };
}): Promise<{
  valid: boolean;
  within_expected_range: boolean;
  discrepancy_km?: number;
}> => {
  const response = await api.post('/mg/validate-odometer', data);
  return response.data;
};

/**
 * Generate fleet report
 * POST /api/mg/report
 */
export const generateReport = async (params: {
  contract_ids?: string[];
  month: number;
  year: number;
}): Promise<{
  report_url: string;
  summary: {
    total_contracts: number;
    total_km_consumed: number;
    total_billed: number;
  };
}> => {
  const response = await api.post('/mg/report', params);
  return response.data;
};

/**
 * Create vehicle log entry
 * POST /api/mg/vehicle-logs
 */
export const createVehicleLog = async (data: {
  contract_id: string;
  opening_km: number;
  closing_km: number;
  month: number;
  year: number;
}): Promise<MGVehicleLog> => {
  const response = await api.post('/mg/vehicle-logs', data);
  return response.data;
};

/**
 * List vehicle logs for a contract
 * GET /api/mg/vehicle-logs
 */
export const listVehicleLogs = async (contractId: string): Promise<MGVehicleLog[]> => {
  const response = await api.get(`/mg/vehicle-logs?contract_id=${contractId}`);
  return response.data.logs;
};

export const mgFleetService = {
  listContracts,
  createContract,
  calculateBilling,
  validateOdometer,
  generateReport,
  createVehicleLog,
  listVehicleLogs,
};

export default mgFleetService;
