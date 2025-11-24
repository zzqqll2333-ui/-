
import React, { useEffect, useState } from 'react';
import { StoryData } from '../types';
import { getHistory, deleteStoryFromHistory, clearAllHistory } from '../services/storageService';
import { X, Trash2, Calendar, Clock, ArrowRight, Image as ImageIcon, Loader2, Eraser } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (story: StoryData) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, onLoad }) => {
  const [history, setHistory] = useState<StoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getHistory()
        .then(data => setHistory(data))
        .catch(err => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个项目吗？此操作无法撤销。')) {
        setDeletingId(id);
        try {
            const updated = await deleteStoryFromHistory(id);
            setHistory(updated);
        } catch (error) {
            alert("删除失败，请重试");
        } finally {
            setDeletingId(null);
        }
    }
  };

  const handleClearAll = async () => {
    if (history.length === 0) return;
    if (window.confirm('确定要清空所有历史记录吗？此操作无法撤销。')) {
        setIsLoading(true);
        try {
            const updated = await clearAllHistory();
            setHistory(updated);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-cinema-900 border border-cinema-700 w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cinema-800 bg-cinema-900/50">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="text-cinema-accent" /> 历史创作记录
          </h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
                <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-1 px-3 py-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition text-sm border border-red-500/30 mr-2"
                >
                    <Eraser className="w-4 h-4" /> 清空历史
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-cinema-800 rounded-full text-slate-400 hover:text-white transition">
                <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-cinema-700 scrollbar-track-transparent">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-cinema-accent" />
              <p>加载中...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">暂无历史记录</p>
              <p className="text-sm">开始一个新的创作，它将自动出现在这里。</p>
            </div>
          ) : (
            history.map((story) => (
              <div 
                key={story.id} 
                onClick={() => onLoad(story)}
                className="group relative bg-cinema-800/50 border border-cinema-700 hover:border-cinema-accent rounded-xl p-4 transition-all hover:bg-cinema-800 cursor-pointer flex flex-col md:flex-row gap-6"
              >
                {/* Thumbnail (First generated image or placeholder) */}
                <div className="w-full md:w-48 aspect-video bg-black/40 rounded-lg overflow-hidden flex-shrink-0 border border-white/5">
                   {story.scenes.find(s => s.imageUrl) ? (
                       <img 
                        src={story.scenes.find(s => s.imageUrl)?.imageUrl} 
                        alt="Thumbnail" 
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                       />
                   ) : (
                       <div className="w-full h-full flex items-center justify-center text-slate-600">
                           <ImageIcon className="w-8 h-8" />
                       </div>
                   )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                        <div className="flex items-start justify-between mb-2">
                             <h3 className="text-xl font-bold text-white group-hover:text-cinema-accent transition">{story.title || 'Untitled Project'}</h3>
                             <span className="text-xs font-mono text-cinema-gold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                                {story.genre || 'Draft'}
                             </span>
                        </div>
                        <p className="text-slate-400 text-sm line-clamp-2 mb-3">{story.logline || 'No description available.'}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/5 pt-3 mt-auto">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> 
                                {new Date(story.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                            <span>
                                {story.scenes ? story.scenes.length : 0} Scenes
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                             <button 
                                onClick={(e) => handleDelete(e, story.id)}
                                disabled={deletingId === story.id}
                                className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition flex items-center gap-1 disabled:opacity-50"
                                title="删除此记录"
                             >
                                 {deletingId === story.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                 ) : (
                                    <Trash2 className="w-4 h-4" />
                                 )}
                                 删除
                             </button>
                             <span className="flex items-center gap-1 text-cinema-accent font-bold group-hover:translate-x-1 transition">
                                 打开 <ArrowRight className="w-3 h-3" />
                             </span>
                        </div>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
