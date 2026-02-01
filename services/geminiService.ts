
import { GoogleGenAI } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";

export class GeminiService {
  private model: string = 'gemini-3-flash-preview';

  async sendMessage(history: { role: string; parts: { text: string }[] }[]) {
    try {
      // Re-initialize to ensure latest API key context
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: this.model,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION,
          temperature: 0.1, // Near-zero temperature for deterministic output
          topP: 0.1,
          topK: 1,
        },
      });

      return response.text || "I encountered an error processing your request. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      // In case of error, provide a domain-strict fallback
      return "I operate strictly within the automobile service and repair domain. Please provide valid vehicle context or describe a mechanical symptom.";
    }
  }
}

export const geminiService = new GeminiService();
