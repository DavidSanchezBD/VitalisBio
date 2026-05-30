import { GoogleGenAI } from "@google/genai";
import { UserProfile, Recommendation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getNutritionRecommendation(
  profile: UserProfile,
  workoutType: string,
  timeOfDay: string
): Promise<Recommendation> {
  const prompt = `
    You are Vitalis AI, a scientific nutrition consultant for high-performance athletes.
    The athlete's goal is: ${profile.goal}. 
    Current weight: ${profile.weight}kg.
    Activity level: ${profile.activityLevel}.
    Daily protein target: ${profile.proteinTarget}g.
    
    Context:
    - Workout: ${workoutType}
    - Time of day: ${timeOfDay}
    
    Provide a specific nutrition recommendation in JSON format:
    {
      "title": "Short catchy title",
      "description": "Short practical instruction (max 2 sentences)",
      "type": "post-workout" | "snack" | "pre-workout",
      "scientificInsight": "One sentence explaining the biological mechanism why this is ideal."
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      id: 'error',
      title: "Recomendação Genérica",
      description: "Consuma 25g de proteína de rápida absorção com carboidratos complexos.",
      type: "post-workout",
      scientificInsight: "A janela metabólica pós-treino otimiza a síntese proteica muscular."
    };
  }
}

export async function chatWithVitalis(
  history: { role: 'user' | 'assistant', content: string }[],
  message: string,
  profile: UserProfile
) {
  const systemInstruction = `
    You are Vitalis AI, a scientific, educational, and motivational digital nutritionist.
    Your tone is high-performance, clinical yet accessible. 
    You break objections about digestibility and taste with scientific facts.
    Athlete profile: ${JSON.stringify(profile)}.
    Always focus on performance and modern health aesthetics. Avoid cliché green "eco" talk; focus on "bio-optimization".
  `;

  try {
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction,
      }
    });

    // History mapping if needed, but let's keep it simple for now or use sendMessage
    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Chat Error:", error);
    return "Desculpe, tive um problema na conexão neural. Como posso ajudar na sua performance hoje?";
  }
}
