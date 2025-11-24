
import React from 'react';
import { StoryData, Scene, Character, Location } from '../types';
import { ArrowRight, Film, Users, Pencil, MapPin } from 'lucide-react';

interface StageStoryProps {
  storyData: StoryData;
  onUpdate: (data: StoryData) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const StageStory: React.FC<StageStoryProps> = ({ storyData, onUpdate, onConfirm, onBack }) => {

  const handleFieldChange = (field: keyof StoryData, value: string) => {
    onUpdate({ ...storyData, [field]: value });
  };

  const handleCharacterChange = (index: number, field: keyof Character, value: string) => {
    const newChars = [...storyData.characters];
    newChars[index] = { ...newChars[index], [field]: value };
    onUpdate({ ...storyData, characters: newChars });
  };

  const handleLocationChange = (index: number, field: keyof Location, value: string) => {
    const newLocs = [...(storyData.locations || [])];
    newLocs[index] = { ...newLocs[index], [field]: value };
    onUpdate({ ...storyData, locations: newLocs });
  };

  const handleSceneChange = (index: number, field: keyof Scene, value: string) => {
    const newScenes = [...storyData.scenes];
    newScenes[index] = { ...newScenes[index], [field]: value };
    onUpdate({ ...storyData, scenes: newScenes });
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">脚本概览</h2>
          <p className="text-slate-400 flex items-center gap-2 text-sm md:text-base">
             <Pencil className="w-4 h-4" /> 修改下方的设定（角色、场景）以确保分镜的一致性
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition">
            返回创意
          </button>
          <button 
            onClick={onConfirm}
            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cinema-accent text-white font-semibold hover:bg-blue-600 transition shadow-lg shadow-blue-900/50"
          >
            生成视觉画面 <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-cinema-800/50 rounded-2xl border border-cinema-700 p-8 mb-8 backdrop-blur-sm">
        
        {/* Story Metadata */}
        <div className="flex flex-col md:flex-row gap-8 mb-8 border-b border-cinema-700 pb-8">
            <div className="md:w-1/3 space-y-4">
                <div>
                    <span className="text-xs font-bold text-cinema-accent uppercase tracking-wider block mb-1">标题 (Title)</span>
                    <input
                        type="text"
                        value={storyData.title}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="w-full bg-black/20 border border-cinema-700 rounded p-2 text-white font-serif text-xl focus:border-cinema-accent focus:outline-none transition"
                    />
                </div>
                <div>
                    <span className="text-xs font-bold text-cinema-accent uppercase tracking-wider block mb-1">类型 (Genre)</span>
                    <input
                        type="text"
                        value={storyData.genre}
                        onChange={(e) => handleFieldChange('genre', e.target.value)}
                        className="w-full bg-black/20 border border-cinema-700 rounded p-2 text-slate-300 focus:border-cinema-accent focus:outline-none transition"
                    />
                </div>
            </div>
            <div className="md:w-2/3">
                 <span className="text-xs font-bold text-cinema-accent uppercase tracking-wider block mb-1">故事梗概 (Logline)</span>
                 <textarea
                    value={storyData.logline}
                    onChange={(e) => handleFieldChange('logline', e.target.value)}
                    rows={4}
                    className="w-full bg-black/20 border border-cinema-700 rounded p-3 text-lg text-slate-200 leading-relaxed font-serif italic focus:border-cinema-accent focus:outline-none transition resize-none"
                 />
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            {/* Character Bible Section */}
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-cinema-gold" /> 角色设定 (Characters)
                </h3>
                <div className="space-y-4">
                    {storyData.characters && storyData.characters.map((char: Character, idx: number) => (
                        <div key={idx} className="bg-cinema-900/60 p-4 rounded-xl border border-cinema-700 hover:border-cinema-500 transition">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-cinema-700 flex items-center justify-center text-cinema-gold font-bold shrink-0">
                                    {char.name.charAt(0)}
                                </div>
                                <input 
                                    type="text"
                                    value={char.name}
                                    onChange={(e) => handleCharacterChange(idx, 'name', e.target.value)}
                                    className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cinema-accent focus:outline-none w-full"
                                    placeholder="Character Name"
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="text-[10px] text-slate-500 uppercase font-bold">Visual Prompt (EN)</label>
                                <textarea
                                    value={char.visual_prompt_en}
                                    onChange={(e) => handleCharacterChange(idx, 'visual_prompt_en', e.target.value)}
                                    className="w-full bg-black/40 border border-slate-800 rounded p-2 text-xs text-slate-400 font-mono focus:border-cinema-accent focus:outline-none resize-none"
                                    rows={3}
                                    placeholder="Describe hair, clothes, accessories..."
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Location Bible Section */}
            <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-500" /> 场景设定 (Locations)
                </h3>
                <div className="space-y-4">
                    {storyData.locations && storyData.locations.length > 0 ? (
                        storyData.locations.map((loc: Location, idx: number) => (
                            <div key={idx} className="bg-cinema-900/60 p-4 rounded-xl border border-cinema-700 hover:border-emerald-500/50 transition">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-cinema-700 flex items-center justify-center text-emerald-500 font-bold shrink-0">
                                        L
                                    </div>
                                    <input 
                                        type="text"
                                        value={loc.name}
                                        onChange={(e) => handleLocationChange(idx, 'name', e.target.value)}
                                        className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-emerald-500 focus:outline-none w-full"
                                        placeholder="Location Name"
                                    />
                                </div>
                                
                                <div className="mb-3">
                                    <label className="text-[10px] text-slate-500 uppercase font-bold">Visual Prompt (EN)</label>
                                    <textarea
                                        value={loc.visual_prompt_en}
                                        onChange={(e) => handleLocationChange(idx, 'visual_prompt_en', e.target.value)}
                                        className="w-full bg-black/40 border border-slate-800 rounded p-2 text-xs text-slate-400 font-mono focus:border-emerald-500 focus:outline-none resize-none"
                                        rows={3}
                                        placeholder="Describe environment, lighting, atmosphere..."
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-slate-500 text-sm p-4 border border-dashed border-slate-700 rounded-lg text-center">
                            未生成特定场景设定
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Scenes Section */}
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-cinema-gold" /> 分场列表 (Scenes)
            </h3>
            <div className="grid gap-4">
                {storyData.scenes.map((scene: Scene, idx) => (
                    <div key={scene.scene_number} className="bg-cinema-900/80 p-5 rounded-xl border border-cinema-700 hover:border-cinema-500 transition group">
                        <div className="flex justify-between items-start mb-3">
                            <span className="bg-cinema-700 text-cinema-gold text-xs font-bold px-2 py-1 rounded">
                                SCENE {scene.scene_number}
                            </span>
                        </div>
                        
                        <div className="mb-4">
                            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Action Description</label>
                            <textarea 
                                value={scene.description_cn}
                                onChange={(e) => handleSceneChange(idx, 'description_cn', e.target.value)}
                                className="w-full bg-transparent border-l-2 border-slate-700 pl-3 text-slate-300 focus:border-cinema-accent focus:outline-none resize-none py-1 hover:bg-white/5 transition rounded-r"
                                rows={2}
                            />
                        </div>

                        <div className="bg-black/40 p-3 rounded border border-slate-800">
                            <label className="block text-[10px] text-slate-500 font-bold mb-1">IMAGE GENERATION PROMPT (EN)</label>
                            <textarea 
                                value={scene.visual_prompt_en}
                                onChange={(e) => handleSceneChange(idx, 'visual_prompt_en', e.target.value)}
                                className="w-full bg-transparent text-xs text-slate-400 font-mono focus:text-white focus:outline-none resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
