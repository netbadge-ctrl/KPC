import React, { memo } from 'react';
import { AppState } from '../types';
import { BrainCircuit, Code2, PenTool, CheckCircle2, DraftingCompass, Factory, Hammer } from 'lucide-react';

interface StepIndicatorProps {
  state: AppState;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ state }) => {
  
  const getStatusColor = (targets: AppState[], current: AppState) => {
    const order = ['idle', 'planning', 'architecting', 'fabricating', 'assembling', 'coding', 'refining', 'ready'];
    const currentIndex = order.indexOf(current);
    
    // Check if any of the target states matches current
    if (targets.includes(current)) return 'text-blue-400 border-blue-500 bg-blue-900/20 animate-pulse';
    
    // Check if target is passed (simplistic logic: if target index < current index)
    // We assume the first target in the array determines position
    const targetIndex = order.indexOf(targets[0]);
    if (targetIndex < currentIndex) return 'text-green-400 border-green-500 bg-green-900/20';
    
    return 'text-slate-600 border-slate-700 bg-slate-900';
  };

  // Determine if we are in legacy linear mode or hierarchical mode
  // If state is 'architecting' or later, we show the complex steps.
  // If state is 'planning' or 'coding', we might be in simple mode. 
  // For simplicity, we'll try to adapt the UI based on specific states.
  const isHierarchical = ['architecting', 'fabricating', 'assembling'].includes(state);

  return (
    <div className="flex items-center justify-center gap-4 py-3 bg-kpc-dark border-b border-kpc-border text-sm font-medium overflow-x-auto">
      
      {!isHierarchical ? (
        <>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['planning'], state)}`}>
                <BrainCircuit className="w-4 h-4" />
                <span>需求规划</span>
            </div>

            <div className="w-6 h-[1px] bg-slate-700" />

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['coding'], state)}`}>
                <Code2 className="w-4 h-4" />
                <span>代码生成</span>
            </div>
            
            <div className="w-6 h-[1px] bg-slate-700" />
            
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['refining'], state)}`}>
                <PenTool className="w-4 h-4" />
                <span>细节优化</span>
            </div>
        </>
      ) : (
        <>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['architecting'], state)}`}>
                <DraftingCompass className="w-4 h-4" />
                <span>架构设计</span>
            </div>
            
            <div className="w-6 h-[1px] bg-slate-700" />

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['fabricating'], state)}`}>
                <Factory className="w-4 h-4" />
                <span>组件制造 (并发)</span>
            </div>
            
            <div className="w-6 h-[1px] bg-slate-700" />

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor(['assembling'], state)}`}>
                <Hammer className="w-4 h-4" />
                <span>总装</span>
            </div>
        </>
      )}

      {state === 'ready' && (
        <>
             <div className="w-6 h-[1px] bg-slate-700" />
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