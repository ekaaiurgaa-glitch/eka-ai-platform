
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";
import { VehicleContext, JobStatus } from "../types";

export class GeminiService {
  private textModel: string = 'gemini-3-pro-preview';
  private ttsModel: string = 'gemini-2.5-flash-preview-tts';

  async sendMessage(history: { role: string; parts: { text: string }[] }[], context?: VehicleContext, currentStatus: JobStatus = 'CREATED') {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const lastUserMessage = history[history.length - 1].parts[0].text.toLowerCase();
      const isPartSearch = lastUserMessage.includes('part') || lastUserMessage.includes('source') || lastUserMessage.includes('oem');
      const isMgQuery = lastUserMessage.includes('mg ') || lastUserMessage.includes('fleet') || lastUserMessage.includes('contract');

      const contextPrompt = `
[CURRENT SYSTEM STATE]:
Current Status: ${currentStatus}
${context && context.brand ? `
Locked Vehicle Context:
Type: ${context.vehicleType}
Brand: ${context.brand}
Model: ${context.model}
Year: ${context.year}
Fuel: ${context.fuelType}` : 'Vehicle context not yet fully locked.'}

[INTENT SIGNAL]: ${isMgQuery ? 'FLEET_MG_CALCULATION_MODE' : (isPartSearch ? 'IDENTIFY_AND_SOURCE_PARTS_MODE' : 'DIAGNOSTIC_GOVERNANCE_MODE')}
${isMgQuery ? 'Focus on MG Model parameters (AKY, PKR, actual KM) and penalty/bonus logic.' : 'Focus on symptomatic analysis and state transition governance.'}`;

      const response = await ai.models.generateContent({
        model: this.textModel,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION + contextPrompt,
          temperature: 0.1,
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
                description: "Must be one of: CREATED, CONFIDENCE_CONFIRMED, VEHICLE_CONTEXT_COLLECTED, DIAGNOSIS_READY, ESTIMATE_READY, CUSTOMER_APPROVED, IN_PROGRESS, PDI_COMPLETED, INVOICED, CLOSED"
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
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingUrls: { title: string; uri: string }[] = [];
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            groundingUrls.push({ 
              title: chunk.web.title || 'Data Source', 
              uri: chunk.web.uri 
            });
          }
        });
      }

      const result = JSON.parse(response.text || '{}');
      return {
        ...result,
        grounding_urls: groundingUrls
      };
    } catch (error) {
      console.error("EKA-Ai Engine Error:", error);
      return {
        response_content: {
          visual_text: "1. GOVERNANCE BREACH: SYSTEM TIMEOUT\n   a. The EKA-Ai engine encountered an interruption during audit.\n   b. Please re-issue your request with full vehicle parameters.",
          audio_text: "System timeout. Please re issue your request."
        },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "G4G_ERROR", show_orange_border: true },
        visual_assets: { vehicle_display_query: "Vehicle Error", part_display_query: null },
        grounding_urls: []
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.ttsModel,
        contents: [{ parts: [{ text: `Speak in a professional G4G tone: ${text}` }] }],
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
