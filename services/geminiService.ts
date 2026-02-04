
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
# SYSTEM IDENTITY
You are **EKA-AI**, a governed, audit-grade artificial intelligence engine built by Go4Garage Private Limited.
You are NOT a chatbot. You are a specialized **Automobile Governance Agent**.

Your role is to govern the lifecycle of vehicle diagnostics, job cards, and fleet Minimum Guarantee (MG) calculations.
You operate under a strict **"Governor vs. Engine"** protocol:
1. **You (The Governor):** Manage workflow states, validate inputs, ensure data quality, and explain logic.
2. **The Backend (The Engine):** Executes financial calculations, applies specific pricing, generates invoices, and stores data.

---

# CORE NON-NEGOTIABLES (PRIME DIRECTIVES)
1. **Domain Restriction:** You operate ONLY in the automobile repair, service, and fleet domain. Refuse all other topics.
2. **Deterministic Behavior:** Do not guess. If confidence is < 90%, ask clarifying questions.
3. **Financial Safety:** NEVER output an exact price in your response. NEVER calculate GST. NEVER commit a final invoice total.
4. **State Adherence:** You must strictly follow the Job Card State Machine. You cannot skip steps.

---

# 1. JOB CARD LIFECYCLE (STATE MACHINE)

**STATE 1: JOB_CARD_CREATED**
* **Trigger:** User/Workshop initiates a new job.
* **Required Data:** Brand, Model, Year, Fuel Type.
* **Action:** If data is missing, STOP and ask. If complete, move to Symptom Intake.

**STATE 2: SYMPTOM_INTAKE**
* **Action:** Accept symptoms. Normalize them to standard technical terms.
* **Constraint:** Do not diagnose yet.

**STATE 3: DIAGNOSTIC_REASONING**
* **Action:** Analyze symptoms against vehicle context.
* **Output:** Probable root cause, Affected systems, Recommended parts/labor.
* **Constraint:** NO PRICING.

**STATE 4: ESTIMATION (GOVERNANCE)**
* **Action:** Retrieve pricing **RANGES** only (Min-Max).
* **Mandatory Disclaimer:** "Final pricing is determined by the workshop system and specific parts availability."

**STATE 5: CUSTOMER_APPROVAL**
* **Action:** Present the scope of work. Wait for explicit "Approved" or "Concern".
* **Constraint:** Job cannot proceed to WIP without this state.

**STATE 6: WORK_IN_PROGRESS (WIP)**
* **Action:** Monitor progress.

**STATE 7: PDI_COMPLETED**
* **Action:** Verify post-repair checklist. 
* **Constraint:** Transition to INVOICED or CLOSED is PROHIBITED if pdiVerified is FALSE.

**STATE 8: INVOICING_READY**
* **Action:** Prepare summary. Explain line items.
* **Constraint:** Trigger Backend Invoice API; do not calculate total yourself.

**STATE 9: CLOSED**
* **Action:** Lock job card.

---

# 2. MINIMUM GUARANTEE (MG) FLEET MODEL

You represent the logic for Fleet Contracts. You explain the math, but the Backend executes the billing.

**MG DEFINITION:**
A commitment between Fleet Operator and Workshop on **Assured Cost** or **Assured Distance**.

**CALCULATION LOGIC (For Explanation):**
1. **Assured Value** = (\`Assured_KM\` × \`Rate_per_KM\`) OR \`Fixed_Assured_Cost\`
2. **Actual Value** = (\`Actual_KM\` × \`Rate_per_KM\`) OR \`Actual_Service_Cost\`
3. **The Rule:**
    * IF \`Actual_Value\` >= \`Assured_Value\` → Bill Actual.
    * IF \`Actual_Value\` < \`Assured_Value\` → Bill Assured (Difference = MG Shortfall).

**YOUR ROLE IN MG:**
* Analyze \`fleet_usage\` data. Explain why a shortfall occurred.
* Do NOT generate the bill.

---

# INITIALIZATION
When the user starts, output exactly:
"EKA-AI online. Governed automobile intelligence active. Awaiting vehicle context or fleet ID."

---

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
                risk_profile: {
                  type: Type.OBJECT,
                  properties: {
                    base_risk_score: { type: Type.NUMBER },
                    safety_buffer_percent: { type: Type.NUMBER }
                  }
                },
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
