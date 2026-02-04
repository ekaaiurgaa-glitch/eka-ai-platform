
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
      const lastUserMessage = history[history.length - 1]?.parts[0]?.text || "";
      const isMGTrigger = lastUserMessage.includes("Calculate MG Value") || opMode === 2;
      
      const needsSearch = lastUserMessage.toLowerCase().includes("recall") || 
                          lastUserMessage.toLowerCase().includes("mechanical issues") ||
                          lastUserMessage.toLowerCase().includes("trending issues") ||
                          lastUserMessage.toLowerCase().includes("scan");

      const jobCardLogic = `
[SECTION B: JOB CARD → INVOICING FLOW PROTOCOL]
You are a deterministic automobile service advisor. You govern the workflow gates.

1. INTAKE GATE (B1):
   - Mandatory: Brand, Model, Year, Fuel Type.
   - Current Context: ${JSON.stringify(context)}
   - If missing any mandatory field, you MUST STOP and request it.

2. DIAGNOSIS GATE (B2):
   - Normalize symptoms. Confidence MUST be >= 90%.
   - VISUAL REQUIREMENT: Return a PIE chart showing "Complaint Distribution" if multiple symptoms are listed.

3. ESTIMATION GATE (B3):
   - Use HSN 8708 (28%) Parts, 9987 (18%) Labor.
   - VISUAL REQUIREMENT: Return a BAR chart comparing "Estimated Costs" across categories.

4. PDI GATE (B5):
   - HARD GATE: Prohibition of status transition to 'CLOSED' if pdiVerified is false.
   - VISUAL REQUIREMENT: Return a PROGRESS chart showing "Overall Job Completion %".
`;

      const visualInstruction = `
[VISUAL INTELLIGENCE PROTOCOL]
You MUST generate visual_metrics for the following scenarios:
1. Symptoms List: Type 'PIE' for "Symptom Cluster".
2. Job Card Flow: Type 'PROGRESS' for "Protocol Fulfillment".
3. Component Analysis: Type 'RADAR' for "Component Integrity Scores".
4. Financials: Type 'BAR' for "Category Allocation".
5. Temporal Data: Type 'LINE' for "Telemetry History".
`;

      const searchInstruction = needsSearch ? `
[SECTION C: SEARCH GROUNDING PROTOCOL]
You are performing a real-time safety and mechanical scan for ${context?.brand} ${context?.model} (${context?.year}).
1. Search for official safety recalls from regulatory bodies (e.g., NHSTA, SIAM, MoRTH).
2. Identify common mechanical failures or trending technical issues reported by users or technicians for this specific model year.
3. Return the results in the recall_data structure.
4. Be precise. Cite specific sources via grounding chunks.
` : "";

      const fullSystemPrompt = `
${EKA_CONSTITUTION}
${visualInstruction}
${opMode === 1 ? jobCardLogic : ""}
${isMGTrigger ? "[SECTION A: MG GOVERNANCE ENGINE] Apply formula and return MG_ANALYSIS object." : ""}
${searchInstruction}

[OPERATING PARAMETERS]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle Identity Secured: ${context && context.brand ? "TRUE" : "FALSE"}
PDI Verified: ${context?.pdiVerified ? "TRUE" : "FALSE"}

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
            diagnostic_data: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING },
                confidence_score: { type: Type.NUMBER },
                root_cause_identified: { type: Type.BOOLEAN },
                possible_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing_info: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            recall_data: {
              type: Type.OBJECT,
              properties: {
                model_year: { type: Type.STRING },
                recalls: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING },
                      date: { type: Type.STRING },
                      remedy: { type: Type.STRING }
                    }
                  }
                },
                common_issues: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      component: { type: Type.STRING },
                      symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                      description: { type: Type.STRING },
                      prevalence: { type: Type.STRING }
                    }
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
                      unit: { type: Type.STRING },
                      color: { type: Type.STRING }
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
            mg_analysis: {
              type: Type.OBJECT,
              properties: {
                contract_status: { type: Type.STRING },
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
                      hsn_code: { type: Type.STRING },
                      price_range: { type: Type.STRING },
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

      if (needsSearch) config.tools = [{ googleSearch: {} }];

      const modelToUse = (intelMode === 'THINKING' || isMGTrigger || needsSearch) ? this.thinkingModel : this.fastModel;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: history,
        config: config,
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const links: GroundingLink[] = chunks
          .filter((c: any) => c.web)
          .map((c: any) => ({
            uri: c.web.uri,
            title: c.web.title || "Reference Source"
          }));
        
        if (links.length > 0) parsed.grounding_links = links;
      }

      return parsed;
    } catch (error: any) {
      console.error("Gemini Error:", error);
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
