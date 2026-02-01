
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { EKA_CONSTITUTION } from "../constants";

export class GeminiService {
  private textModel: string = 'gemini-3-flash-preview';
  private ttsModel: string = 'gemini-2.5-flash-preview-tts';

  async sendMessage(history: { role: string; parts: { text: string }[] }[]) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      const response = await ai.models.generateContent({
        model: this.textModel,
        contents: history,
        config: {
          systemInstruction: EKA_CONSTITUTION,
          temperature: 0,
          responseMimeType: "application/json",
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

      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return JSON.stringify({
        visual_content: "CRITICAL: Diagnostic engine unreachable. Please verify vehicle context.",
        audio_content: "Diagnostic engine unreachable.",
        language_code: "en",
        available_translations: ["en"]
      });
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
      console.error("TTS Error:", error);
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
