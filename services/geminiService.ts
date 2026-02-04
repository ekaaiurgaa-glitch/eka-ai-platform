
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

      const jobCardLogic = `
[SECTION B: JOB CARD → INVOICING FLOW PROTOCOL]
You are a deterministic automobile service advisor. You govern the workflow gates.

1. INTAKE GATE (B1):
   - Mandatory: Brand, Model, Year, Fuel Type.
   - Current Context: ${JSON.stringify(context)}
   - If missing any mandatory field, you MUST STOP and request it. Do not proceed to diagnosis.

2. DIAGNOSIS GATE (B2):
   - Normalize symptoms to known fault categories.
   - CONFIDENCE RULE: If diagnostic confidence < 90%, set status to 'AWAITING_ROOT_CAUSE' and ask clarifying questions.
   - Prohibited: Suggesting parts or labor until confidence >= 90%.

3. ESTIMATION GATE (B3):
   - ONLY permitted after Diagnosis confidence >= 90%.
   - Price range ONLY. No exact prices.
   - Apply HSN/GST: 8708 (28%) Parts, 9987 (18%) Labor.

4. APPROVAL GATE (B4):
   - Workflow STOPS until explicit approval is detected in history.

5. PDI GATE (B5 - CRITICAL):
   - After work execution, status moves to 'PDI'.
   - Mandatory requirements: Safety checklist, Technician declaration, Photo/Video proof.
   - PDI_VERIFIED_STATUS: ${context?.pdiVerified ? "TRUE" : "FALSE"}
   - HARD GATE: You are STRICTLY PROHIBITED from transitioning status to 'INVOICE_ELIGIBLE', 'INVOICING', 'COMPLETION', or 'CLOSED' if PDI_VERIFIED_STATUS is FALSE.
   - If PDI is not verified, remain in 'PDI' status and request verification.

6. INVOICING & CLOSURE (B6):
   - ONLY transition to 'INVOICE_ELIGIBLE' or 'INVOICING' when PDI_VERIFIED_STATUS is TRUE.
   - ONLY transition to 'CLOSED' after explicit confirmation of payment settlement.
`;

      const mgEngineInstruction = `
[SECTION A: MG GOVERNANCE ENGINE]
Apply Risk-Weighted calculations for fleet contracts.
Weights: Low (1.0), Medium (1.3), High (1.7).
Formula: MG_Amount = Σ (Component_Cost × Risk_Weight) + Safety_Buffer(15%)
`;

      const fullSystemPrompt = `
${EKA_CONSTITUTION}
${opMode === 1 ? jobCardLogic : ""}
${isMGTrigger ? mgEngineInstruction : ""}

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
                },
                audit_trail: {
                  type: Type.OBJECT,
                  properties: {
                    risk_weights_used: { type: Type.STRING },
                    formula_used: { type: Type.STRING }
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
                      value: { type: Type.NUMBER }
                    }
                  }
                }
              }
            }
          },
          required: ["response_content", "job_status_update", "ui_triggers"]
        }
      };

      const modelToUse = (intelMode === 'THINKING' || isMGTrigger) ? this.thinkingModel : this.fastModel;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: history,
        config: config,
      });

      const rawText = response.text || '{}';
      return JSON.parse(rawText);
    } catch (error: any) {
      return {
        response_content: { visual_text: "ERROR: Central logic gate failure.", audio_text: "Logic failure." },
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
