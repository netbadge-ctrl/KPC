import React from 'react';
import { PlanData } from '../types';
import { Layout, ListChecks, Blocks, BrainCircuit } from 'lucide-react';

interface PlanViewerProps {
  plan: PlanData;
}

const PlanViewer: React.FC<PlanViewerProps> = ({ plan }) => {
  return (
    <div className="h-full overflow-y-auto p-6 bg-slate-900/50 space-y-6 text-slate-300 font-sans">
      
      <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-lg">
        <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> 思考过程
        </h3>
        <p className="text-sm italic leading-relaxed opacity-90">"{plan.thought_process}"</p>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Blocks className="w-4 h-4 text-purple-400" /> 推荐组件
        </h4>
        <div className="flex flex-wrap gap-2">
          {plan.component_list.map((comp, idx) => (
            <span key={idx} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-purple-300">
              {comp}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Layout className="w-4 h-4 text-orange-400" /> 布局策略
        </h4>
        <p className="text-sm text-slate-400 border-l-2 border-orange-500/30 pl-3">
          {plan.layout_strategy}
        </p>
      </div>

      <div>
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-emerald-400" /> 实现步骤
        </h4>
        <ul className="space-y-2">
          {plan.implementation_steps.map((step, idx) => (
            <li key={idx} className="flex gap-3 text-sm">
                <span className="text-emerald-500 font-mono shrink-0">{idx + 1}.</span>
                <span className="text-slate-300">{step.replace(/^\d+\.\s*/, '')}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
};

export default PlanViewer;