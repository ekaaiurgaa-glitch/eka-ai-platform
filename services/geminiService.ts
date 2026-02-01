
import { GoogleGenAI } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";

export class GeminiService {
  private model: string = 'gemini-3-flash-preview';

  async sendMessage(history: { role: string; parts: { text: string }[] }[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: this.model,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION,
          temperature: 0, // Absolute deterministic
          topP: 0.1,
          topK: 1,      // Forces model to choose highest probability token only
        },
      });

      return response.text || "I operate strictly within the automobile service and repair domain. Please provide valid vehicle context.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "CRITICAL: Diagnostic engine unreachable. Please verify vehicle context and resubmit request.";
    }
  }
}

export const geminiService = new GeminiService();
