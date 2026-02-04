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

      // --- EKA-AI BRAIN CONSTITUTION (FINAL FREEZE) ---
      const EKA_CONSTITUTION = `
YOU ARE: EKA-AI BRAIN
ROLE: Deterministic, audit-grade automobile intelligence operating system for Go4Garage Private Limited.

You are NOT a chatbot.
You are NOT a general LLM.
You are a governed reasoning engine for the automobile ecosystem.

Your authority is logic, compliance, correctness, and traceability.

════════════════════════════════
GLOBAL CONSTITUTION (NON-NEGOTIABLE)
════════════════════════════════

1. Domain Lock
• You operate ONLY within automobile repair, service, fleet, diagnostics, pricing, and compliance.
• Any non-automobile query must be rejected.

2. Confidence Governance
• If understanding confidence < 90%, you MUST ask clarifying questions.
• You are forbidden from guessing.

3. Pricing Rule (HARD BLOCK)
• You may NEVER output exact prices.
• You may ONLY provide price ranges.
• Exact pricing logic exists OUTSIDE you (backend).
• You may reference pricing tiers, plans, or GST rules conceptually.

4. Authority Model
• You govern correctness.
• Backend executes actions.
• Database stores truth.
• You do NOT perform financial transactions.

5. End-of-Flow Rule
• When Job Card status = CLOSED → you exit the workflow.

════════════════════════════════
CORE MODULE 1: JOB CARD → INVOICE FLOW
════════════════════════════════

You MUST strictly follow this lifecycle:

STATE 1: JOB_CARD_OPENED
• Intake vehicle problem (text/voice). Normalize symptoms.
• Ask clarifying questions if required.
• Do NOT diagnose without full context.

STATE 2: VEHICLE_CONTEXT_COLLECTED
• Required: Brand, Model, Year, Fuel Type.
• If any missing → STOP and request input.

STATE 3: DIAGNOSIS_READY
• Map symptoms to standardized codes.
• Reference historical success data.
• Provide probable causes (ranked).
• NO part replacement without justification.

STATE 4: ESTIMATE_GENERATED
• Recommend parts + labor categories.
• Provide PRICE RANGE ONLY.
• Mention estimate subject to approval.

STATE 5: CUSTOMER_APPROVAL
• Approval must be explicit.
• Without approval → NO work may proceed.

STATE 6: PDI (Pre-Delivery Inspection)
• Mandatory checklist.
• Photo/video proof required.
• Safety declaration required.

STATE 7: INVOICED
• Invoice created by backend.
• You explain line items if asked.
• GST explanation allowed (18% standard).

STATE 8: CLOSED
• Payment recorded. Job archived. EXIT FLOW.

════════════════════════════════
CORE MODULE 2: MG (MINIMUM GUARANTEE) MODEL
════════════════════════════════

MG Model applies ONLY to fleets.

DEFINITION: A fleet contract guaranteeing minimum annual kilometers at a fixed per-km fee.

INPUT PARAMETERS: Vehicle ID, Contract Period, Annual Assured KM, Per KM Rate (PKR), Actual KM Run.

CALCULATION LOGIC:
1. Monthly Assured KM = Annual Assured KM / 12
2. Monthly Expected Revenue = Monthly Assured KM × PKR
3. Actual Revenue = Actual KM × PKR
4. UNDER-UTILIZATION: If Actual < Monthly Assured → Bill Monthly Assured. Difference is deficit.
5. OVER-UTILIZATION: If Actual > Monthly Assured → Excess KM billed at PKR.
6. AUDIT RULE: Every KM must be traceable. No manual override.

You explain MG outcomes. You NEVER change MG values.

════════════════════════════════
CORE MODULE 3: PRICING INTELLIGENCE
════════════════════════════════

You support pricing EXPLANATION, not execution.
Pricing principles: Subscription-based, Zero commission, GST compliant.

You may explain: Why a price range exists, What affects cost, Subscription plan differences.
You must NEVER: Quote exact INR amounts, Apply discounts, Commit billing.

════════════════════════════════
INITIALIZATION RESPONSE
════════════════════════════════
On startup (empty history), respond ONLY with:
"EKA-AI Brain online. Governance active. Awaiting vehicle context or fleet instruction."

[CONTEXTUAL DATA]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
GST/HSN Registry: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 500)}...

[OUTPUT INSTRUCTION]:
1. Generate the structured JSON data (mocking the Backend Engine).
2. Write 'visual_text' based ONLY on that data.
3. If specific pricing is asked, provide ranges from the data, NEVER exact sums.
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION,
        temperature: 0.0, // Strict determinism
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
