import { GoogleGenAI, Type, Schema } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { AnalysisResult } from "../types";

// Initialize Gemini Client
// IMPORTANT: API Key is assumed to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    myHand: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of tiles in the user's hand (e.g., '1B', 'Red', 'East')."
    },
    discards: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of visible discarded tiles on the table."
    },
    safeTiles: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of tiles identified as safe to discard based on the table context."
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        action: { 
          type: Type.STRING, 
          enum: ["discard", "chow", "pong", "kong", "hu", "wait"],
          description: "The recommended action."
        },
        tile: { 
          type: Type.STRING,
          description: "The target tile for the action."
        },
        confidence: { type: Type.NUMBER },
        reasoning: { type: Type.STRING }
      },
      required: ["action", "tile", "confidence", "reasoning"]
    }
  },
  required: ["myHand", "discards", "safeTiles", "recommendation"]
};

export const analyzeMahjongImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // We use gemini-3-flash-preview for complex reasoning tasks with vision inputs.
    // It offers a good balance of speed and multimodal understanding.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          {
            text: "Analyze the current Mahjong state. What should I do?"
          }
        ]
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as AnalysisResult;
      return result;
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};