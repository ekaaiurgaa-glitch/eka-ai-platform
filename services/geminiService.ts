import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";

/**
 * GeminiService - Backend Proxy Implementation
 * 
 * This service proxies all AI requests through the Python backend which contains:
 * - Master Constitution for governed AI behavior
 * - Supabase integration for vehicle lookup and audit logging
 * - Rate limiting and security controls
 * - File upload handling for PDI evidence
 */
export class GeminiService {
  private apiUrl = '/api/chat';
  private speakUrl = '/api/speak';
  private uploadUrl = '/api/upload-pdi';

  async sendMessage(
    history: { role: string; parts: { text: string }[] }[], 
    context?: VehicleContext, 
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history,
          context,
          status: currentStatus,
          intelligence_mode: intelMode,
          operating_mode: opMode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server Error: ${response.status}`);
      }

      return await response.json();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("EKA Backend Error:", errorMessage);
      return {
        response_content: { 
          visual_text: "⚠️ Governance Server Unreachable. Operating in Offline Mode. Please check connection.", 
          audio_text: "Connection error." 
        },
        job_status_update: currentStatus,
        ui_triggers: { 
          theme_color: "#FF0000", 
          brand_identity: "OFFLINE", 
          show_orange_border: true 
        }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(this.speakUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) return null;
      const data = await response.json();
      
      if (data.audio_data) {
        return Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0));
      }
      return null;
    } catch (error) {
      console.error("TTS Error:", error);
      return null;
    }
  }

  async uploadPDIEvidence(file: File, jobCardId: string, checklistItem: string): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('job_card_id', jobCardId);
      formData.append('checklist_item', checklistItem);

      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.file_url;
    } catch (error) {
      console.error("Upload Error:", error);
      return null;
    }
  }

  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000, numChannels: number = 1): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

export const geminiService = new GeminiService();
