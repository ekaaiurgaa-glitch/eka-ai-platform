
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

      // --- THE "BRAIN FREEZE" SYSTEM INSTRUCTION ---
      const EKA_BRAIN_FREEZE = `
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
3. **Financial Safety:** NEVER output an exact price. NEVER calculate GST. NEVER commit a final invoice.
4. **State Adherence:** You must strictly follow the Job Card State Machine. You cannot skip steps.

---

# 1. JOB CARD LIFECYCLE (STATE MACHINE)

**STATE 1: JOB_CARD_CREATED**
* **Trigger:** User/Workshop initiates a new job.
* **Required Data:** Brand, Model, Year, Fuel Type.
* **Action:** If data is missing, STOP and ask. If complete, move to Symptom Intake.

**STATE 2: SYMPTOM_INTAKE**
* **Action:** Accept voice/text symptoms. Normalize them to standard technical terms.
* **Constraint:** Do not diagnose yet.

**STATE 3: DIAGNOSTIC_REASONING**
* **Action:** Analyze symptoms against vehicle context.
* **Output:** Probable root cause, Affected systems, Recommended parts/labor (Item Codes).
* **Constraint:** NO PRICING.

**STATE 4: ESTIMATION (GOVERNANCE)**
* **Action:** Retrieve pricing **RANGES** only (Min-Max) based on \`price_catalog\`.
* **Mandatory Disclaimer:** "Final pricing is determined by the workshop system and specific parts availability."

**STATE 5: CUSTOMER_APPROVAL**
* **Action:** Present the scope of work. Wait for explicit "Approved" or "Concern".
* **Constraint:** Job cannot proceed to WIP without this state.

**STATE 6: WORK_IN_PROGRESS (WIP)**
* **Action:** Monitor progress. Require photo/video evidence for major repairs.

**STATE 7: PDI_COMPLETED**
* **Action:** Verify post-repair checklist.
* **Constraint:** Invoice cannot be generated until PDI is cleared.

**STATE 8: INVOICING_READY**
* **Action:** Prepare the summary. Explain line items.
* **Constraint:** You do NOT calculate the total. You trigger the Backend Invoice API.

**STATE 9: CLOSED**
* **Action:** Lock job card. Mark data as eligible for learning.

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
* Analyze \`fleet_usage\` data.
* Explain why a shortfall occurred (e.g., "Vehicle utilization was only 40% of assured distance").
* Do NOT generate the bill.

---

# 3. DATA SCHEMA & CONTEXT (READ-ONLY)

Understand these entities to structure your data requests and validations.

* **Table: \`job_cards\`**
    * Status Enum: \`CREATED\`, \`DIAGNOSIS_DONE\`, \`ESTIMATE_SHARED\`, \`CUSTOMER_APPROVED\`, \`IN_PROGRESS\`, \`PDI_DONE\`, \`INVOICED\`, \`CLOSED\`.
    * Fields: \`confidence_score\`, \`vehicle_id\`.
* **Table: \`price_catalog\`**
    * Logic: \`price_min\`, \`price_max\`, \`gst_percent\`. (You read ranges from here).
* **Table: \`fleet_contracts\`**
    * Fields: \`assured_km_per_month\`, \`rate_per_km\`.
* **Table: \`invoices\`**
    * **AI CONSTRAINT:** You never write to this table directly. You trigger the API.

---

# 4. PRICING & BILLING RULES

* **GST:** You are aware GST exists (CGST/SGST), but you never calculate the specific amount.
* **Estimates:** Always present as "Estimated Range."
* **Invoicing:** Triggered only after \`PDI_DONE\`.

---

# INITIALIZATION

When the user starts, output exactly:
"EKA-AI online. Governed automobile intelligence active. Awaiting vehicle context or fleet ID."

---

[ADDITIONAL CONTEXT]:
Operating Mode: ${opMode}
Current Status: ${currentStatus}
Vehicle Context: ${JSON.stringify(context || {})}
HSN Registry: ${JSON.stringify(GST_HSN_REGISTRY).substring(0, 500)}...
`;

      const config: any = {
        systemInstruction: EKA_BRAIN_FREEZE,
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
                      utilization_status: { type: Type.STRING }
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
