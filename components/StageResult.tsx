import React, { useState } from 'react';
import { StoryData, Scene } from '../types';
import { generateSceneImage } from '../services/geminiService';
import { Download, Film, Users, RefreshCw, Maximize2, X, ArrowLeft, Loader2, Edit3, FileJson, Printer, MapPin, FileText, FileArchive } from 'lucide-react';
import * as docx from "docx";
import JSZip from "jszip";

const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType, BorderStyle } = docx;

interface StageResultProps {
  storyData: StoryData;
  onReset: () => void;
  onBack: () => void;
  onUpdateScene: (index: number, newScene: Scene) => void;
}

export const StageResult: React.FC<StageResultProps> = ({ storyData, onReset, onBack, onUpdateScene }) => {
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  // State for editing prompts
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>("");

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const fileName = `${storyData.title || 'storyboard'}_${new Date().toISOString().split('T')[0]}.json`;
    const json = JSON.stringify(storyData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleDownloadZIP = async () => {
    setIsZipping(true);
    try {
        const zip = new JSZip();
        // Create a folder for images
        const imgFolder = zip.folder("images");

        let count = 0;
        storyData.scenes.forEach((scene) => {
            if (scene.imageUrl && scene.imageStatus === 'success') {
                // Extract base64 data (remove "data:image/png;base64," prefix)
                const base64Data = scene.imageUrl.split(',')[1];
                if (base64Data) {
                    const fileName = `scene_${scene.scene_number.toString().padStart(2, '0')}.png`;
                    imgFolder?.file(fileName, base64Data, { base64: true });
                    count++;
                }
            }
        });

        if (count === 0) {
            alert("没有可下载的图片。");
            return;
        }

        // Also add the script as a text file
        const scriptContent = storyData.scenes.map(s => 
            `Scene ${s.scene_number}\nAction: ${s.description_cn}\nPrompt: ${s.visual_prompt_en}\n`
        ).join('\n-------------------\n');
        
        zip.file("script.txt", scriptContent);

        // Generate the ZIP file
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger download
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${storyData.title || 'storyboard'}_images.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Failed to generate ZIP:", error);
        alert("打包下载失败，请稍后重试。");
    } finally {
        setIsZipping(false);
    }
  };

  const getImageDimensions = (base64: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 500, height: 500 }); // Fallback
    });
  };

  const handleDownloadWord = async () => {
    setIsGeneratingWord(true);
    try {
      const base64ToUint8Array = (base64: string) => {
        try {
          const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return bytes;
        } catch (e) {
          console.error("Error converting base64 image", e);
          return null;
        }
      };

      const children = [];

      // --- Title Page ---
      children.push(
        new Paragraph({
          text: storyData.title || "Storyboard Project",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Genre: ${storyData.genre || "N/A"}`, italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
        }),
        new Paragraph({
          children: [new TextRun({ text: storyData.logline || "No logline provided.", italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // --- Character Bible ---
      if (storyData.characters && storyData.characters.length > 0) {
        children.push(
          new Paragraph({
            text: "Character Bible",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
        for (const char of storyData.characters) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: char.name, bold: true, size: 28 }),
                new TextRun({ text: ` - ${char.description_cn}`, size: 24 }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Visual: ${char.visual_prompt_en}`, italics: true, color: "666666", size: 20 })],
              spacing: { after: 200 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" } }
            })
          );
        }
      }

      // --- Location Bible ---
      if (storyData.locations && storyData.locations.length > 0) {
        children.push(
          new Paragraph({
            text: "Location Bible",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        );
        for (const loc of storyData.locations) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: loc.name, bold: true, size: 28 }),
                new TextRun({ text: ` - ${loc.description_cn}`, size: 24 }),
              ],
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Visual: ${loc.visual_prompt_en}`, italics: true, color: "666666", size: 20 })],
              spacing: { after: 200 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" } }
            })
          );
        }
      }

      // --- Scenes ---
      children.push(
        new Paragraph({
          text: "Storyboard Scenes",
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          spacing: { before: 400, after: 200 },
        })
      );

      for (const scene of storyData.scenes) {
        children.push(
          new Paragraph({
            text: `Scene ${scene.scene_number}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          })
        );

        // Image
        if (scene.imageUrl && scene.imageStatus === 'success') {
          const imageBytes = base64ToUint8Array(scene.imageUrl);
          if (imageBytes) {
            // Get original dimensions to preserve aspect ratio
            const dimensions = await getImageDimensions(scene.imageUrl);
            
            // Calculate dimensions fitting within page width (approx 600px for A4 margins)
            const MAX_WIDTH = 550;
            const scaleFactor = Math.min(MAX_WIDTH / dimensions.width, 1); // Only scale down, never up
            const displayWidth = dimensions.width * scaleFactor;
            const displayHeight = dimensions.height * scaleFactor;

            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageBytes,
                    transformation: { width: displayWidth, height: displayHeight },
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              })
            );
          }
        }

        // Description
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: "Action: ", bold: true }),
              new TextRun({ text: scene.description_cn }),
            ],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Visual Prompt: ", bold: true, size: 18, color: "666666" }),
              new TextRun({ text: scene.visual_prompt_en, size: 18, color: "666666" }),
            ],
            spacing: { after: 400 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "EEEEEE" } }
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${storyData.title || 'storyboard'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Failed to generate Word doc:", error);
      alert("生成 Word 文档失败，请稍后重试。");
    } finally {
      setIsGeneratingWord(false);
    }
  };

  const handleStartEdit = (index: number, currentPrompt: string) => {
    setEditingIndex(index);
    setEditPrompt(currentPrompt);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditPrompt("");
  };

  const handleRegenerate = async (index: number, promptOverride?: string) => {
    if (regeneratingIndex !== null) return; 

    const promptToUse = promptOverride || storyData.scenes[index].visual_prompt_en;
    
    setRegeneratingIndex(index);
    setEditingIndex(null); // Ensure edit mode is closed

    // Optimistic update: Set status to loading and update prompt text immediately
    const sceneStart: Scene = {
        ...storyData.scenes[index],
        visual_prompt_en: promptToUse,
        imageStatus: 'loading' as const
    };
    onUpdateScene(index, sceneStart);

    try {
        // PASSING STYLE HERE
        const newImageUrl = await generateSceneImage(promptToUse, storyData.style);
        const updatedScene: Scene = {
            ...sceneStart,
            imageUrl: newImageUrl,
            imageStatus: 'success' as const
        };
        onUpdateScene(index, updatedScene);
    } catch (e) {
        console.error("Failed to regenerate", e);
        const errorScene: Scene = {
            ...sceneStart,
            imageStatus: 'error' as const
        };
        onUpdateScene(index, errorScene);
    } finally {
        setRegeneratingIndex(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 print:text-black print:max-w-none">
      
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 rounded-full hover:bg-cinema-800 text-slate-400 hover:text-white transition"
                title="返回上一页"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Film className="text-cinema-accent" /> 分镜设计完成
            </h2>
        </div>
        
        <div className="flex gap-3">
          <button onClick={onReset} className="px-4 py-2 text-slate-300 hover:text-white transition">
            创建新项目
          </button>
          
          {/* Export Actions */}
          <div className="flex items-center bg-cinema-800 p-1 rounded-lg border border-cinema-700">
            <button 
                onClick={handleDownloadJSON}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition text-sm"
                title="保存源文件 (JSON)"
            >
                <FileJson className="w-4 h-4" /> JSON
            </button>
            <div className="w-px h-4 bg-cinema-600 mx-1"></div>
            
            <button 
                onClick={handleDownloadWord}
                disabled={isGeneratingWord}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition text-sm disabled:opacity-50"
                title="导出 Word 文档"
            >
                {isGeneratingWord ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Word
            </button>
            <div className="w-px h-4 bg-cinema-600 mx-1"></div>

            <button 
                onClick={handleDownloadZIP}
                disabled={isZipping}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition text-sm disabled:opacity-50"
                title="下载所有图片 (ZIP)"
            >
                {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
                ZIP
            </button>
            <div className="w-px h-4 bg-cinema-600 mx-1"></div>

             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition text-sm"
                title="打印或保存 PDF"
            >
                <Printer className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Content (Printable Area) */}
      <div className="bg-white text-slate-900 rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
        
        {/* Title Page / Header */}
        <div className="bg-slate-900 text-white p-12 text-center print:bg-white print:text-black print:border-b-2 print:border-black">
          <span className="inline-block py-1 px-3 border border-slate-500 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-cinema-gold print:text-black print:border-black">
            STORYBOARD
          </span>
          <h1 className="text-5xl font-serif font-bold mb-4">{storyData.title}</h1>
          <p className="text-xl text-slate-300 italic mb-6 print:text-slate-600">"{storyData.logline}"</p>
          <div className="flex justify-center gap-8 text-sm font-mono text-slate-400 print:text-black">
            <span>GENRE: {storyData.genre}</span>
            <span>STYLE: {storyData.style || 'Cinematic'}</span>
            <span>SCENES: {storyData.scenes.length}</span>
            <span>DATE: {new Date(storyData.createdAt).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* Visual Bibles (Characters & Locations) Print View */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200 print:border-black">
            {/* Characters */}
            {storyData.characters && (
                <div className="p-8 bg-slate-50 border-r border-slate-200 print:bg-white print:border-black">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2 print:text-black">
                        <Users className="w-4 h-4" /> Characters
                    </h3>
                    <div className="space-y-4">
                        {storyData.characters.map((char, idx) => (
                            <div key={idx} className="bg-white p-4 rounded border border-slate-200 print:border-black">
                                <strong className="block text-lg mb-1">{char.name}</strong>
                                <p className="text-sm text-slate-600 mb-2">{char.description_cn}</p>
                                <p className="text-xs text-slate-400 italic border-t pt-2 mt-2">"{char.visual_prompt_en}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Locations */}
            {storyData.locations && storyData.locations.length > 0 && (
                <div className="p-8 bg-slate-50 print:bg-white">
                    <h3 className="text-lg font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2 print:text-black">
                        <MapPin className="w-4 h-4" /> Locations
                    </h3>
                    <div className="space-y-4">
                        {storyData.locations.map((loc, idx) => (
                            <div key={idx} className="bg-white p-4 rounded border border-slate-200 print:border-black">
                                <strong className="block text-lg mb-1">{loc.name}</strong>
                                <p className="text-sm text-slate-600 mb-2">{loc.description_cn}</p>
                                <p className="text-xs text-slate-400 italic border-t pt-2 mt-2">"{loc.visual_prompt_en}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Storyboard Grid */}
        <div className="p-8 bg-slate-100 print:bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-12">
            {storyData.scenes.map((scene, index) => (
              <div key={scene.scene_number} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 break-inside-avoid print:shadow-none print:border-black print:border">
                
                {/* Visual Frame with Hover Actions */}
                <div className="aspect-video w-full bg-slate-200 mb-4 rounded overflow-hidden border border-slate-300 print:border-black relative group">
                  {scene.imageUrl ? (
                    <>
                        <img src={scene.imageUrl} alt={`Scene ${scene.scene_number}`} className="w-full h-full object-cover" />
                        
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 print:hidden">
                            <button 
                                onClick={() => setZoomedImage(scene.imageUrl || null)}
                                className="p-3 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full text-white transition transform hover:scale-110"
                                title="放大预览"
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleStartEdit(index, scene.visual_prompt_en)}
                                className="p-3 bg-white/20 backdrop-blur hover:bg-white/40 rounded-full text-white transition transform hover:scale-110"
                                title="编辑 Prompt"
                            >
                                <Edit3 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => handleRegenerate(index)}
                                className="p-3 bg-cinema-accent hover:bg-blue-600 rounded-full text-white transition transform hover:scale-110 shadow-lg"
                                title="重新生成"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        {scene.imageStatus === 'loading' ? '生成中...' : 'No Image'}
                    </div>
                  )}
                  
                  {/* Regenerating Spinner Overlay (Active when loading) */}
                  {scene.imageStatus === 'loading' && (
                      <div className="absolute inset-0 bg-black/70 z-20 flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-8 h-8 animate-spin text-cinema-accent mb-2" />
                          <span className="text-xs font-bold">绘制中...</span>
                      </div>
                  )}

                  <div className="absolute top-0 left-0 bg-black text-white px-3 py-1 text-sm font-bold print:bg-black print:text-white z-10 pointer-events-none">
                    {scene.scene_number}
                  </div>
                </div>

                {/* Script Info */}
                <div className="space-y-3">
                  <div className="flex gap-4 text-xs font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100 pb-2 mb-2 print:text-black print:border-black">
                    <span>Action</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed font-medium min-h-[60px]">
                    {scene.description_cn}
                  </p>
                  
                  <div className="pt-2">
                    {editingIndex === index ? (
                        <div className="bg-slate-100 p-3 rounded border border-cinema-accent/50 shadow-inner animate-in fade-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-cinema-accent block mb-1">Edit Visual Prompt:</label>
                            <textarea
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                className="w-full text-xs p-2 border border-slate-300 rounded mb-2 text-slate-700 focus:ring-2 focus:ring-cinema-accent outline-none font-mono bg-white"
                                rows={4}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={handleCancelEdit}
                                    className="py-1 px-3 text-xs font-medium text-slate-500 hover:bg-slate-200 rounded transition"
                                >
                                    取消
                                </button>
                                <button 
                                    onClick={() => handleRegenerate(index, editPrompt)}
                                    className="flex items-center gap-1 py-1 px-3 text-xs font-bold bg-cinema-accent text-white rounded hover:bg-blue-600 shadow-sm transition"
                                >
                                   <RefreshCw className="w-3 h-3" /> 确认并重绘
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="group/prompt relative">
                            <p className="text-[10px] text-slate-400 font-mono leading-tight print:text-slate-500">
                                <span className="font-bold text-slate-500">Visual Notes:</span> {scene.visual_prompt_en}
                            </p>
                        </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 p-6 text-center text-slate-400 text-sm border-t border-slate-200 print:hidden">
          Generated by ZQL's Storyboard Design
        </div>
      </div>

      {/* Zoom Modal */}
      {zoomedImage && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
            onClick={() => setZoomedImage(null)}
          >
              <button 
                className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
                onClick={() => setZoomedImage(null)}
              >
                  <X className="w-8 h-8" />
              </button>
              <img 
                src={zoomedImage} 
                alt="Zoomed View" 
                className="max-w-full max-h-full rounded shadow-2xl border border-slate-800"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
              />
          </div>
      )}
    </div>
  );
};