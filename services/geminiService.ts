
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";
import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";

export class GeminiService {
  private fastModel: string = 'gemini-3-flash-preview';
  private thinkingModel: string = 'gemini-3-pro-preview';
  private ttsModel: string = 'gemini-2.5-flash-preview-tts';

  async sendMessage(
    history: { role: string; parts: { text: string }[] }[], 
    context?: VehicleContext, 
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const isEV = context?.fuelType === 'Electric' || context?.fuelType === 'Hybrid';

      const modeInstruction = `
[GOVERNANCE SIGNAL]:
Ecosystem Domain: MODE ${opMode} (${opMode === 0 ? 'IGNITION/URGAA' : opMode === 1 ? 'GST WORKSHOP' : 'FLEET MG'})
Current State: ${currentStatus}
Intel Mode: ${intelMode}

[VEHICLE IDENTITY]:
${context && context.brand ? `${context.vehicleType} | ${context.brand} | ${context.model} | ${context.fuelType}` : 'Identification Pending'}

[CRITICAL PROTOCOLS]:
${isEV ? '- MANDATORY: Preface all technical advice with the High Voltage (HV) PPE warning.' : ''}
${opMode === 1 ? '- MANDATORY ESTIMATE RULE: Every line item in an estimate must follow this format: "Item Name | Price Range | HSN: [Code] | GST: [Rate]% ([Tax Type])". Use 8708 for Parts and 9987 for Labor/Service.' : ''}
- MODE 0: If range anxiety mentioned, prioritize URGAA network search (Robin/Albatross).
- MODE 1: Apply Dead Inventory and HSN compliance logic.
- MODE 2: Apply SLA breach and utilization shortfall logic.
- DATA TAGGING: Tag Energy/Outlook data as "Simulated".
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION + modeInstruction,
        temperature: intelMode === 'THINKING' ? 0.7 : 0.1,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response_content: {
              type: Type.OBJECT,
              properties: {
                visual_text: { type: Type.STRING },
                audio_text: { type: Type.STRING }
              },
              required: ["visual_text", "audio_text"]
            },
            job_status_update: { 
              type: Type.STRING,
              description: "Must be a valid JobStatus enum for the active mode."
            },
            ui_triggers: {
              type: Type.OBJECT,
              properties: {
                theme_color: { type: Type.STRING },
                brand_identity: { type: Type.STRING },
                show_orange_border: { type: Type.BOOLEAN }
              },
              required: ["theme_color", "brand_identity", "show_orange_border"]
            },
            visual_assets: {
              type: Type.OBJECT,
              properties: {
                vehicle_display_query: { type: Type.STRING },
                part_display_query: { type: Type.STRING, nullable: true }
              },
              required: ["vehicle_display_query", "part_display_query"]
            }
          },
          required: ["response_content", "job_status_update", "ui_triggers", "visual_assets"]
        }
      };

      if (intelMode === 'THINKING') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const response = await ai.models.generateContent({
        model: intelMode === 'THINKING' ? this.thinkingModel : this.fastModel,
        contents: history,
        config: config,
      });

      const rawText = response.text || '{}';
      const result = JSON.parse(rawText);
      
      return result;
    } catch (error) {
      console.error("EKA Central OS Error:", error);
      return {
        response_content: {
          visual_text: "1. GOVERNANCE ALERT: SYSTEM TIMEOUT\n   a. Central OS stream interrupted.\n   b. Please re-verify identity context.",
          audio_text: "System timeout. Please re-issue."
        },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "G4G_ERROR", show_orange_border: true },
        visual_assets: { vehicle_display_query: "System Timeout", part_display_query: null }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.ttsModel,
        contents: [{ parts: [{ text: `EKA OS Voice: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) return this.decodeBase64(base64Audio);
      return null;
    } catch (error) {
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

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> {
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
