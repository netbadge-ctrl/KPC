import React, { useEffect, useRef, useState, memo } from 'react';
import { Message, Sender, AgentType, AppState, PlanData, SubmitShortcut } from '../types';
import { Send, Bot, User, Loader2, Image as ImageIcon, X, ChevronDown, ChevronRight, BrainCircuit, ListChecks, Layers, Wrench, Square, History, Check, RotateCcw, Code2, PenTool, Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, image?: string) => void;
  onStop?: () => void;
  appState: AppState;
  submitShortcut?: SubmitShortcut;
  currentVersion?: number;
  onRestoreVersion?: (version: number) => void;
}

const PlanCard: React.FC<{ plan: PlanData }> = ({ plan }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mt-3 bg-slate-900 border border-slate-700/60 rounded-lg overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-700/60 bg-slate-900 flex items-center justify-between">
         <div className="flex items-center gap-2 text-blue-400 font-medium text-sm">
            <BrainCircuit size={16} />
            <span>构建计划 (Execution Plan)</span>
         </div>
         <button 
            onClick={() => setExpanded(!expanded)} 
            className="text-slate-500 hover:text-slate-300 transition-colors"
         >
             {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
         </button>
      </div>
      
      <div className="p-4 text-sm">
         <div className="mb-3">
             <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">思考过程</div>
             <p className="text-slate-300 leading-relaxed italic border-l-2 border-blue-500/30 pl-3">
                 {plan.thought_process}
             </p>
         </div>

         {expanded && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Layers size={12} /> 核心组件
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {plan.component_list.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-xs border border-slate-700 font-mono">
                                {c}
                            </span>
                        ))}
                     </div>
                </div>
                 <div>
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ListChecks size={12} /> 实施步骤
                     </div>
                     <ul className="space-y-1.5">
                        {plan.implementation_steps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-slate-400 text-xs">
                                <span className="text-blue-500 font-mono">{i+1}.</span>
                                <span>{step.replace(/^\d+\.\s*/, '')}</span>
                            </li>
                        ))}
                     </ul>
                </div>
            </div>
         )}
         
         {!expanded && (
             <div className="text-xs text-slate-500 mt-2 flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => setExpanded(true)}>
                 <span>查看 {plan.implementation_steps.length} 个实施步骤和组件详情</span>
             </div>
         )}
      </div>
    </div>
  );
};

const ChatArea: React.FC<ChatAreaProps> = ({ 
    messages, 
    onSendMessage, 
    onStop, 
    appState, 
    submitShortcut = 'enter',
    currentVersion,
    onRestoreVersion
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, selectedImage]); 

  const handleSend = () => {
    if ((inputValue.trim() || selectedImage) && (appState === 'idle' || appState === 'ready')) {
      onSendMessage(inputValue, selectedImage || undefined);
      setInputValue('');
      setSelectedImage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (submitShortcut === 'enter') {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    } else {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
        }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault(); 
          return;
        }
      }
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
  };

  const isProcessing = appState !== 'idle' && appState !== 'ready';

  const getAgentIcon = (agent?: AgentType) => {
    switch (agent) {
        case AgentType.FIXER: return <Wrench size={16} />;
        case AgentType.PLANNER: return <BrainCircuit size={16} />;
        case AgentType.CODER: return <Code2 size={16} />;
        case AgentType.REFINER: return <PenTool size={16} />;
        case AgentType.FORGER: return <Sparkles size={16} />;
        default: return <Bot size={16} />;
    }
  };

  const getAgentColor = (sender: Sender, agent?: AgentType) => {
      if (sender === Sender.USER) return 'bg-blue-600';
      if (agent === AgentType.FIXER) return 'bg-orange-600';
      if (agent === AgentType.PLANNER) return 'bg-indigo-600';
      if (agent === AgentType.CODER) return 'bg-emerald-600';
      return 'bg-purple-600';
  };

  return (
    <div className="flex flex-col h-full bg-kpc-dark border-r border-kpc-border">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getAgentColor(msg.sender, msg.agent)}`}>
              {msg.sender === Sender.USER ? <User size={16} /> : getAgentIcon(msg.agent)}
            </div>
            
            <div className={`flex flex-col max-w-[90%] ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs font-bold text-gray-400">
                    {msg.sender === Sender.USER ? '你' : msg.agent || '系统'}
                 </span>
                 <span className="text-[10px] text-gray-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
              </div>
              
              <div className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap overflow-hidden ${
                msg.sender === Sender.USER 
                  ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none w-full'
              }`}>
                {msg.image && (
                    <div className="mb-3 rounded-md overflow-hidden border border-white/10">
                        <img src={msg.image} alt="User Upload" className="max-w-full h-auto max-h-60 object-cover" />
                    </div>
                )}
                {/* Render Text */}
                {msg.text}

                {/* Render Structured Plan if available */}
                {msg.contentData && (
                    <PlanCard plan={msg.contentData} />
                )}

                {/* Render Version Action */}
                {msg.relatedVersion !== undefined && onRestoreVersion && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                         <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                             <History size={10} />
                             <span>Version {msg.relatedVersion}</span>
                         </div>
                         
                         {currentVersion === msg.relatedVersion ? (
                             <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-900/50">
                                 <Check size={10} /> 当前版本
                             </span>
                         ) : (
                             <button 
                                onClick={() => onRestoreVersion(msg.relatedVersion!)}
                                className="text-[10px] flex items-center gap-1 text-blue-300 hover:text-white bg-blue-900/30 hover:bg-blue-600 px-2 py-0.5 rounded-full border border-blue-800 transition-all"
                             >
                                 <RotateCcw size={10} /> 回滚至此
                             </button>
                         )}
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
             <div className="flex gap-3 animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot size={16} />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-lg rounded-tl-none border border-slate-700">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-400 font-mono uppercase">AI 正在思考...</span>
                    </div>
                    {onStop && (
                        <button 
                            onClick={onStop}
                            className="flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
                        >
                            <Square size={12} fill="currentColor" className="group-hover:scale-90 transition-transform" />
                            <span className="text-xs font-medium">停止</span>
                        </button>
                    )}
                </div>
             </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-kpc-panel border-t border-kpc-border">
        {/* Image Preview */}
        {selectedImage && (
            <div className="mb-2 flex items-center gap-2 bg-slate-800/50 p-2 rounded border border-slate-700 w-fit">
                <div className="relative w-16 h-16 rounded overflow-hidden group">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                        onClick={clearImage}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={14} className="text-white" />
                    </button>
                </div>
                <span className="text-xs text-slate-400">已选择图片</span>
            </div>
        )}

        <div className="relative">
            <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={isProcessing}
            placeholder={isProcessing 
                ? "AI 正在生成中..." 
                : submitShortcut === 'enter' 
                    ? "描述需求... (Enter 发送, Shift+Enter 换行)" 
                    : "描述需求... (Cmd/Ctrl+Enter 发送, Enter 换行)"
            }
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 pr-24 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-20 disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
            />
            
            <div className="absolute right-3 bottom-3 flex gap-2">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition-colors disabled:opacity-50"
                    title="上传参考图片"
                >
                    <ImageIcon size={16} />
                </button>
                <button 
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:bg-slate-700"
                    title={`发送 (${submitShortcut === 'enter' ? 'Enter' : 'Cmd/Ctrl+Enter'})`}
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
            支持粘贴图片 (Ctrl+V) 或上传截图，AI 将自动识别布局。
        </p>
      </div>
    </div>
  );
};

export default memo(ChatArea);