import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStorySegment = async (level: number, type: 'start' | 'gameover'): Promise<string> => {
  try {
    const model = 'gemini-3-flash-preview';
    
    let prompt = "";
    if (type === 'start') {
      if (level === 1) {
        prompt = `
          Context: A game where a hero defends a collapsed house with three broken pillars against evil vines.
          Task: Write a very short (max 2 sentences), atmospheric intro describing Pillar 1 cracking, the house collapsing, and the first vines emerging.
          Tone: Suspenseful, dark fantasy.
        `;
      } else {
        prompt = `
          Context: A game where a hero fights evil vines in ruins. The player just reached Level ${level}.
          Task: Write a very short (1 sentence), menacing description of how the vines are mutating, getting faster, or the atmosphere is getting darker.
          Tone: Intense.
        `;
      }
    } else {
      prompt = `
        Context: The hero was caught by the evil vines in the ruins of the three pillars.
        Task: Write a short (1 sentence) "Game Over" message mocking the player's failure.
        Tone: Dark, slightly mocking.
      `;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "The vines writhe in the darkness...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return type === 'start' 
      ? "The ruins are silent. The vines approach." 
      : "You have been consumed by the green abyss.";
  }
};