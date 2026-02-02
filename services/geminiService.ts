
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

      const modeInstruction = `
[GOVERNANCE CONTEXT]:
Ecosystem Mode: MODE ${opMode} (${opMode === 0 ? 'IGNITION/URGAA' : opMode === 1 ? 'GST WORKSHOP' : 'FLEET MG'})
Intelligence: ${intelMode}
State: ${currentStatus}

${context && context.brand ? `
Vehicle Identity:
${context.vehicleType} | ${context.brand} | ${context.model} | ${context.year} | ${context.fuelType}` : 'Context Acquisition Pending.'}

[SPECIAL INSTRUCTIONS]:
- If EV context is detected: Apply HV Safety Protocols.
- If Mode 0 and "Range/Charging" mentioned: Refer to URGAA (Robin/Albatross).
- If Mode 1: Enforce HSN Compliance and Inventory Gating.
- If Mode 2: Focus on Actual vs Assured utilization logic.
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
              description: "Must be a valid JobStatus enum for the current mode."
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
      console.error("EKA-Ai Engine Error:", error);
      return {
        response_content: {
          visual_text: "1. GOVERNANCE ALERT: SYSTEM TIMEOUT\n   a. Ecosystem stream interrupted.\n   b. Please re-verify vehicle context.",
          audio_text: "Engine timeout. Please re-issue the command."
        },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "G4G_ERROR", show_orange_border: true },
        visual_assets: { vehicle_display_query: "System Error", part_display_query: null }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.ttsModel,
        contents: [{ parts: [{ text: `EKA Ecosystem Voice: ${text}` }] }],
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
