import React, { useState, useEffect } from 'react';
import { X, Globe, Link, Copy, Check, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { GeneratedArtifact } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  artifact: GeneratedArtifact;
  projectName: string;
  pageName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  artifact,
  projectName,
  pageName
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Mock URL generation
  const mockUrl = `https://kpc-forge.app/s/${Math.random().toString(36).substring(2, 8)}`;

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setIsPublishing(false);
      setIsPublished(false);
      setCopied(false);
    }
  }, [isOpen]);

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate network request
    setTimeout(() => {
      setIsPublishing(false);
      setIsPublished(true);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mockUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLive = () => {
     if (!artifact.code) return;
     const blob = new Blob([artifact.code], { type: 'text/html' });
     const url = URL.createObjectURL(blob);
     window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-[#0F172A]">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Share2 size={18} className="text-blue-400" />
            发布与分享
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Project</p>
                <p className="text-base text-slate-200 font-medium">{projectName} / {pageName}</p>
            </div>

            {!isPublished ? (
                <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 p-6 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                        <Globe className="text-slate-400" size={24} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-slate-200 font-medium">发布到 Web</h4>
                        <p className="text-sm text-slate-500">生成一个公共链接，允许其他人浏览此页面。</p>
                    </div>
                    <button 
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>正在发布...</span>
                            </>
                        ) : (
                            <span>发布页面</span>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                            <Check size={16} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-400">发布成功</p>
                            <p className="text-xs text-green-500/70">任何人都可以通过链接访问。</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 font-medium">公开链接</label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 flex items-center gap-2">
                                <Link size={14} className="text-slate-500" />
                                <input 
                                    type="text" 
                                    value={mockUrl} 
                                    readOnly 
                                    className="bg-transparent text-sm text-slate-300 w-full outline-none"
                                />
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                                title="复制链接"
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                         <button 
                            onClick={handleOpenLive}
                            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <ExternalLink size={16} />
                            <span>在浏览器新标签页中打开</span>
                        </button>
                        <p className="text-[10px] text-center text-slate-500 mt-2">
                            (此功能将在新标签页中预览当前代码)
                        </p>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default ShareModal;