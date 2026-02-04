
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

      // --- THE CORE SYSTEM IDENTITY (STRICT PRICING GOVERNANCE) ---
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
A1. ROLE: You explain MG logic. You do NOT compute payouts in text.
A2. SOURCE OF TRUTH: All MG values (Shortfall, Excess, Payable) must come from the 'mg_analysis' JSON block.
A3. LOGIC EXPLANATION: 
    - If Actual < Assured: "Minimum Guarantee Applies" (Shortfall absorbed by fleet).
    - If Actual > Assured: "Excess Utilization Applies" (Excess rate charged).

-------------------------------------
SECTION B: JOB CARD GOVERNANCE
-------------------------------------
B1. INTAKE GATE: Mandatory: Brand, Model, Year, Fuel Type. If missing, STOP and request.
B2. ROOT CAUSE: If confidence < 90%, ASK CLARIFYING QUESTIONS. Do NOT guess.
B4. APPROVAL GATE: Job cannot proceed without Customer Approval.
B5. PDI GATE: Job cannot be COMPLETED without PDI (Safety, Proof).
B7. INVOICING: Only triggers if Job = COMPLETED and PDI = Verified.

-------------------------------------
SECTION C: PRICING GOVERNANCE RULES (STRICT)
-------------------------------------
C1. SINGLE SOURCE OF TRUTH: Money never lives in the LLM (You). Money lives in Billing & Pricing Services (The JSON Schema).
C2. PROHIBITED ACTIONS:
    - You are NOT allowed to calculate or invent prices in conversational text.
    - You must NEVER output exact billable amounts in text unless derived from the 'estimate_data' or 'mg_analysis' JSON.
    - You must NEVER modify pricing, offer discounts, or commit to monetary values not present in the structured data.
C3. ALLOWED ACTIONS:
    - Explain pricing plans defined in the context.
    - Return pricing ranges provided by the backend (simulated in JSON).
    - Describe what a user gets at each tier.
    - Explain the "Why" behind a cost (e.g., "This is due to high wear on brake pads").
C4. ONE-LINE RULE: "AI explains money. Systems calculate money. Billing records money."

-------------------------------------
CONTEXTUAL DATA
-------------------------------------
Current Operating Mode: ${opMode}
Current Job Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
GST/HSN Database: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 1000)}...

[OUTPUT INSTRUCTION]:
1. Generate the structured JSON data FIRST (this acts as the Billing Engine).
2. Then, write your 'visual_text' response based ONLY on that data.
3. If the data is missing, state: "Pricing will be confirmed by the Billing System."
4. If search for recalls is needed, return the recall_data structure.
`;

      const config: any = {
        systemInstruction: EKA_CORE_LOGIC,
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
                systems_affected: { type: Type.ARRAY, items: { type: Type.STRING } }
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
                    logic_applied: { type: Type.STRING },
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
                currency: { type: Type.STRING },
                tax_type: { type: Type.STRING }
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
