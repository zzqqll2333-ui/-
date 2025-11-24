
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { StoryData } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Defined Schema for Story Generation with Character and Location Consistency
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the short film in Chinese." },
    genre: { type: Type.STRING, description: "The genre of the film in Chinese (e.g., Sci-Fi, Drama)." },
    logline: { type: Type.STRING, description: "A one-sentence summary of the plot in Chinese." },
    characters: {
      type: Type.ARRAY,
      description: "A list of main characters with consistent visual definitions.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Character name" },
          description_cn: { type: Type.STRING, description: "Brief personality and role description in Chinese." },
          visual_prompt_en: { type: Type.STRING, description: "A highly detailed physical description in English to be reused in every image prompt (e.g., 'A young woman with neon blue hair, wearing a worn leather jacket and silver goggles')." }
        },
        required: ["name", "description_cn", "visual_prompt_en"]
      }
    },
    locations: {
      type: Type.ARRAY,
      description: "A list of main locations/settings with consistent visual definitions.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Location name" },
          description_cn: { type: Type.STRING, description: "Brief description in Chinese." },
          visual_prompt_en: { type: Type.STRING, description: "Detailed visual description of the environment in English to be reused in every scene taking place here (e.g., 'A futuristic control room with blue holographic screens and dark metallic walls')." }
        },
        required: ["name", "description_cn", "visual_prompt_en"]
      }
    },
    scenes: {
      type: Type.ARRAY,
      description: "A list of key scenes that form the narrative arc.",
      items: {
        type: Type.OBJECT,
        properties: {
          scene_number: { type: Type.INTEGER },
          description_cn: { type: Type.STRING, description: "Detailed script description of action and dialogue in Chinese." },
          visual_prompt_en: { type: Type.STRING, description: "A highly detailed, cinematic image generation prompt in English. CRITICAL: You must construct this prompt by concatenating the defined Character visual prompt and the Location visual prompt." },
        },
        required: ["scene_number", "description_cn", "visual_prompt_en"],
      },
    },
  },
  required: ["title", "genre", "logline", "characters", "locations", "scenes"],
};

export const generateStoryScript = async (userIdea: string, frameCount: number, style: string): Promise<StoryData> => {
  const ai = getClient();
  
  const prompt = `
    You are a world-class film director and storyboard artist.
    Your goal is to create a coherent visual story where characters and backgrounds remain consistent across all frames.
    
    User Idea: "${userIdea}"
    Target: EXACTLY ${frameCount} scenes.
    Visual Style: ${style}
    
    Instructions:
    1. **Define Characters**: Create 1-3 main characters. Write a "visual_prompt_en" for each that describes their permanent features (face, hair, clothes).
    2. **Define Locations**: Create the main settings. Write a "visual_prompt_en" for each that describes the permanent background elements.
    3. **Generate Scenes**: Write the script.
    
    CRITICAL INSTRUCTION FOR SCENE PROMPTS (visual_prompt_en):
    To ensure consistency, you MUST construct the scene prompt using this structure:
    "[Style: ${style}]. [Character Visual Description]. [Action/Pose]. [Location Visual Description]. [Lighting/Camera]."
    
    - DO NOT invent new descriptions for the character or location. COPY AND PASTE the "visual_prompt_en" defined in steps 1 and 2.
    - Example: "Anime style. A boy with red spiky hair wearing a green vest. Running frantically. A dark alleyway with wet pavement and neon signs. Low angle shot."
    
    Ensure the output is valid JSON matching the schema.
    Content in Chinese (Simplified), Visual Prompts in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
        temperature: 0.7,
      },
    });

    let text = response.text;
    if (!text) throw new Error("No response from AI");
    
    if (text.trim().startsWith("```")) {
        text = text.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "");
    }
    
    const data = JSON.parse(text) as Partial<StoryData>;
    
    const completeData: StoryData = {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
        style: style,
        locations: data.locations || [], // Ensure locations array exists
    } as StoryData;

    return completeData;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateSceneImage = async (visualPrompt: string, style?: string): Promise<string> => {
  const ai = getClient();
  
  // Construct a prompt that enforces the style at the beginning
  const finalPrompt = `(Style: ${style || 'Cinematic'}) ${visualPrompt} . High quality, 8k resolution, highly detailed, cinematic composition.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: finalPrompt,
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
        throw new Error("No candidates returned from image generation service.");
    }

    if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    const textPart = candidate.content?.parts?.find(p => p.text);
    if (textPart) {
        throw new Error(`Image generation refused: ${textPart.text}`);
    }
    
    throw new Error(`No image data returned. Finish reason: ${candidate.finishReason}`);
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
