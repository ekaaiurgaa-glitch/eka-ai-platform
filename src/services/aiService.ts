/**
 * AI Service - API Integration Layer
 * 
 * Provides typed methods for interacting with the AI/Governance API.
 */

import api from '../lib/api';
import { ChatRequest, ChatResponse, ChatMessage } from '../types/api.types';

/**
 * Send chat message to AI
 * POST /api/chat
 */
export const sendChatMessage = async (data: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post('/chat', data);
  return response.data;
};

/**
 * Run AI governance check
 * POST /api/ai/governance-check
 */
export const runGovernanceCheck = async (query: string): Promise<{
  passed: boolean;
  domain_gate: boolean;
  confidence_gate: boolean;
  context_gate: boolean;
  permission_gate: boolean;
  confidence_score: number;
}> => {
  const response = await api.post('/ai/governance-check', { query });
  return response.data;
};

/**
 * Validate query domain only
 * POST /api/ai/validate-query
 */
export const validateQueryDomain = async (query: string): Promise<{
  valid: boolean;
  is_automobile_related: boolean;
  detected_categories: string[];
}> => {
  const response = await api.post('/ai/validate-query', { query });
  return response.data;
};

/**
 * Get governance audit logs
 * GET /api/ai/governance/logs
 */
export const getGovernanceLogs = async (params?: {
  limit?: number;
  offset?: number;
}): Promise<{
  logs: Array<{
    id: string;
    query: string;
    passed: boolean;
    confidence_score: number;
    timestamp: string;
  }>;
  total: number;
}> => {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  
  const response = await api.get(`/ai/governance/logs?${searchParams}`);
  return response.data;
};

/**
 * Text-to-speech
 * POST /api/speak
 */
export const textToSpeech = async (text: string): Promise<Blob> => {
  const response = await api.post('/speak', { text }, {
    responseType: 'blob'
  });
  return response.data;
};

export const aiService = {
  sendChatMessage,
  runGovernanceCheck,
  validateQueryDomain,
  getGovernanceLogs,
  textToSpeech,
};

export default aiService;
