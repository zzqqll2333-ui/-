
import React, { useState } from 'react';
import { Film, Sparkles, Palette, Layers } from 'lucide-react';

interface StageInputProps {
  onNext: (idea: string, style: string, frameCount: number) => void;
  isLoading: boolean;
}

const STYLES = [
  { id: 'Cinematic Realism', label: '电影写实', desc: 'Cinematic lighting, photorealistic, 4k' },
  { id: 'Japanese Anime', label: '日式动漫', desc: 'Anime style, Studio Ghibli inspired, vibrant' },
  { id: 'Cyberpunk', label: '赛博朋克', desc: 'Neon lights, high tech low life, futuristic' },
  { id: 'Watercolor', label: '水彩艺术', desc: 'Soft watercolor, artistic, painterly' },
  { id: 'Noir Sketch', label: '黑白草图', desc: 'Black and white, pencil sketch, noir comic' },
  { id: '3D Animation', label: '3D 动画', desc: 'Pixar style, 3D render, cute, clean' },
  { id: 'Vintage Comic', label: '美式漫画', desc: 'Bold lines, halftone patterns, retro comic book' },
  { id: 'Oil Painting', label: '印象油画', desc: 'Thick brushstrokes, impressionist style, artistic' },
  { id: 'Pixel Art', label: '像素艺术', desc: '8-bit retro game style, pixelated' },
  { id: 'Claymation', label: '粘土动画', desc: 'Stop motion, plasticine texture, playful' },
  { id: 'Ink Wash', label: '传统水墨', desc: 'Chinese ink wash painting, calligraphy style' },
  { id: 'Low Poly', label: '低多边形', desc: 'Geometric, abstract 3D, minimal' },
];

const FRAME_OPTIONS = [6, 12, 18, 24, 30];

export const StageInput: React.FC<StageInputProps> = ({ onNext, isLoading }) => {
  const [idea, setIdea] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0].id);
  const [frameCount, setFrameCount] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim()) {
      onNext(idea, selectedStyle, frameCount);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-5xl mx-auto px-4">
      <div className="mb-6 p-5 bg-cinema-800 rounded-full inline-block shadow-lg shadow-blue-500/20">
        <Film className="w-12 h-12 text-cinema-accent" />
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        ZQL的智能分镜设计
      </h1>
      
      <p className="text-slate-400 text-lg mb-8 max-w-2xl">
        输入您的创意，选择风格与篇幅，AI 将为您生成完整的电影脚本与视觉分镜图。
      </p>

      <form onSubmit={handleSubmit} className="w-full relative group text-left">
        
        {/* Input Area */}
        <div className="mb-8">
            <textarea
            className="w-full bg-cinema-800/50 border-2 border-cinema-700 rounded-2xl p-6 text-lg text-white placeholder-slate-500 focus:outline-none focus:border-cinema-accent focus:ring-4 focus:ring-blue-500/10 transition-all resize-none min-h-[120px]"
            placeholder="例如：一个机器人在赛博朋克风格的雨夜街道上发现了一只流浪猫，并决定保护它..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={isLoading}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Style Selection */}
            <div>
                <label className="flex items-center gap-2 text-slate-300 font-bold mb-3">
                    <Palette className="w-4 h-4 text-cinema-gold" /> 视觉风格 (Style)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {STYLES.map((s) => (
                        <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedStyle(s.id)}
                            className={`
                                px-3 py-2 rounded-lg text-sm border transition-all text-left flex flex-col justify-between min-h-[70px]
                                ${selectedStyle === s.id 
                                    ? 'bg-cinema-accent/20 border-cinema-accent text-white ring-1 ring-cinema-accent' 
                                    : 'bg-cinema-800/50 border-cinema-700 text-slate-400 hover:bg-cinema-800 hover:border-slate-500'
                                }
                            `}
                        >
                            <div className="font-bold">{s.label}</div>
                            <div className="text-[10px] opacity-70 leading-tight mt-1">{s.id}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Frame Count */}
            <div>
                <label className="flex items-center gap-2 text-slate-300 font-bold mb-3">
                    <Layers className="w-4 h-4 text-cinema-gold" /> 分镜数量 (Frames)
                </label>
                <div className="bg-cinema-800/50 border border-cinema-700 rounded-xl p-4 h-full flex flex-col justify-center">
                    <div className="flex justify-between mb-2 text-sm text-slate-400">
                        <span>Short (4)</span>
                        <span>Feature (30)</span>
                    </div>
                    <input 
                        type="range" 
                        min="4" 
                        max="30" 
                        step="2"
                        value={frameCount}
                        onChange={(e) => setFrameCount(parseInt(e.target.value))}
                        className="w-full h-2 bg-cinema-700 rounded-lg appearance-none cursor-pointer accent-cinema-accent mb-6"
                    />
                    <div className="flex justify-between">
                        {FRAME_OPTIONS.map(num => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => setFrameCount(num)}
                                className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center transition-all ${frameCount === num ? 'bg-cinema-accent text-white scale-110' : 'bg-cinema-900 text-slate-500 hover:bg-cinema-700'}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-6 text-center">
                        生成 {frameCount} 张关键帧分镜。数量越多，生成时间越长。
                    </p>
                </div>
            </div>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!idea.trim() || isLoading}
            className={`
              flex items-center gap-2 px-12 py-4 rounded-xl font-bold text-xl transition-all w-full md:w-auto justify-center shadow-lg
              ${!idea.trim() || isLoading 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 transform hover:-translate-y-1'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在构思剧本...
              </span>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                开始生成分镜
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
