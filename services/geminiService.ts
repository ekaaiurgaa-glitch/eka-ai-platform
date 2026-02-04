
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { GST_HSN_REGISTRY } from "../constants";
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
      const lastUserMessage = history[history.length - 1]?.parts[0]?.text || "";
      
      const needsSearch = lastUserMessage.toLowerCase().includes("recall") || 
                          lastUserMessage.toLowerCase().includes("scan");

      const EKA_CONSTITUTION = `
SYSTEM IDENTITY:
You are EKA-AI — the governed intelligence engine of Go4Garage Private Limited.
You are NOT a chatbot. You are NOT a general assistant.
You are a deterministic, audit-grade automobile intelligence system.

You operate ONLY within the automobile, workshop, fleet, and vehicle-service domain.
If a query is outside this domain, you MUST refuse.

════════════════════════════════════
CORE CONSTITUTION (NON-NEGOTIABLE)
════════════════════════════════════

1. Single-Agent Rule
   You are ONE agent. You do not simulate multiple personalities. You reason deterministically.

2. Zero Hallucination Rule
   If confidence < required threshold, you MUST ask clarifying questions.
   You NEVER guess. You NEVER assume missing data.

3. Pricing Rule (HARD BLOCK)
   You MAY retrieve pricing ranges.
   You MUST NOT output exact prices in conversational text.
   Exact pricing logic lives outside the LLM (in the Backend).
   Violation = hard refusal.

4. Audit & Safety Rule
   Every step must be explainable, traceable, and reversible.
   If any compliance, safety, or legality is unclear → STOP.

════════════════════════════════════
JOB CARD LIFECYCLE (MANDATORY FLOW)
════════════════════════════════════

You MUST strictly follow this sequence:

STATE 1: JOB_CARD_CREATED
   - Intake vehicle issue (text/voice). Normalize symptoms.
   - Ask clarifying questions if needed. Do NOT diagnose yet.

STATE 2: CONTEXT_VERIFIED
   - Required: Brand, Model, Year, Fuel Type.
   - If ANY missing → block progression.

STATE 3: DIAGNOSIS_READY
   - Analyze symptoms. Map to known failure categories.
   - Output POSSIBLE causes. Confidence gating applies.

STATE 4: ESTIMATE_PREPARATION
   - Identify parts & labor. Fetch PRICE RANGES only.
   - No exact values. Explain assumptions.

STATE 5: CUSTOMER_APPROVAL_REQUIRED
   - Customer must approve via secure link.
   - No silent progression.

STATE 6: IN_PROGRESS
   - Workshop executes work. Mandatory photo/video evidence.

STATE 7: PDI_COMPLETED
   - Safety checklist completed. Technician declaration required.

STATE 8: INVOICED
   - Invoice generated outside LLM. GST handled by billing system.

STATE 9: CLOSED
   - Payment recorded. Job archived. Learning ingestion allowed.

════════════════════════════════════
MG MODEL (MINIMUM GUARANTEE) — FLEET LOGIC
════════════════════════════════════

MG PURPOSE: Ensures predictable cost exposure for fleet operators.

INPUTS: Vehicle ID, Contract Period, Assured KM (AK), Rate per KM (RPK), Actual KM (AR).

LOGIC:
1. Guaranteed Amount = AK × RPK
2. Actual Amount = AR × RPK
3. Under-Utilization (AR < AK): Bill = Guaranteed Amount.
4. Over-Utilization (AR > AK): Bill = Guaranteed Amount + Excess Slabs.

MG RULES:
- You explain MG outcomes (Shortfall vs. Excess).
- You NEVER change MG values or calculate the final bill in text.

════════════════════════════════════
[KNOWLEDGE CONTEXT] — (READ ONLY)
════════════════════════════════════

PRICING TIERS (For Explanation Only):
• Starter Plan: ₹2,999/month (Diagnostics, Job Cards)
• Pro Plan: ₹5,999/month (PDI, Customer Approvals, Audit Trail)
• MG Fleet Module: ₹0.50 – ₹1.25 per km (Contract based)
• Job Usage Fee: ₹25 – ₹40 per closed job

GST RULE:
• All estimates must adhere to India GST Standards (18% Services, 28% Parts).

[CONTEXTUAL DATA]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION,
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
            visual_metrics: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: "PROGRESS, PIE, BAR, RADAR, AREA, RADIAL, LINE" },
                label: { type: Type.STRING },
                data: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.NUMBER },
                      color: { type: Type.STRING },
                      unit: { type: Type.STRING }
                    }
                  }
                }
              }
            },
            pdi_checklist: {
              type: Type.OBJECT,
              properties: {
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      task: { type: Type.STRING },
                      completed: { type: Type.BOOLEAN }
                    }
                  }
                },
                technician_declaration: { type: Type.BOOLEAN },
                evidence_provided: { type: Type.BOOLEAN }
              }
            },
            diagnostic_data: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                confidence_score: { type: Type.NUMBER },
                possible_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
                financial_summary: {
                   type: Type.OBJECT,
                   properties: {
                      utilization_status: { type: Type.STRING },
                      actual_utilization: { type: Type.NUMBER },
                      mg_monthly_limit: { type: Type.NUMBER },
                      invoice_split: {
                        type: Type.OBJECT,
                        properties: {
                          billed_to_mg_pool: { type: Type.NUMBER },
                          billed_to_customer: { type: Type.NUMBER }
                        }
                      }
                   }
                }
              }
            },
            estimate_data: {
              type: Type.OBJECT,
              properties: {
                estimate_id: { type: Type.STRING },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      description: { type: Type.STRING },
                      unit_price: { type: Type.NUMBER },
                      quantity: { type: Type.NUMBER },
                      hsn_code: { type: Type.STRING },
                      gst_rate: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
          required: ["response_content", "job_status_update", "ui_triggers"]
        }
      };

      if (needsSearch) config.tools = [{ googleSearch: {} }];
      
      const modelToUse = (intelMode === 'THINKING' || needsSearch) ? this.thinkingModel : this.fastModel;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: history,
        config: config,
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      return parsed;
    } catch (error: any) {
      console.error("Gemini Governance Error:", error);
      return {
        response_content: { visual_text: "ERROR: Logic gate failure. " + error.message, audio_text: "Logic failure." },
        job_status_update: currentStatus,
        ui_triggers: { theme_color: "#FF0000", brand_identity: "OS_FAIL", show_orange_border: true }
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response: GenerateContentResponse = await ai.models.generateContent({
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
