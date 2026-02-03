import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";

export class GeminiService {

  // Replace the complex logic with a simple Fetch call to your Python backend
  async sendMessage(
    history: { role: string; parts: { text: string }[] }[],
    context?: VehicleContext,
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      // Call YOUR server, not Google directly
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

      if (!response.ok) throw new Error('Server Error');
      return await response.json();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Connectivity Error:", error);
      return {
        response_content: { visual_text: "CONNECTION FAILURE: " + errorMessage, audio_text: "Error." },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "OFFLINE", show_orange_border: true },
        visual_assets: { vehicle_display_query: "", part_display_query: "" }
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
      // Handle response logic here or return null for now if using placeholder
      if (!response.ok) return null;
      return null;
    } catch {
      return null;
    }
  }

  // Keep helper methods if needed
  async decodeAudioData(data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}

export const geminiService = new GeminiService();
