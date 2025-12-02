import React, { memo } from 'react';
import { AppState } from '../types';
import { BrainCircuit, Code2, PenTool, CheckCircle2 } from 'lucide-react';

interface StepIndicatorProps {
  state: AppState;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ state }) => {
  
  const getStatusColor = (target: AppState, current: AppState) => {
    const order = ['idle', 'planning', 'coding', 'refining', 'ready'];
    const currentIndex = order.indexOf(current);
    const targetIndex = order.indexOf(target);
    
    if (current === 'idle') return 'text-slate-600 border-slate-700 bg-slate-900';
    if (targetIndex < currentIndex) return 'text-green-400 border-green-500 bg-green-900/20';
    if (targetIndex === currentIndex) return 'text-blue-400 border-blue-500 bg-blue-900/20 animate-pulse';
    return 'text-slate-600 border-slate-700 bg-slate-900';
  };

  return (
    <div className="flex items-center justify-center gap-4 py-3 bg-kpc-dark border-b border-kpc-border text-sm font-medium">
      
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor('planning', state)}`}>
        <BrainCircuit className="w-4 h-4" />
        <span>需求规划</span>
      </div>

      <div className="w-8 h-[1px] bg-slate-700" />

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor('coding', state)}`}>
        <Code2 className="w-4 h-4" />
        <span>代码生成</span>
      </div>

      <div className="w-8 h-[1px] bg-slate-700" />

      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor('refining', state)}`}>
        <PenTool className="w-4 h-4" />
        <span>细节优化</span>
      </div>

      {state === 'ready' && (
        <>
             <div className="w-8 h-[1px] bg-slate-700" />
            <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span>完成</span>
            </div>
        </>
      )}

    </div>
  );
};

export default memo(StepIndicator);