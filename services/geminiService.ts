
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const mgEngineInstruction = `
[MG (MINIMUM GUARANTEE) ENGINE - FINANCIAL TRUTH PROTOCOL]:
When Operating Mode is 2 (FLEET), you act as the deterministic MG Truth Engine. You enforce agreed contracts for fleet economics.

1. PRO-RATA RULE: If a vehicle starts/ends mid-cycle, apply: Adjusted_Threshold = (MG_Threshold / Total_Days_In_Month) * Active_Days.
2. CALCULATION STANDARD: All monetary values MUST be calculated to 2 decimal places. Show the formula string in 'formula_used'.
3. CATEGORIZATION:
   - MG_COVERED: Preventive Maintenance, Wear & Tear, Diagnostics.
   - NON_MG_PAYABLE: Accidental Damage, Abuse, Unauthorized Repairs, Cosmetics.
4. LOGIC GATES:
   - CASE 1 (Actual <= Threshold): Payable = Threshold × Rate. Status = "MINIMUM_GUARANTEE_APPLIED".
   - CASE 2 (Actual > Threshold): Payable = (Threshold × Rate) + ((Actual - Threshold) × Rate). Status = "OVER_UTILIZATION_CHARGED".
5. DOWNTIME RELIEF: Subtract downtime days from active days if provided.
6. MANDATORY OUTPUT: You must provide exact audit reasoning and logic splitting in the 'mg_analysis' block.
`;

      const modeInstruction = `
[GOVERNANCE CONTEXT]:
Active Operating Mode: ${opMode}
Current Logical State: ${currentStatus}
Vehicle Context: ${context && context.brand ? `${context.year} ${context.brand} ${context.model}` : 'Awaiting Context'}

[HSN/GST SOURCE OF TRUTH]:
Reference the following registry for all estimate generation:
${JSON.stringify(GST_HSN_REGISTRY, null, 2)}

[VISUALIZATION MANDATE]:
You MUST leverage data visualizations (visual_metrics) to explain complex automotive data:
- 'PIE': Use for symptom/complaint distribution.
- 'PROGRESS': Use for repair workflow or PDI completion.
- 'BAR': Use for comparing part costs or labor.
- 'RADAR': Use for 'System Equilibrium'.
- 'AREA' or 'LINE': Use for sensor trends over time.
- 'RADIAL': Use for specific gauges.

[RESPOND ONLY in valid JSON.]
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION + mgEngineInstruction + modeInstruction,
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
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
                mg_type: { type: Type.STRING },
                is_prorata_applied: { type: Type.BOOLEAN },
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    guaranteed_threshold: { type: Type.NUMBER },
                    actual_usage: { type: Type.NUMBER },
                    rate_per_unit: { type: Type.NUMBER },
                    active_days: { type: Type.NUMBER },
                    total_days_in_month: { type: Type.NUMBER }
                  }
                },
                financial_summary: {
                  type: Type.OBJECT,
                  properties: {
                    mg_monthly_limit: { type: Type.NUMBER },
                    actual_utilization: { type: Type.NUMBER },
                    utilization_status: { type: Type.STRING },
                    invoice_split: {
                      type: Type.OBJECT,
                      properties: {
                        billed_to_mg_pool: { type: Type.NUMBER },
                        billed_to_customer: { type: Type.NUMBER },
                        unused_buffer_value: { type: Type.NUMBER },
                        excess_amount: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                audit_trail: {
                  type: Type.OBJECT,
                  properties: {
                    logic_applied: { type: Type.STRING },
                    formula_used: { type: Type.STRING },
                    adjustments_made: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                audit_log: { type: Type.STRING }
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
      console.error("EKA Central OS Fatal Error:", error);
      return {
        response_content: { visual_text: "CRITICAL: Logic gate failure. " + (error.message || "XHR Failure"), audio_text: "Logic failure." },
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
