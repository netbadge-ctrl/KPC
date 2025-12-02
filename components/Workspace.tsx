import React, { useState, useEffect, useRef, memo } from 'react';
import { Code, Monitor, History, Check, Clock, LayoutTemplate, Palette, Zap, Box, Loader2, ListChecks, CheckCircle2, Terminal } from 'lucide-react';
import { PlanData, GeneratedArtifact, AppState, ArchitectPlan } from '../types';

interface WorkspaceProps {
  plan: PlanData | ArchitectPlan | null;
  generatedArtifact: GeneratedArtifact;
  history?: GeneratedArtifact[];
  onRestoreVersion?: (artifact: GeneratedArtifact) => void;
  appState?: AppState;
}

type Tab = 'preview' | 'code';

// Memoized Debounced Iframe to prevent flickering
const DebouncedPreview = memo(({ code }: { code: string }) => {
    const [debouncedCode, setDebouncedCode] = useState(code);

    useEffect(() => {
        // Immediate update for small code or initialization
        if (!code || code.length < 50) {
            setDebouncedCode(code);
            return;
        }
        const handler = setTimeout(() => {
            setDebouncedCode(code);
        }, 300); 
        return () => clearTimeout(handler);
    }, [code]);

    return (
        <iframe 
            title="Preview"
            srcDoc={debouncedCode}
            className="w-full h-full border-none"
            // Added allow-modals to support alert(), confirm() etc. in generated code
            sandbox="allow-scripts allow-modals allow-same-origin"
        />
    );
});

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#111827] text-slate-400 select-none p-6">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full group-hover:bg-blue-500/30 transition-all duration-500"></div>
                <div className="relative w-24 h-24 bg-[#1E293B] border border-slate-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-black/50 transform group-hover:-translate-y-2 transition-transform duration-300">
                     <LayoutTemplate className="w-10 h-10 text-blue-400" />
                </div>
                <div className="absolute -right-4 -top-4 w-10 h-10 bg-[#0F172A] border border-slate-700 rounded-xl flex items-center justify-center shadow-lg animate-bounce delay-100">
                    <Palette className="w-5 h-5 text-purple-400" />
                </div>
                <div className="absolute -left-4 -bottom-2 w-10 h-10 bg-[#0F172A] border border-slate-700 rounded-xl flex items-center justify-center shadow-lg animate-bounce delay-700">
                    <Box className="w-5 h-5 text-emerald-400" />
                </div>
            </div>
            <div className="space-y-3">
                <h3 className="text-2xl font-bold text-slate-200 tracking-tight">
                    KPC AI Forge
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                    在左侧聊天框描述您的需求，AI 将为您构建基于 KPC 组件库的现代化 Vue 界面。
                </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
                 <span className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs font-mono text-slate-300 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <Terminal size={12} className="text-slate-500" />
                    <span className="opacity-50 select-none">$</span>
                    <span className="text-blue-400">npm install</span>
                    <span>@king-design/vue</span>
                    <span className="text-yellow-500/80">-S</span>
                 </span>
            </div>
        </div>
    </div>
);

