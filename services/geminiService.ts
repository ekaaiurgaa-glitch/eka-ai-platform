// src/services/geminiService.ts

import { GoogleGenAI, Modality, Type } from "@google/genai";
import { GST_HSN_REGISTRY } from "../constants"; // EKA_CONSTITUTION is now embedded below
import { VehicleContext, JobStatus, IntelligenceMode, OperatingMode } from "../types";

export class GeminiService {
  private fastModel: string = 'gemini-2.0-flash';
  private thinkingModel: string = 'gemini-2.0-flash-thinking-exp-1219';
  private ttsModel: string = 'gemini-2.0-flash-exp';

  async sendMessage(
    history: { role: string; parts: { text: string }[] }[], 
    context?: VehicleContext, 
    currentStatus: JobStatus = 'CREATED',
    intelMode: IntelligenceMode = 'FAST',
    opMode: OperatingMode = 0
  ) {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // --- THE CORE SYSTEM IDENTITY (Strictly from User's Prompt) ---
      const EKA_CORE_LOGIC = `
SYSTEM IDENTITY
You are EKA-AI, a single, governed, deterministic artificial intelligence agent built exclusively for the automobile ecosystem by Go4Garage Private Limited.

You are NOT a chatbot.
You are NOT a marketplace.
You are NOT a recommender guessing engine.

You are an audit-grade intelligence governor.

-------------------------------------
SECTION A: MG (MINIMUM GUARANTEE) MODEL
-------------------------------------
A1. DEFINITIONS: Assured_Kilometers (AK), Rate_Per_KM (RPK).
A2. CORE MATH: 
    Monthly_Assured_KM = Assured_Kilometers / Contract_Months
    Monthly_Assured_Revenue = Monthly_Assured_KM * Rate_Per_KM
A3. UNDER-UTILIZATION (Actual < Assured):
    Shortfall_KM = Monthly_Assured_KM - Actual
    Revenue_Payable = Monthly_Assured_Revenue (Shortfall absorbed by fleet)
A4. OVER-UTILIZATION (Actual > Assured):
    Excess_KM = Actual - Monthly_Assured_KM
    Total_Revenue = Monthly_Assured_Revenue + (Excess_KM * Excess_Rate)

-------------------------------------
SECTION B: JOB CARD GOVERNANCE
-------------------------------------
B2. ROOT CAUSE: If confidence < 90%, ASK CLARIFYING QUESTIONS. Do NOT guess.
B4. APPROVAL GATE: Job cannot proceed without Customer Approval.
B5. PDI GATE: Job cannot be COMPLETED without PDI (Safety, Proof).
B7. INVOICING: Only triggers if Job = COMPLETED and PDI = Verified.

-------------------------------------
CONTEXTUAL DATA
-------------------------------------
Current Operating Mode: ${opMode}
Current Job Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
GST/HSN Database: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 1000)}...

[OUTPUT INSTRUCTION]:
Respond ONLY in the structured JSON format defined in the schema. 
For MG queries, fill the 'mg_analysis' block strictly.
For Diagnostics, fill 'diagnostic_data'.
`;

      const config: any = {
        systemInstruction: EKA_CORE_LOGIC,
        temperature: 0.1, // Strict determinism
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
            // Updated MG Schema to match Section A logic
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
                mg_type: { type: Type.STRING },
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    assured_kilometers: { type: Type.NUMBER },
                    contract_months: { type: Type.NUMBER },
                    monthly_assured_km: { type: Type.NUMBER },
                    rate_per_km: { type: Type.NUMBER },
                    monthly_assured_revenue: { type: Type.NUMBER }
                  }
                },
                cycle_data: {
                   type: Type.OBJECT,
                   properties: {
                      actual_km_run: { type: Type.NUMBER },
                      shortfall_km: { type: Type.NUMBER },
                      excess_km: { type: Type.NUMBER }
                   }
                },
                financials: {
                   type: Type.OBJECT,
                   properties: {
                      revenue_payable: { type: Type.NUMBER },
                      excess_revenue: { type: Type.NUMBER },
                      total_revenue: { type: Type.NUMBER }
                   }
                },
                fleet_intelligence: {
                   type: Type.OBJECT,
                   properties: {
                      utilization_ratio: { type: Type.NUMBER },
                      revenue_stability_index: { type: Type.NUMBER },
                      asset_efficiency_score: { type: Type.NUMBER },
                      contract_health: { type: Type.STRING }
                   }
                },
                audit_log: { type: Type.STRING }
              }
            },
            // Diagnostic Data for Section B2
            diagnostic_data: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                root_cause_confidence: { type: Type.NUMBER }, // < 90% logic
                possible_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                systems_affected: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            visual_metrics: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                label: { type: Type.STRING },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      color: { type: Type.STRING }
                    },
                    required: ["name", "value"]
                  }
                }
              }
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
      console.error("EKA Governor Error:", error);
      return {
        response_content: { visual_text: "GOVERNANCE FAILURE: " + error.message, audio_text: "System error." },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "ERROR", show_orange_border: true },
        visual_assets: { vehicle_display_query: "Error", part_display_query: "" }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
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
