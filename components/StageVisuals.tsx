
import React, { useEffect, useState, useRef } from 'react';
import { StoryData, Scene } from '../types';
import { generateSceneImage } from '../services/geminiService';
import { Loader2, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface StageVisualsProps {
  storyData: StoryData;
  onComplete: (updatedStory: StoryData) => void;
}

export const StageVisuals: React.FC<StageVisualsProps> = ({ storyData, onComplete }) => {
  const [scenes, setScenes] = useState<Scene[]>(storyData.scenes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const processQueue = async () => {
      if (hasStartedRef.current) return;
      hasStartedRef.current = true;

      const newScenes = [...scenes];

      // Filter for scenes that actually need generation (not success and has valid URL)
      const scenesToGenerateIndices = newScenes
        .map((s, i) => ({ ...s, originalIndex: i }))
        .filter(s => !(s.imageStatus === 'success' && s.imageUrl));

      // If all are already done, just finish immediately
      if (scenesToGenerateIndices.length === 0) {
          setIsCompleted(true);
          onComplete({ ...storyData });
          return;
      }

      for (let i = 0; i < newScenes.length; i++) {
        // Skip if already has image
        if (newScenes[i].imageStatus === 'success' && newScenes[i].imageUrl) {
            continue;
        }

        setCurrentIndex(i);
        newScenes[i] = { ...newScenes[i], imageStatus: 'loading' };
        setScenes([...newScenes]);

        let retries = 0;
        const MAX_RETRIES = 3;
        let success = false;

        while (!success && retries <= MAX_RETRIES) {
            try {
                // PASSING STYLE HERE
                const base64Image = await generateSceneImage(newScenes[i].visual_prompt_en, storyData.style);
                newScenes[i] = { 
                    ...newScenes[i], 
                    imageStatus: 'success', 
                    imageUrl: base64Image 
                };
                success = true;
            } catch (error: any) {
                console.error(`Failed to generate scene ${i + 1} (Attempt ${retries + 1})`, error);
                
                // Check for Rate Limit (429) or Resource Exhausted
                const errorMessage = JSON.stringify(error);
                const isRateLimit = errorMessage.includes('429') || 
                                    errorMessage.includes('RESOURCE_EXHAUSTED') || 
                                    errorMessage.includes('Quota exceeded');

                if (isRateLimit && retries < MAX_RETRIES) {
                    console.warn(`Rate limit hit for scene ${i + 1}. Pausing for 15s before retry...`);
                    retries++;
                    // Wait 15 seconds to let the quota window reset
                    await new Promise(resolve => setTimeout(resolve, 15000));
                } else {
                    // If it's not a rate limit, or we ran out of retries, fail this scene
                    newScenes[i] = { ...newScenes[i], imageStatus: 'error' };
                    break; // Exit retry loop
                }
            }
        }
        
        setScenes([...newScenes]);
        
        // Add a substantial delay between successful requests to avoid hitting the limit immediately again.
        // 4 seconds seems safe for free tier (approx 15 requests/min).
        await new Promise(resolve => setTimeout(resolve, 4000));
      }

      setIsCompleted(true);
      onComplete({ ...storyData, scenes: newScenes });
    };

    processQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round(((currentIndex + (isCompleted ? 1 : 0)) / scenes.length) * 100);

  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full mb-12 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">正在绘制分镜</h2>
        <p className="text-slate-400 mb-8">AI 正在根据脚本描述生成高质量的电影概念图...</p>
        
        <div className="w-full bg-cinema-800 rounded-full h-4 overflow-hidden shadow-inner max-w-xl mx-auto relative">
          <div 
            className="bg-gradient-to-r from-blue-500 to-cinema-gold h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-2 text-cinema-gold font-mono text-sm">
          {Math.min(progress, 100)}% 完成 {currentIndex > 0 && !isCompleted && '(为了防止 API 限流，生成速度可能会变慢)'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full opacity-50 pointer-events-none filter blur-sm transition-all duration-500" style={{ opacity: isCompleted ? 0 : 1, filter: isCompleted ? 'blur(10px)' : 'blur(0)' }}>
        {scenes.map((scene, idx) => (
          <div 
            key={scene.scene_number} 
            className={`
              relative rounded-xl overflow-hidden aspect-video border-2 transition-all duration-500
              ${idx === currentIndex ? 'border-cinema-gold scale-105 shadow-2xl shadow-yellow-500/20 z-10' : 'border-cinema-800 bg-cinema-900'}
            `}
          >
            {scene.imageUrl ? (
              <img src={scene.imageUrl} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4 bg-cinema-950">
                {scene.imageStatus === 'loading' ? (
                  <Loader2 className="w-8 h-8 animate-spin text-cinema-accent mb-2" />
                ) : scene.imageStatus === 'error' ? (
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 mb-2" />
                )}
                <span className="text-xs text-center line-clamp-2">{scene.description_cn.substring(0, 30)}...</span>
              </div>
            )}
            
            <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs font-bold text-white border border-white/10">
              SCENE {scene.scene_number}
            </div>

            {scene.imageStatus === 'loading' && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-cinema-accent font-bold animate-pulse">绘制中...</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-500">
           <div className="bg-cinema-800 p-8 rounded-2xl border border-cinema-600 shadow-2xl text-center max-w-md">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">生成完成!</h3>
              <p className="text-slate-300 mb-6">所有的分镜画面已经准备就绪。</p>
              <button disabled className="px-6 py-2 bg-slate-600 text-white rounded-lg animate-pulse">
                跳转中...
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
