
import { GoogleGenAI, Type, Schema, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { StoryData } from "../types";

const getClient = () => {
  // The API key must be obtained exclusively from the environment variable process.env.API_KEY.
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key not found in process.env");
    throw new Error("API Key is missing. Please check Vercel Environment Variables.");
  }
  
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
          name: { type: Type.STRING, description: "Character name (e.g., 'Li Ming')" },
          description_cn: { type: Type.STRING, description: "Brief personality and role description in Chinese." },
          visual_prompt_en: { type: Type.STRING, description: "A highly detailed physical description in English. Start with 'A [age] [gender]...'. Include hair style/color, clothing details, and distinctive features. This string will be reused for every scene to ensure consistency." }
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
          name: { type: Type.STRING, description: "Location name (e.g., 'Cyberpunk Street')" },
          description_cn: { type: Type.STRING, description: "Brief description in Chinese." },
          visual_prompt_en: { type: Type.STRING, description: "Detailed visual description of the environment in English (lighting, colors, key elements). This will be reused for scenes in this location." }
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
          character_names: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING }, 
            description: "EXACT names of characters from the 'characters' list that appear in this scene." 
          },
          location_name: { 
            type: Type.STRING, 
            description: "EXACT name of the location from the 'locations' list where this scene takes place." 
          },
          visual_prompt_en: { 
            type: Type.STRING, 
            description: "Description of the ACTION, POSE, EMOTION, and CAMERA ANGLE for this specific shot in English. Do NOT repeat the full character/location physical details here, as they will be automatically appended." 
          },
        },
        required: ["scene_number", "description_cn", "visual_prompt_en", "character_names", "location_name"],
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
    
    CRITICAL CONSISTENCY INSTRUCTION:
    - In the 'scenes' array, you MUST correctly identify which 'character_names' and 'location_name' are present.
    - The 'visual_prompt_en' for the scene should focus on WHAT IS HAPPENING (Action, Composition, Lighting) rather than re-describing the character's outfit.
    
    Example Logic:
    - Character: "A girl with pink hair in a silver spacesuit."
    - Scene Action: "Running towards camera, panicked expression. Low angle."
    - (The system will combine these to generate the image).
    
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
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      },
    });

    let text = response.text;
    if (!text) throw new Error("AI returned an empty response. Likely a safety block.");
    
    // Robust JSON extraction
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
        text = match[1];
    } else {
        const firstOpen = text.indexOf('{');
        const lastClose = text.lastIndexOf('}');
        if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
            text = text.substring(firstOpen, lastClose + 1);
        }
    }
    
    let data: Partial<StoryData>;
    try {
        data = JSON.parse(text) as Partial<StoryData>;
    } catch (e) {
        console.error("JSON Parse Error. Raw Text:", text);
        throw new Error("Failed to parse AI response. The model might be overloaded.");
    }
    
    const completeData: StoryData = {
        ...data,
        id: Date.now().toString(),
        createdAt: Date.now(),
        style: style,
        locations: data.locations || [], 
    } as StoryData;

    return completeData;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateSceneImage = async (visualPrompt: string, style?: string): Promise<string> => {
  const ai = getClient();
  
  // We expect the 'visualPrompt' to be a fully composed prompt (Style + Location + Character + Action)
  // But we add a safety wrapper just in case.
  const finalPrompt = `(Art Style: ${style || 'Cinematic'}). ${visualPrompt}. High quality, 8k resolution, highly detailed, cinematic composition.`;

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
