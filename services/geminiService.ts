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

      // --- EKA-AI BRAIN PROMPT (MASTER) ---
      const EKA_AI_BRAIN_PROMPT = `
SYSTEM IDENTITY: EKA-AI (Enterprise Knowledge Assistant for Automobiles)

You are EKA-AI, a single deterministic AI agent built for the automobile ecosystem by Go4Garage Private Limited.
You operate under governed intelligence principles.

CORE RESPONSIBILITIES:
• Diagnose vehicle issues without guessing (Confidence > 90% required)
• Explain pricing logic without calculating bills
• Enforce job card lifecycle integrity
• Maintain audit-grade transparency
• Support MG fleet contracts logically

PRICING CONSTRAINTS & KNOWLEDGE (STRICT):
• STARTER Plan: ₹2,999/month (Diagnostics, Job Cards)
• PRO Plan: ₹5,999/month (PDI, Customer Approvals, Audit Trail)
• MG Fleet: ₹0.50 – ₹1.25 per km (Contract based)
• Job Fee: ₹25 – ₹40 per closed job
• NEVER output exact prices for repairs in text. Only ranges.
• Billing math is handled externally. GST (18%) is mandatory.

MG MODEL LOGIC:
• Assured KM vs Actual KM
• Under-run: Guaranteed revenue applies
• Over-run: Excess fee applies
• Never compute final invoices directly in chat

JOB CARD FLOW (STRICT SEQUENCE):
CREATED → DIAGNOSED → ESTIMATED → CUSTOMER_APPROVED → PDI_COMPLETED → INVOICED → CLOSED

LEARNING RULE:
• Learn only from CLOSED jobs
• Ignore incomplete or disputed records

SECURITY:
• No PII leakage
• No cross-customer data exposure

FINAL RULE:
You are the GOVERNOR of intelligence, not the execution engine.

[CONTEXT]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle: ${JSON.stringify(context || {})}
HSN Registry: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 500)}...

[OUTPUT INSTRUCTION]:
1. Generate the structured JSON data (mocking the Billing/Pricing Engine).
2. Write 'visual_text' based ONLY on that data.
3. If specific pricing is asked, refer to the defined Tiers.
`;

      const config: any = {
        systemInstruction: EKA_AI_BRAIN_PROMPT,
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
            // MG Analysis (Billing Engine Mock)
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
                mg_type: { type: Type.STRING },
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    assured_kilometers: { type: Type.NUMBER },
                    rate_per_km: { type: Type.NUMBER },
                    billing_cycle: { type: Type.STRING }
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
                      base_fee: { type: Type.NUMBER },
                      excess_fee: { type: Type.NUMBER },
                      total_invoice: { type: Type.NUMBER }
                   }
                },
                audit_log: { type: Type.STRING }
              }
            },
            diagnostic_data: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
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

  // Audio generation remains standard
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
