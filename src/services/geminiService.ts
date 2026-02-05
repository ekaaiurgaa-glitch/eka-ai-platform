import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";

export class GeminiService {
  private apiUrl = '/api/chat'; 

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
          history: history,
          context: context,
          status: currentStatus,
          intelligence_mode: intelMode,
          operating_mode: opMode
        })
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }
      
      return await response.json();

    } catch (error: any) {
      console.error("Backend Error:", error);
      return {
        response_content: { 
          visual_text: "⚠️ EKA-AI Server Unreachable. Please check internet or backend logs.", 
          audio_text: "Connection error." 
        },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "OFFLINE", show_orange_border: true }
      };
    }
  }
}

export const geminiService = new GeminiService();
