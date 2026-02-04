
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

[SECTION A: MG FLEET INTELLIGENCE]:
- Enforce Monthly_Assured_KM = AK / Contract_Months.
- Enforce Under-utilization: IF Actual < Assured, Revenue = Monthly_Assured_Revenue.
- Enforce Over-utilization: IF Actual > Assured, Revenue = Assured + (Excess * Excess_Rate).
- MUST calculate: Utilization Ratio, Revenue Stability Index, Asset Efficiency, Contract Health.

[SECTION B: JOB CARD GATES]:
1. INTAKE: Brand, Model, Year, Fuel Type mandatory. Request clarification if missing.
2. DIAGNOSIS: confidence_score MUST be >= 90 for root cause. If < 90, ask clarifying questions only.
3. ESTIMATION: Pricing ranges ONLY. Never exact prices. Use HSN 8708/9987.
4. PDI: Block status transition to COMPLETION/INVOICING if PDI_Evidence is missing.
5. INVOICING: Signal 'Invoice Eligible' but do not calculate final invoice values.

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
                contract_period: {
                  type: Type.OBJECT,
                  properties: { start: { type: Type.STRING }, end: { type: Type.STRING } }
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
                    formula_used: { type: Type.STRING }
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
