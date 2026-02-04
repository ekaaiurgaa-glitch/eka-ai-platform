import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types/types";

export class GeminiService {

  // Routes request to your local Python backend (/api/chat)
  async sendMessage(
    history: { role: string; parts: { text: string }[] }[], 
    context?: VehicleContext, 
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      const response = await fetch('/api/chat', {
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
        throw new Error(`Server responded with ${response.status}`);
      }

      // The backend now guarantees the correct JSON format (MG Analysis, Visual Metrics, etc.)
      return await response.json();

    } catch (error: any) {
      console.error("EKA Connectivity Error:", error);
      return {
        response_content: { 
          visual_text: "CONNECTION FAILURE: Unable to reach EKA Brain. " + (error.message || ""), 
          audio_text: "Connection error." 
        },
        job_status_update: currentStatus,
        ui_triggers: { 
          theme_color: "#FF0000", 
          brand_identity: "OFFLINE", 
          show_orange_border: true 
        },
        visual_assets: { vehicle_display_query: "Error", part_display_query: "" }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) return null;
      const data = await response.json();

      if (data.audio_data) {
        const binaryString = atob(data.audio_data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      }
      return null;
    } catch (error) {
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
