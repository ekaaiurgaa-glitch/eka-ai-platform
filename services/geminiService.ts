
import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";
import { VehicleContext } from "../types";

export class GeminiService {
  // Use pro model for complex diagnostic and DTC lookup tasks
  private textModel: string = 'gemini-3-pro-preview';
  private ttsModel: string = 'gemini-2.5-flash-preview-tts';

  async sendMessage(history: { role: string; parts: { text: string }[] }[], context?: VehicleContext) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const contextPrompt = context && context.brand ? 
        `\n\n[LOCKED VEHICLE CONTEXT]:
        Brand: ${context.brand}
        Model: ${context.model}
        Year: ${context.year}
        Fuel: ${context.fuelType}` : '';

      const response = await ai.models.generateContent({
        model: this.textModel,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION + contextPrompt,
          temperature: 0.1,
          responseMimeType: "application/json",
          tools: [{ googleSearch: {} }],
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visual_content: { type: Type.STRING },
              audio_content: { type: Type.STRING },
              language_code: { type: Type.STRING },
              available_translations: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["visual_content", "audio_content", "language_code", "available_translations"]
          }
        },
      });

      // Extract grounding metadata for DTC verification
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const groundingUrls: { title: string; uri: string }[] = [];
      if (groundingChunks) {
        groundingChunks.forEach(chunk => {
          if (chunk.web?.uri) {
            groundingUrls.push({ 
              title: chunk.web.title || 'Technical Source', 
              uri: chunk.web.uri 
            });
          }
        });
      }

      const result = JSON.parse(response.text);
      return {
        ...result,
        grounding_urls: groundingUrls
      };
    } catch (error) {
      console.error("EKA-Ai Engine Error:", error);
      return {
        visual_content: "### SYSTEM ERROR: DIAGNOSTIC TIMEOUT\n\nThe EKA-Ai diagnostic engine encountered an unexpected interruption. Please ensure your vehicle context is locked and re-issue the command.",
        audio_content: "System error. Diagnostic engine timed out. Please try again.",
        language_code: "en",
        available_translations: ["en"],
        grounding_urls: []
      };
    }
  }

  async generateSpeech(text: string): Promise<Uint8Array | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: this.ttsModel,
        contents: [{ parts: [{ text: `Speak this professionally as EKA-Ai: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return this.decodeBase64(base64Audio);
      }
      return null;
    } catch (error) {
      console.error("TTS Protocol Error:", error);
      return null;
    }
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
  ): Promise<AudioBuffer> {
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
