
// Always use GoogleGenAI from @google/genai as per guidelines
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { EKA_CONSTITUTION, GST_HSN_REGISTRY } from "../constants";
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
      // Always initialize with apiKey in a named parameter
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const fullSystemPrompt = `
${EKA_CONSTITUTION}

[OPERATING PROTOCOLS]:
Active Operating Mode: ${opMode}
Current Logic State: ${currentStatus}
Context Identity: ${context && context.brand ? `${context.year} ${context.brand} ${context.model}` : 'Awaiting Context'}

[SECTION A: MG FLEET INTELLIGENCE - RISK-WEIGHTED MODEL]:

[A1: MG CALCULATION LOGIC (Risk-Weighted)]:
When calculating MG Value (Mode 2), strictly apply this formula:
1. RISK WEIGHTS:
   - Low Risk (Filters, Oil, Fluids): Weight = 1.0
   - Medium Risk (Brakes, Wipers): Weight = 1.3
   - High Risk (Clutch, Suspension, Cooling): Weight = 1.7
2. FORMULA: 
   MG_Amount = Σ (Component_Cost × Risk_Weight) + Safety_Buffer(15%)
   *Example: (Brakes ₹2000 * 1.3 = ₹2600) + (Oil ₹1000 * 1.0 = ₹1000) = ₹3600 + 15% Buffer = ₹4140*
3. MG STATE MACHINE:
   - Contract Created: "MG_CREATED"
   - < 70% Utilized: "MG_ACTIVE"
   - 70-85% Utilized: "MG_CONSUMING"
   - 85-99% Utilized: "MG_THRESHOLD_ALERT"
   - >= 100% Utilized: "MG_EXHAUSTED" (Requires manual approval)
   - Contract Closed: "MG_CLOSED"

[A2: FINANCIAL SUMMARY RULES]:
- Track mg_monthly_limit, actual_utilization, and utilization_status (SAFE/WARNING/BREACHED).
- Invoice Split: Separate billed_to_mg_pool vs billed_to_customer vs unused_buffer_value.
- Enforce Under-utilization: IF Actual < Assured, Revenue = Monthly_Assured_Revenue.
- Enforce Over-utilization: IF Actual > Assured, Revenue = Assured + (Excess * Excess_Rate).
- MUST calculate: Utilization Ratio, Revenue Stability Index, Asset Efficiency, Contract Health.

[A3: AUDIT TRAIL REQUIREMENTS]:
- Map 'risk_weights_used' showing each component and its applied weight.
- Show the exact 'Safety Buffer' percentage added in calculations.
- Document 'formula_used' with the full calculation breakdown.

[SECTION B: JOB CARD GATES - CONFIDENCE GATE MODEL]:

[B1: CONFIDENCE GATE]:
Before generating any diagnosis or estimate (Mode 1):
1. CONFIDENCE CHECK: Evaluate the user's problem description.
   - If ambiguity exists or details are vague -> CONFIDENCE < 90%.
   - ACTION: Refuse to diagnose. Ask clarifying questions. Set missing_info array.
   - ONLY if Confidence >= 90% -> Proceed to Estimate.
2. confidence_score MUST be >= 90 for root cause determination.

[B2: PDI GATE (Mandatory)]:
- You CANNOT set status to 'COMPLETION', 'INVOICING', or 'CLOSED' unless PDI_Verified is explicitly TRUE in context.
- Block status transition to COMPLETION/INVOICING if PDI_Evidence is missing.

[B3: JOB CARD FLOW]:
1. INTAKE: Brand, Model, Year, Fuel Type mandatory. Request clarification if missing.
2. DIAGNOSIS: Apply Confidence Gate. If < 90%, ask clarifying questions only.
3. ESTIMATION: Pricing ranges ONLY. Never exact prices. Use HSN 8708/9987.
4. APPROVAL: Block progress until explicit customer authorization.
5. PDI: Safety checklist and photo/video proof required for completion.
6. INVOICING: Signal 'Invoice Eligible' but do not calculate final invoice values.

[RESPOND IN VALID JSON ONLY]
`;

      const config: any = {
        systemInstruction: fullSystemPrompt,
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
                recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                systems_affected: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_info: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                fleet_id: { type: Type.STRING },
                vehicle_id: { type: Type.STRING },
                contract_status: { type: Type.STRING }, // MG_CREATED, MG_ACTIVE, MG_CONSUMING, MG_THRESHOLD_ALERT, MG_EXHAUSTED, MG_CLOSED
                mg_type: { type: Type.STRING }, // COST_BASED or USAGE_BASED
                contract_period: {
                  type: Type.OBJECT,
                  properties: { start: { type: Type.STRING }, end: { type: Type.STRING } }
                },
                risk_profile: {
                  type: Type.OBJECT,
                  properties: {
                    base_risk_score: { type: Type.NUMBER },
                    safety_buffer_percent: { type: Type.NUMBER }
                  }
                },
                assured_metrics: {
                  type: Type.OBJECT,
                  properties: {
                    total_assured_km: { type: Type.NUMBER },
                    monthly_assured_km: { type: Type.NUMBER },
                    rate_per_km: { type: Type.NUMBER },
                    monthly_assured_revenue: { type: Type.NUMBER }
                  }
                },
                cycle_data: {
                  type: Type.OBJECT,
                  properties: {
                    billing_cycle: { type: Type.STRING },
                    actual_km_run: { type: Type.NUMBER },
                    shortfall_km: { type: Type.NUMBER },
                    excess_km: { type: Type.NUMBER }
                  }
                },
                financials: {
                  type: Type.OBJECT,
                  properties: {
                    revenue_payable: { type: Type.NUMBER },
                    status: { type: Type.STRING }
                  }
                },
                financial_summary: {
                  type: Type.OBJECT,
                  properties: {
                    mg_monthly_limit: { type: Type.NUMBER },
                    actual_utilization: { type: Type.NUMBER },
                    utilization_status: { type: Type.STRING }, // SAFE, WARNING, BREACHED
                    invoice_split: {
                      type: Type.OBJECT,
                      properties: {
                        billed_to_mg_pool: { type: Type.NUMBER },
                        billed_to_customer: { type: Type.NUMBER },
                        unused_buffer_value: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                intelligence: {
                  type: Type.OBJECT,
                  properties: {
                    utilization_ratio: { type: Type.NUMBER },
                    revenue_stability_index: { type: Type.NUMBER },
                    asset_efficiency_score: { type: Type.NUMBER },
                    contract_health: { type: Type.STRING }
                  }
                },
                audit_trail: {
                  type: Type.OBJECT,
                  properties: {
                    logic_applied: { type: Type.STRING },
                    formula_used: { type: Type.STRING },
                    risk_weights_used: { type: Type.STRING } // e.g., "Brakes: 1.3x, Filters: 1.0x"
                  }
                }
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
                      id: { type: Type.STRING },
                      description: { type: Type.STRING },
                      hsn_code: { type: Type.STRING },
                      price_range: { type: Type.STRING },
                      unit_price: { type: Type.NUMBER }, // Added to match updated EstimateItem type
                      quantity: { type: Type.NUMBER },
                      gst_rate: { type: Type.NUMBER },
                      type: { type: Type.STRING }
                    }
                  }
                }
              }
            }
          },
          required: ["response_content", "job_status_update", "ui_triggers"]
        }
      };

      if (intelMode === 'THINKING') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      // Generate content using the configured model and prompt
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: intelMode === 'THINKING' ? this.thinkingModel : this.fastModel,
        contents: history,
        config: config,
      });

      // Directly access .text property as per extracting guidelines
      const rawText = response.text || '{}';
      return JSON.parse(rawText);
    } catch (error: any) {
      console.error("EKA Central OS Fatal Error:", error);
      return {
        response_content: { visual_text: "CRITICAL GATE FAILURE: " + (error.message || "Logic Breach"), audio_text: "Logic breach." },
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
      // Extract audio data from the candidates
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
