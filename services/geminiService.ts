
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
[MG (MINIMUM GUARANTEE) ENGINE PROTOCOL]:
When Operating Mode is 2 (FLEET), you act as the MG Truth Engine:
- CATEGORIZATION:
  - MG_COVERED: Preventive Maintenance, Wear & Tear, Diagnostics.
  - NON_MG_PAYABLE: Accidental Damage, Abuse, Unauthorized Repairs, Cosmetics.
- SETTLEMENT LOGIC (COST-BASED):
  - If Actual < MG_Limit: Fleet pays MG_Limit. Unused buffer is recorded.
  - If Actual > MG_Limit: Fleet pays MG_Limit + Overage.
- SETTLEMENT LOGIC (USAGE-BASED):
  - Actual KM vs KM Limit. Excess KM billed at contract rate.
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
- 'PIE': Use for symptom/complaint distribution (Mechanical vs Electrical vs Body).
- 'PROGRESS': Use for repair workflow percentage or PDI completion.
- 'BAR': Use for comparing part costs or labor hours.
- 'RADAR': Use for 'System Equilibrium' (Brakes, Engine, Suspension, Tyres, Battery, Cooling).
- 'AREA' or 'LINE': Use for sensor trends over time (Voltage, Temperature, O2 levels).
- 'RADIAL': Use for specific gauges (Fuel level, Battery state of charge, Tyre health).

[ESTIMATE COMPLIANCE]:
- PART items MUST use HSN starting with 8708 and 28% GST.
- LABOR/SERVICE items MUST use HSN starting with 9987 and 18% GST.

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
                      color: { type: Type.STRING },
                      fullMark: { type: Type.NUMBER }
                    },
                    required: ["name", "value"]
                  }
                }
              }
            },
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
                mg_type: { type: Type.STRING },
                line_item_analysis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING },
                      category: { type: Type.STRING },
                      classification: { type: Type.STRING },
                      cost: { type: Type.NUMBER }
                    }
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
                        unused_buffer_value: { type: Type.NUMBER }
                      }
                    }
                  }
                },
                audit_log: { type: Type.STRING }
              }
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
                }
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
                    }
                  }
                },
                currency: { type: Type.STRING }
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

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        result.grounding_links = groundingChunks.map((chunk: any) => ({
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || 'External Logic Source'
        })).filter((link: any) => link.uri);
      }

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
