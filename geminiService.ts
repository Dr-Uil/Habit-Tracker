
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMotivationalInsight(progressData: any) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O usuário está acompanhando suas metas para 2026. Aqui está o resumo do progresso dele: ${JSON.stringify(progressData)}.
      Como um coach de alto desempenho e desenvolvimento pessoal, dê um conselho curto, motivador e focado em melhoria contínua em português do Brasil. 
      Seja específico sobre algum ponto que ele pode melhorar se o progresso estiver baixo.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini insight:", error);
    return "Mantenha o foco! Cada pequeno passo hoje constrói o seu futuro em 2026. Continue firme!";
  }
}
