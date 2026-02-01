
import { GoogleGenAI } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string = 'gemini-3-flash-preview';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async sendMessage(history: { role: string; parts: { text: string }[] }[]) {
    try {
      // We use the last message as current content and rest as context
      const currentMessage = history[history.length - 1].parts[0].text;
      const context = history.slice(0, -1);

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION,
          temperature: 0.1, // Lower temperature for more deterministic, professional output
          topP: 0.8,
          topK: 40,
        },
      });

      return response.text || "I encountered an error processing your request. Please try again.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting to my diagnostic systems. Please ensure you are asking about a vehicle-related matter.";
    }
  }
}

export const geminiService = new GeminiService();
