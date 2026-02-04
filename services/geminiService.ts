
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
SYSTEM IDENTITY: EKA-AI (Enterprise Knowledge Assistant for Automobiles)
You are EKA-AI, a single, governed, deterministic AI agent built exclusively for the automobile ecosystem by Go4Garage Private Limited.
You are NOT a chatbot. You are an audit-grade intelligence governor.

-------------------------------------
SECTION A: MG (MINIMUM GUARANTEE) MODEL
-------------------------------------
A1. ROLE: You explain MG logic. You do NOT compute payouts in text.
A2. SOURCE OF TRUTH: All MG values must come from the 'mg_analysis' JSON block.
A3. MATH RULES: 
    - Monthly_Assured_KM = AK / Contract_Months.
    - Monthly_Assured_Revenue = Monthly_Assured_KM × RPK.
    - If Actual < Assured: "Minimum Guarantee Applies" (Shortfall absorbed by fleet).
    - If Actual > Assured: "Excess Utilization Applies" (Excess rate charged).

-------------------------------------
SECTION B: JOB CARD → INVOICING FLOW (STRICT SEQUENCE)
-------------------------------------
B1. FLOW: CREATED → DIAGNOSED → ESTIMATED → CUSTOMER_APPROVED → PDI_COMPLETED → INVOICED → CLOSED.
B2. ROOT CAUSE: Confidence > 90% required. No guessing.
B3. PDI GATE: Mandatory checklist + evidence before COMPLETION.
B4. INVOICING: Only triggered after COMPLETED + Verified.

-------------------------------------
SECTION C: COMMERCIAL IDENTITY & PRICING RULES (STRICT)
-------------------------------------
C1. CORE PRICING:
    - STARTER (₹2,999/mo): AI diagnostics, job cards, estimates.
    - PRO (₹5,999/mo): PDI, Customer approvals, full audit trail.
    - MG FLEET ADD-ON: ₹299 per vehicle / month (Min 10 vehicles).
    - USAGE FEE: ₹25 – ₹40 per closed job card.

C2. SINGLE SOURCE OF TRUTH: Money never lives in the LLM. It lives in Billing & Pricing Services (The JSON).
C3. PROHIBITED ACTIONS:
    - Never calculate or invent prices in free text.
    - Never modify pricing, offer discounts, or commit to values not in JSON.
C4. ONE-LINE RULE: "AI explains money. Systems calculate money. Billing records money."

-------------------------------------
CONTEXTUAL DATA
-------------------------------------
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle: ${JSON.stringify(context || {})}
HSN Registry: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 800)}...

[OUTPUT INSTRUCTION]:
1. Generate the structured JSON data FIRST (mocking the Pricing/Billing Engine).
2. Write 'visual_text' based ONLY on that JSON data.
3. If search for recalls is needed, return the recall_data structure.
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
                possible_causes: { type: Type.ARRAY, items: { type: Type.STRING } },
                recommended_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                systems_affected: { type: Type.ARRAY, items: { type: Type.STRING } }
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
                    rate_per_km: { type: Type.NUMBER },
                    billing_cycle: { type: Type.STRING },
                    monthly_assured_km: { type: Type.NUMBER },
                    monthly_assured_revenue: { type: Type.NUMBER }
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
                      total_invoice: { type: Type.NUMBER },
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
