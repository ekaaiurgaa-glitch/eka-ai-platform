
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";
import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode, GroundingLink } from "../types";

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
Active Operating Mode: ${opMode} (0:Ignition, 1:Workshop, 2:Fleet)
Current Logical State: ${currentStatus}
Vehicle Context: ${context && context.brand ? `${context.year} ${context.brand} ${context.model} (${context.fuelType})` : 'Awaiting Identification'}

[ESTIMATE PROTOCOL (MODE 1)]:
1. MANDATORY: Every line item MUST have a valid HSN Code.
   - PARTS: HSN MUST start with '8708'. No exceptions.
   - LABOR/SERVICE: HSN MUST start with '9987'. No exceptions.
2. GST COMPLIANCE: 
   - GST RATE MUST be exactly 18% (Standard Services) or 28% (Luxury Parts/Accessories).
   - tax_type must be 'CGST_SGST' (Local) or 'IGST' (Interstate). Default to 'CGST_SGST'.
3. STATUS ENFORCEMENT: 
   - Transition to 'APPROVAL_GATE' is FORBIDDEN in this turn.
   - You must stay in 'ESTIMATE_GOVERNANCE' until the user provides the [AUTHORIZE_GATE] signal.
   - Any estimate generated must be presented for review in this state.

[STATE MACHINE RULES]:
1. IF state is 'AUTH_INTAKE': You are LOCKED. Your only goal is to receive a valid Vehicle Reg No.
2. IF [SYSTEM_NOTE: VALID_FORMAT] is present, transition to 'SYMPTOM_RECORDING'.
3. ON TRANSITION TO 'SYMPTOM_RECORDING' in Mode 1:
   - Perform a virtual lookup for vehicle history based on Reg No.
   - If Reg No is "MH12AB1234" or "KA01MA1111", return a populated 'service_history' array.
   - Otherwise, return an empty 'service_history' array.
   - Set visual_assets.vehicle_display_query to 'DIGITAL_JOB_CARD'.
4. IF user describes symptoms and requests estimate, transition to 'ESTIMATE_GOVERNANCE'.
5. RESPOND ONLY in valid JSON. No Markdown.
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION + modeInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
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
            job_status_update: { type: Type.STRING },
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
                part_display_query: { type: Type.STRING }
              },
              required: ["vehicle_display_query", "part_display_query"]
            },
            service_history: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  service_type: { type: Type.STRING },
                  odometer: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["date", "service_type", "odometer", "notes"]
              }
            },
            estimate_data: {
              type: Type.OBJECT,
              properties: {
                estimate_id: { type: Type.STRING },
                tax_type: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      description: { type: Type.STRING },
                      hsn_code: { type: Type.STRING },
                      unit_price: { type: Type.NUMBER },
                      quantity: { type: Type.NUMBER },
                      gst_rate: { type: Type.NUMBER },
                      type: { type: Type.STRING }
                    },
                    required: ["id", "description", "hsn_code", "unit_price", "quantity", "gst_rate", "type"]
                  }
                },
                currency: { type: Type.STRING }
              },
              required: ["estimate_id", "items", "currency", "tax_type"]
            }
          },
          required: ["response_content", "job_status_update", "ui_triggers", "visual_assets"]
        }
      };

      if (intelMode === 'THINKING') {
        config.maxOutputTokens = 40000;
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
    } catch (error: any) {
      console.error("EKA Central OS Fatal Error:", error);
      return {
        response_content: { 
          visual_text: "CRITICAL: Logic gate failure. Error reported: " + (error.message || "Unknown XHR/RPC Failure"), 
          audio_text: "Logic gate failure." 
        },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "OS_FAIL", show_orange_border: true },
        visual_assets: { vehicle_display_query: "Error", part_display_query: "" }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: this.ttsModel,
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) return this.decodeBase64(base64Audio);
      return null;
    } catch (error) { return null; }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
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
