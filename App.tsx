
import React, { useState } from 'react';
import { StageInput } from './components/StageInput';
import { StageStory } from './components/StageStory';
import { StageVisuals } from './components/StageVisuals';
import { StageResult } from './components/StageResult';
import { HistoryModal } from './components/HistoryModal';
import { generateStoryScript } from './services/geminiService';
import { saveStoryToHistory } from './services/storageService';
import { StoryData, AppStep, Scene } from './types';
import { History as HistoryIcon } from 'lucide-react';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT);
  const [isLoading, setIsLoading] = useState(false);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Step 1: Handle User Idea Input -> Generate Text Story
  const handleIdeaSubmit = async (idea: string, style: string, frameCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generateStoryScript(idea, frameCount, style);
      setStoryData(data);
      saveStoryToHistory(data); // Save initial script
      setStep(AppStep.REFINEMENT);
    } catch (err: any) {
      // Show the actual error message from the service
      let errorMessage = "生成失败";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Add helpful context for common errors
      if (errorMessage.includes("API Key is missing")) {
        errorMessage = "配置错误: 找不到 API Key。请在 Vercel 环境变量中添加 API_KEY 并重新部署。";
      } else if (errorMessage.includes("429")) {
        errorMessage = "配额超限 (429): API 调用过于频繁，请稍后再试。";
      } else if (errorMessage.includes("503")) {
        errorMessage = "服务繁忙 (503): Google AI 服务暂时不可用，请稍后重试。";
      }

      setError(errorMessage);
      console.error("Full Error Object:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Story Updates during Refinement Stage
  const handleStoryUpdate = (updatedStory: StoryData) => {
    setStoryData(updatedStory);
    saveStoryToHistory(updatedStory);
  };

  // Step 2: Confirm Story -> Start Visual Generation
  const handleStoryConfirmed = () => {
    setStep(AppStep.GENERATION);
  };

  // Step 3: Visual Generation Complete -> Show Result
  const handleGenerationComplete = (updatedStory: StoryData) => {
    // Save locally
    saveStoryToHistory(updatedStory);
    
    // Add a small delay for the user to see the completion state
    setTimeout(() => {
        setStoryData(updatedStory);
        setStep(AppStep.RESULT);
    }, 1500);
  };

  // Handle individual scene updates (e.g. regeneration)
  const handleUpdateScene = (index: number, newScene: Scene) => {
    if (!storyData) return;
    const newScenes = [...storyData.scenes];
    newScenes[index] = newScene;
    
    const updatedStory = { ...storyData, scenes: newScenes };
    setStoryData(updatedStory);
    saveStoryToHistory(updatedStory); // Auto-save updates
  };

  // Reset App
  const handleReset = () => {
    setStoryData(null);
    setStep(AppStep.INPUT);
    setError(null);
  };

  // Back from Result to Story (Step 4 -> Step 2)
  const handleBackToStory = () => {
    setStep(AppStep.REFINEMENT);
  };

  // Load from History
  const handleLoadHistory = (story: StoryData) => {
    setStoryData(story);
    setIsHistoryOpen(false);
    
    // Determine which step to jump to based on data completeness
    const hasImages = story.scenes.some(s => s.imageStatus === 'success');
    if (hasImages) {
        setStep(AppStep.RESULT);
    } else {
        setStep(AppStep.REFINEMENT);
    }
  };

  // Navigation Handler
  const handleStepNavigation = (targetStep: AppStep) => {
    if (step === targetStep) return;

    // 1. Input (Start Over logic)
    if (targetStep === AppStep.INPUT) {
        if (storyData) {
            if (window.confirm("返回创意阶段将开始新的创作，当前进度已保存到历史记录。\n确定要返回吗？")) {
                handleReset();
            }
        } else {
            setStep(AppStep.INPUT);
        }
        return;
    }

    // For other steps, require storyData
    if (!storyData) {
        return;
    }

    setStep(targetStep);
  };

  return (
    <div className="min-h-screen bg-cinema-900 text-slate-100 font-sans selection:bg-cinema-accent selection:text-white">
      {/* Top Navigation / Branding */}
      <nav className="border-b border-cinema-800 bg-cinema-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleStepNavigation(AppStep.INPUT)}
          >
            <div className="w-8 h-8 bg-cinema-accent rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
              Z
            </div>
            <span className="font-bold text-xl tracking-tight">ZQL的智能分镜设计 <span className="text-xs font-normal text-slate-500 border border-slate-600 px-1 rounded ml-1">Free</span></span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
               <button 
                 onClick={() => handleStepNavigation(AppStep.INPUT)}
                 className={`flex items-center gap-2 transition hover:text-white ${step >= AppStep.INPUT ? 'text-cinema-accent' : ''}`}
               >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">1</span>
                  创意
               </button>
               <div className="w-8 h-[1px] bg-cinema-800"></div>
               
               <button 
                 onClick={() => handleStepNavigation(AppStep.REFINEMENT)}
                 disabled={!storyData}
                 className={`flex items-center gap-2 transition hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${step >= AppStep.REFINEMENT ? 'text-cinema-accent' : ''}`}
               >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">2</span>
                  脚本
               </button>
               <div className="w-8 h-[1px] bg-cinema-800"></div>
               
               <button 
                 onClick={() => handleStepNavigation(AppStep.GENERATION)}
                 disabled={!storyData}
                 className={`flex items-center gap-2 transition hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${step >= AppStep.GENERATION ? 'text-cinema-accent' : ''}`}
               >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">3</span>
                  绘图
               </button>
               <div className="w-8 h-[1px] bg-cinema-800"></div>
               
               <button 
                 onClick={() => handleStepNavigation(AppStep.RESULT)}
                 disabled={!storyData}
                 className={`flex items-center gap-2 transition hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${step === AppStep.RESULT ? 'text-cinema-gold' : ''}`}
               >
                  <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">4</span>
                  完成
               </button>
            </div>

            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cinema-800 hover:bg-cinema-700 text-slate-300 hover:text-white transition border border-cinema-700"
            >
                <HistoryIcon className="w-4 h-4" />
                <span className="hidden sm:inline">历史记录</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg flex flex-col items-center justify-center text-center">
             <span className="font-bold mb-1 text-red-400">出错了</span>
             <span>{error}</span>
          </div>
        )}

        {step === AppStep.INPUT && (
          <StageInput onNext={handleIdeaSubmit} isLoading={isLoading} />
        )}

        {step === AppStep.REFINEMENT && storyData && (
          <StageStory 
            storyData={storyData} 
            onUpdate={handleStoryUpdate}
            onConfirm={handleStoryConfirmed} 
            onBack={() => setStep(AppStep.INPUT)} 
          />
        )}

        {step === AppStep.GENERATION && storyData && (
          <StageVisuals 
            storyData={storyData} 
            onComplete={handleGenerationComplete} 
          />
        )}

        {step === AppStep.RESULT && storyData && (
          <StageResult 
            storyData={storyData} 
            onReset={handleReset} 
            onBack={handleBackToStory}
            onUpdateScene={handleUpdateScene}
          />
        )}
      </main>

      {/* History Modal */}
      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        onLoad={handleLoadHistory} 
      />
    </div>
  );
}

export default App;
