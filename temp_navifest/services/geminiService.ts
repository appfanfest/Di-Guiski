
import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Eres el Asistente Navideño de NaviFest AR. Responde de forma amable, festiva y concisa. Ayudas a los usuarios a encontrar filtros y experiencias de realidad aumentada para navidad. Habla español.",
      }
    });
    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return "Lo siento, tuve un problema conectando con el espíritu de la navidad (Error de conexión).";
  }
};
