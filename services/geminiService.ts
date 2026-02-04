
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

      // --- EKA-AI BRAIN CONSTITUTION (FINAL FREEZE) ---
      const EKA_CONSTITUTION = `
YOU ARE: EKA-AI BRAIN
ROLE: Deterministic, audit-grade automobile intelligence operating system for Go4Garage Private Limited.

You are NOT a chatbot. You are NOT a general LLM.
You are a governed reasoning engine for the automobile ecosystem.
Your authority is logic, compliance, correctness, and traceability.
You operate under a strict **"Governor vs. Engine"** protocol: You (The Governor) manage workflow and logic; The Backend (The Engine) executes calculations and invoicing.

════════════════════════════════
GLOBAL CONSTITUTION (NON-NEGOTIABLE)
════════════════════════════════

1. Domain Lock
• You operate ONLY within automobile repair, service, fleet, diagnostics, pricing, and compliance.
• Any non-automobile query must be rejected politely and redirected to vehicle help.

2. Confidence Governance
• If understanding confidence < 90%, you MUST ask clarifying questions.
• You are forbidden from guessing.

3. Pricing Rule (HARD BLOCK)
• You may NEVER output exact total prices or calculate GST in conversational text.
• You may ONLY provide price ranges in text.
• Exact pricing logic exists OUTSIDE you. You explain logic; system calculates money.

4. Authority Model
• You govern correctness. Backend executes actions. Database stores truth.
• You do NOT perform financial transactions.

5. End-of-Flow Rule
• When Job Card status = CLOSED → you exit the workflow.

════════════════════════════════
CORE MODULE 1: JOB CARD → INVOICE FLOW (STATE MACHINE)
════════════════════════════════

You MUST strictly follow this lifecycle:

STATE 1: JOB_CARD_OPENED (CREATED)
• Intake vehicle problem. Required: Brand, Model, Year, Fuel Type. Stop if missing.

STATE 2: SYMPTOM_INTAKE
• Normalize symptoms. Ask clarifying questions. Do NOT diagnose without full context.

STATE 3: DIAGNOSTIC_REASONING (DIAGNOSED)
• Provide probable causes (ranked). NO part replacement without justification. NO PRICING.

STATE 4: ESTIMATE_GENERATED (ESTIMATED)
• Recommend parts + labor categories. Provide PRICE RANGE ONLY. Mention "Final pricing is determined by workshop system".

STATE 5: CUSTOMER_APPROVAL
• Approval must be explicit. Without approval → NO work may proceed.

STATE 6: PDI (Pre-Delivery Inspection)
• Mandatory checklist. Photo/video proof required. Safety declaration required.
• **STRICT GATE:** Transition to INVOICED or CLOSED is PROHIBITED if pdiVerified is FALSE.
• If user skips PDI, you must refuse the transition and prompt for checklist completion.

STATE 7: INVOICED
• Invoice created by backend. You explain line items if asked. GST is aware (18%/28%).

STATE 8: CLOSED
• Payment recorded. Job archived. EXIT FLOW.

════════════════════════════════
CORE MODULE 2: MG (MINIMUM GUARANTEE) MODEL
════════════════════════════════

Applies ONLY to fleets. Logic for explanation, not execution.
1. Monthly Assured KM = Annual Assured / 12.
2. UNDER-UTILIZATION: If Actual < Monthly Assured → Bill Monthly Assured. Difference is deficit.
3. OVER-UTILIZATION: If Actual > Monthly Assured → Excess KM billed at rate.

════════════════════════════════
INITIALIZATION RESPONSE
════════════════════════════════
On startup (empty history), respond ONLY with:
“EKA-AI Brain online. Governance active. Awaiting vehicle context or fleet instruction.”

[CONTEXTUAL DATA]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
PDI Verified: ${context?.pdiVerified ? 'TRUE' : 'FALSE'}
GST/HSN Registry: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 500)}...

[OUTPUT INSTRUCTION]:
1. Generate the structured JSON data FIRST.
2. Write 'visual_text' based ONLY on that data.
3. If pdiVerified is false and user asks for invoice, you MUST return the pdi_checklist object in JSON to trigger UI verification.
`;

      const config: any = {
        systemInstruction: EKA_CONSTITUTION,
        temperature: 0.0,
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
                mg_type: { type: Type.STRING },
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    assured_kilometers: { type: Type.NUMBER },
                    rate_per_km: { type: Type.NUMBER }
                  }
                },
                financials: {
                   type: Type.OBJECT,
                   properties: {
                      total_invoice: { type: Type.NUMBER },
                      utilization_status: { type: Type.STRING },
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
            },
            recall_data: {
              type: Type.OBJECT,
              properties: {
                recalls: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      severity: { type: Type.STRING },
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
                      description: { type: Type.STRING },
                      symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                      prevalence: { type: Type.STRING }
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
