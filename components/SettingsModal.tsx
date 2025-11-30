import React from 'react';
import { X, Cpu, Thermometer, Download, Zap, Sparkles, Github, Keyboard, CornerDownLeft, Command, BrainCircuit, Code2 } from 'lucide-react';
import { AppSettings, GeneratedArtifact, SubmitShortcut } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  currentArtifact?: GeneratedArtifact;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange,
  currentArtifact
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!currentArtifact?.code) return;
    const blob = new Blob([currentArtifact.code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kpc-export-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGithubChange = (field: keyof typeof settings.github, value: string) => {
    onSettingsChange({
        ...settings,
        github: {
            ...settings.github,
            [field]: value
        }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1E293B] border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-[#0F172A]">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            设置 (Settings)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-md hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* AI Configuration Section */}
          <section>
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu size={14} /> AI 模型配置
             </h4>
             
             <div className="space-y-4">
                {/* Model Selection */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                   <label className="block text-sm text-slate-300 mb-3 font-medium">生成模型</label>
                   <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onSettingsChange({ ...settings, model: 'gemini-2.5-flash' })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                            settings.model === 'gemini-2.5-flash' 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-100' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                         <Zap className={`w-5 h-5 mb-2 ${settings.model === 'gemini-2.5-flash' ? 'text-blue-400' : 'text-slate-500'}`} />
                         <span className="text-sm font-medium">Flash 2.5</span>
                         <span className="text-[10px] opacity-70 mt-1">响应速度快</span>
                      </button>

                      <button 
                        onClick={() => onSettingsChange({ ...settings, model: 'gemini-3-pro-preview' })}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                            settings.model === 'gemini-3-pro-preview' 
                            ? 'bg-purple-600/20 border-purple-500 text-purple-100' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                         <Sparkles className={`w-5 h-5 mb-2 ${settings.model === 'gemini-3-pro-preview' ? 'text-purple-400' : 'text-slate-500'}`} />
                         <span className="text-sm font-medium">Pro 3.0</span>
                         <span className="text-[10px] opacity-70 mt-1">复杂逻辑/编程</span>
                      </button>
                   </div>
                </div>

                {/* Temperature Controls */}
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-5">
                    
                    {/* Planning Temperature */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                <BrainCircuit size={14} className="text-blue-400" /> 
                                规划创造性 (Planning Temp)
                            </label>
                            <span className="text-xs text-blue-400 font-mono bg-blue-900/30 px-2 py-0.5 rounded">
                                {settings.planningTemperature.toFixed(1)}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            value={settings.planningTemperature}
                            onChange={(e) => onSettingsChange({ ...settings, planningTemperature: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>严谨</span>
                            <span>发散</span>
                        </div>
                    </div>

                    {/* Coding Temperature */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                                <Code2 size={14} className="text-emerald-400" /> 
                                编码严谨性 (Coding Temp)
                            </label>
                            <span className="text-xs text-emerald-400 font-mono bg-emerald-900/30 px-2 py-0.5 rounded">
                                {settings.codingTemperature.toFixed(1)}
                            </span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            value={settings.codingTemperature}
                            onChange={(e) => onSettingsChange({ ...settings, codingTemperature: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>精准 (推荐低值)</span>
                            <span>多样</span>
                        </div>
                    </div>

                </div>
             </div>
          </section>
          
          <hr className="border-slate-700/50" />

          {/* Interaction Settings */}
          <section>
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Keyboard size={14} /> 交互设置
             </h4>
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-3">
                 <label className="block text-sm text-slate-300 font-medium">发送快捷键</label>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                         onClick={() => onSettingsChange({ ...settings, submitShortcut: 'enter' })}
                         className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                             settings.submitShortcut === 'enter'
                             ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                         }`}
                    >
                         <span className="text-sm">Enter 发送</span>
                         <CornerDownLeft size={16} className={settings.submitShortcut === 'enter' ? 'text-blue-400' : 'text-slate-500'}/>
                    </button>

                    <button 
                         onClick={() => onSettingsChange({ ...settings, submitShortcut: 'ctrl_enter' })}
                         className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                             settings.submitShortcut === 'ctrl_enter'
                             ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                         }`}
                    >
                         <span className="text-sm">Cmd/Ctrl + Enter</span>
                         <div className="flex items-center gap-0.5">
                             <Command size={14} className={settings.submitShortcut === 'ctrl_enter' ? 'text-blue-400' : 'text-slate-500'}/>
                             <CornerDownLeft size={14} className={settings.submitShortcut === 'ctrl_enter' ? 'text-blue-400' : 'text-slate-500'}/>
                         </div>
                    </button>
                 </div>
                 <p className="text-[10px] text-slate-500 mt-2">
                    {settings.submitShortcut === 'enter' 
                        ? '提示: 使用 Shift + Enter 换行。' 
                        : '提示: 使用 Enter 换行。'}
                 </p>
             </div>
          </section>

          <hr className="border-slate-700/50" />

          {/* GitHub Settings */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
               <Github size={14} /> GitHub 集成
            </h4>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 space-y-4">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Personal Access Token</label>
                    <input 
                        type="password"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value={settings.github?.token || ''}
                        onChange={(e) => handleGithubChange('token', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400">仓库 (Owner/Repo)</label>
                        {/* Hidden consolidated field */}
                        <input 
                            type="text"
                            value={settings.github?.repo || ''} 
                            onChange={() => {}} 
                            className="hidden" 
                        />
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="Owner" 
                                value={settings.github?.owner || ''}
                                onChange={(e) => handleGithubChange('owner', e.target.value)}
                                className="w-1/2 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                             />
                             <span className="text-slate-500 self-center">/</span>
                             <input 
                                type="text" 
                                placeholder="Repo" 
                                value={settings.github?.repo || ''}
                                onChange={(e) => handleGithubChange('repo', e.target.value)}
                                className="w-1/2 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                             />
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">分支 (Branch)</label>
                    <input 
                        type="text"
                        placeholder="main"
                        value={settings.github?.branch || 'main'}
                        onChange={(e) => handleGithubChange('branch', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>
          </section>

          <hr className="border-slate-700/50" />

          {/* Export Section */}
          <section>
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Download size={14} /> 项目导出
             </h4>
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex items-center justify-between">
                <div>
                    <div className="text-sm text-slate-200 font-medium">导出 HTML 文件</div>
                    <div className="text-xs text-slate-500 mt-1">下载当前页面的完整源代码</div>
                </div>
                <button 
                    onClick={handleDownload}
                    disabled={!currentArtifact || !currentArtifact.code}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm rounded-lg transition-colors border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    <span>下载</span>
                </button>
             </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-[#0F172A] flex justify-end">
            <button 
                onClick={onClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
                完成
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;