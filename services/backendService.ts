
import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";
import { EKA_CONSTITUTION, GST_HSN_REGISTRY } from "../constants";

// Backend API URL - can be configured via environment variable
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export class BackendService {
  async sendMessage(
    history: { role: string; parts: { text: string }[] }[], 
    context?: VehicleContext, 
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          history,
          context,
          currentStatus,
          intelMode,
          opMode,
          ekaConstitution: EKA_CONSTITUTION,
          gstHsnRegistry: GST_HSN_REGISTRY
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Backend error: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("Backend API Error:", error);
      return {
        response_content: { 
          visual_text: "CRITICAL: Backend connection failure. " + (error.message || "Network Error"), 
          audio_text: "Backend failure." 
        },
        job_status_update: currentStatus,
        ui_triggers: { 
          theme_color: "#FF0000", 
          brand_identity: "BACKEND_FAIL", 
          show_orange_border: true 
        },
        visual_assets: { 
          vehicle_display_query: "Error", 
          part_display_query: "" 
        }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error(`TTS error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.audio_data) {
        // Decode base64 audio data
        return this.decodeBase64(data.audio_data);
      }
      
      return null;
    } catch (error) {
      console.error("TTS Error:", error);
      return null;
    }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Decodes raw PCM audio data into an AudioBuffer
   * Note: Requires AudioContext to be passed in as it must be managed
   * at the application level for proper audio playback lifecycle
   */
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

export const backendService = new BackendService();