// Progress Overlay Component
const BuildProgress = ({ plan, currentCode, isComplete }: { plan: PlanData | ArchitectPlan, currentCode: string, isComplete: boolean }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    // Safe access for potential undefined implementation_steps (in ArchitectPlan)
    const implementationSteps = 'implementation_steps' in plan ? (plan as PlanData).implementation_steps : [];
    const stepCount = implementationSteps?.length || 0;

    useEffect(() => {
        if (isComplete) {
            setCurrentStep(stepCount + 1);
            const timer = setTimeout(() => {
                setIsFadingOut(true);
            }, 3000); 
            const removeTimer = setTimeout(() => {
                setIsVisible(false);
            }, 3500); 

            return () => {
                clearTimeout(timer);
                clearTimeout(removeTimer);
            };
        } else {
            setIsVisible(true);
            setIsFadingOut(false);
        }
    }, [isComplete, stepCount]);

    useEffect(() => {
        if (!isComplete) {
            const regex = /<!--\s*\[KPC:STEP:(\d+)\]\s*-->/g;
            let match;
            let maxStep = 0;
            while ((match = regex.exec(currentCode)) !== null) {
                const stepNum = parseInt(match[1], 10);
                if (stepNum > maxStep) maxStep = stepNum;
            }
            setCurrentStep(maxStep);
        }
    }, [currentCode, isComplete]);

    // If it's an ArchitectPlan (no implementation_steps), we skip showing this specific overlay for now.
    if (!plan || !isVisible || stepCount === 0) return null;

    return (
        <div className={`absolute bottom-4 right-4 w-72 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl overflow-hidden z-20 transition-all duration-500 ease-in-out ${
            isFadingOut ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        } animate-in fade-in slide-in-from-bottom-4`}>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <ListChecks size={14} className="text-blue-400" />
                    <span className="text-xs font-semibold text-slate-200">构建任务详情</span>
                </div>
                {isComplete ? (
                    <span className="text-[10px] text-green-400 font-mono font-bold">完成</span>
                ) : (
                    <Loader2 size={12} className="text-blue-400 animate-spin" />
                )}
            </div>
            <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                {implementationSteps.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum || isComplete;
                    const isCurrent = currentStep === stepNum - 1 && !isComplete; 

                    return (
                        <div key={idx} className={`flex gap-2 items-start p-1.5 rounded text-[11px] transition-colors ${
                            isDone ? 'text-slate-400' : isCurrent ? 'text-blue-200 bg-blue-500/10' : 'text-slate-600'
                        }`}>
                            <div className="mt-0.5 shrink-0">
                                {isDone ? (
                                    <CheckCircle2 size={12} className="text-green-500" />
                                ) : isCurrent ? (
                                    <Loader2 size={12} className="text-blue-400 animate-spin" />
                                ) : (
                                    <div className="w-3 h-3 rounded-full border border-slate-700 bg-slate-800" />
                                )}
                            </div>
                            <span className={`${isDone ? 'line-through opacity-70' : ''}`}>
                                {step.replace(/^\d+\.\s*/, '')}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const Workspace: React.FC<WorkspaceProps> = ({ plan, generatedArtifact, history = [], onRestoreVersion, appState }) => {
  const [activeTab, setActiveTab] = useState<Tab>('preview');
  const [showHistory, setShowHistory] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedArtifact.code && generatedArtifact.code.length > 200) {
        if (generatedArtifact.version === 0 && generatedArtifact.code.length < 300) {
             setActiveTab('preview');
        }
    }
  }, [generatedArtifact.version]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleVersionClick = (artifact: GeneratedArtifact) => {
      if (onRestoreVersion) {
          onRestoreVersion(artifact);
          setShowHistory(false);
      }
  };

  const validHistory = Array.isArray(history) ? history : [];
  const sortedHistory = [...validHistory].sort((a, b) => b.version - a.version);

  const isEmptyState = generatedArtifact.version === 0 && generatedArtifact.code.length < 300;
  
  const isCodeComplete = appState 
    ? (appState === 'ready' || appState === 'idle')
    : generatedArtifact.code.includes('</html>');

  const showProgress = plan && !isEmptyState && activeTab === 'preview';

  return (
    <div className="flex flex-col h-full bg-[#111827] overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center bg-kpc-panel border-b border-kpc-border px-2 pt-2 gap-1">
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'preview'
              ? 'bg-[#111827] text-blue-400 border-t border-x border-blue-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-4 h-4" />
          界面预览
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'code'
              ? 'bg-[#111827] text-blue-400 border-t border-x border-blue-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          生成的代码
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-[#111827]">
        
        {/* Preview Tab */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {isEmptyState ? (
                <EmptyState />
            ) : (
                <div className="w-full h-full bg-white/5 flex flex-col relative">
                     <div className="bg-white h-full w-full">
                        <DebouncedPreview code={generatedArtifact.code} />
                     </div>
                     {/* Progress Overlay */}
                     {showProgress && plan && (
                         <BuildProgress 
                            plan={plan} 
                            currentCode={generatedArtifact.code} 
                            isComplete={isCodeComplete} 
                         />
                     )}
                </div>
            )}
        </div>

        {/* Code Tab */}
        <div className={`absolute inset-0 bg-[#0d1117] overflow-auto transition-opacity duration-300 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
             <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                <code>
                    {generatedArtifact.code || "// 尚未生成代码。"}
                </code>
             </pre>
        </div>

      </div>
      
      {/* Footer Status */}
      <div className="h-8 bg-kpc-panel border-t border-kpc-border flex items-center px-4 text-[10px] text-slate-500 justify-between shrink-0 relative">
          <div className="flex gap-4 items-center">
             <span>Vue 源代码</span>
             
             {/* Version Selector */}
             <div className="relative ml-2" ref={historyRef}>
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1.5 hover:text-slate-200 transition-colors px-2 py-0.5 rounded hover:bg-slate-700/50"
                >
                    <History size={12} className={generatedArtifact.version > 0 ? "text-blue-400" : ""} />
                    <span>v{generatedArtifact.version}</span>
                </button>

                {/* History Dropup Menu */}
                {showHistory && (
                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-900/50">
                            <span className="text-xs font-semibold text-slate-300">历史版本</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {sortedHistory.map((h) => (
                                <button
                                    key={h.version}
                                    onClick={() => handleVersionClick(h)}
                                    className={`w-full text-left px-3 py-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                                        h.version === generatedArtifact.version 
                                        ? 'bg-blue-600/20 text-blue-200' 
                                        : 'hover:bg-slate-700/50 text-slate-400'
                                    }`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-bold">v{h.version}</span>
                                            {h.version === 0 && <span className="text-[10px] opacity-60 bg-slate-700 px-1 rounded">初始</span>}
                                        </div>
                                        <span className="text-[10px] opacity-60 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(h.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                    {h.version === generatedArtifact.version && <Check size={12} className="text-blue-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
             </div>

          </div>
          <div className="flex gap-2 items-center">
             <div className={`w-2 h-2 rounded-full transition-colors ${generatedArtifact.code.length > 200 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
             <span>{generatedArtifact.code.length > 200 ? '就绪' : '空闲'}</span>
          </div>
      </div>
    </div>
  );
};

export default memo(Workspace);