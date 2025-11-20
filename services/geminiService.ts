
import { GoogleGenAI } from "@google/genai";
import { Machine } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const askAiAssistant = async (question: string, machine: Machine): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("A funcionalidade de IA está desativada. Nenhuma chave de API foi configurada.");
    }
    
    try {
        const systemInstruction = `Você é um assistente especialista em solução de problemas para equipamentos de linha de produção. 
        O operador está trabalhando na máquina: '${machine.name}'. 
        Seu objetivo é fornecer respostas claras, concisas e seguras para ajudar a resolver o problema. 
        Priorize a segurança do operador em todas as suas recomendações. 
        Se a pergunta for fora do escopo de manutenção ou operação da máquina, recuse educadamente.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: question,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "Ocorreu um erro ao contatar o assistente de IA. Por favor, tente novamente mais tarde.";
    }
};
