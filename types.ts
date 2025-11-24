
export enum AppStep {
  INPUT = 0,
  REFINEMENT = 1,
  GENERATION = 2,
  RESULT = 3,
}

export interface Character {
  name: string;
  description_cn: string;
  visual_prompt_en: string;
}

export interface Location {
  name: string;
  description_cn: string;
  visual_prompt_en: string;
}

export interface Scene {
  scene_number: number;
  description_cn: string;
  visual_prompt_en: string;
  imageUrl?: string;
  imageStatus: 'pending' | 'loading' | 'success' | 'error';
}

export interface StoryData {
  id: string;
  createdAt: number;
  title: string;
  genre: string;
  logline: string;
  style: string; 
  characters: Character[];
  locations: Location[]; // Added for background consistency
  scenes: Scene[];
}

export interface GenerationConfig {
  apiKey: string;
}
