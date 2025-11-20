import React, { useState, useEffect } from 'react';
import { FileJson, Code, Play, Monitor } from 'lucide-react';
import PlanViewer from './PlanViewer';
import { PlanData, GeneratedArtifact } from '../types';

interface WorkspaceProps {
  plan: PlanData | null;
  generatedArtifact: GeneratedArtifact;
}

type Tab = 'preview' | 'code' | 'plan';

const Workspace: React.FC<WorkspaceProps> = ({ plan, generatedArtifact }) => {
  const [activeTab, setActiveTab] = useState<Tab>('preview');

  // Auto switch to preview when code is generated
  useEffect(() => {
    if (generatedArtifact.code && generatedArtifact.code.length > 200) {
        setActiveTab('preview');
    } else if (plan) {
        setActiveTab('plan');
    }
  }, [plan, generatedArtifact.code]);

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
          预览 (Preview)
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
          代码 (Code)
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
            activeTab === 'plan'
              ? 'bg-[#111827] text-blue-400 border-t border-x border-blue-500/30'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`}
        >
          <FileJson className="w-4 h-4" />
          执行计划 (Plan)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        
        {/* Preview Tab */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <div className="w-full h-full bg-white/5 flex flex-col">
                 <div className="bg-white h-full w-full">
                     {/* Using an iframe to isolate the preview environment */}
                    <iframe 
                        title="Preview"
                        srcDoc={generatedArtifact.code}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                    />
                 </div>
            </div>
        </div>

        {/* Code Tab */}
        <div className={`absolute inset-0 bg-[#0d1117] overflow-auto transition-opacity duration-300 ${activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
             <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed">
                <code>
                    {generatedArtifact.code || "// 尚未生成代码。"}
                </code>
             </pre>
        </div>

        {/* Plan Tab */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'plan' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            {plan ? (
                <PlanViewer plan={plan} />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <FileJson className="w-12 h-12 mb-4 opacity-50" />
                    <p>暂无计划。请开始对话以生成计划。</p>
                </div>
            )}
        </div>

      </div>
      
      {/* Footer Status for Workspace */}
      <div className="h-8 bg-kpc-panel border-t border-kpc-border flex items-center px-4 text-[10px] text-slate-500 justify-between shrink-0">
          <div className="flex gap-4">
             <span>Ln 1, Col 1</span>
             <span>UTF-8</span>
             <span>HTML/Vue</span>
          </div>
          <div className="flex gap-2 items-center">
             <div className={`w-2 h-2 rounded-full ${generatedArtifact.code.length > 200 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
             <span>{generatedArtifact.code.length > 200 ? '构建成功' : '等待输入'}</span>
          </div>
      </div>
    </div>
  );
};

export default Workspace;