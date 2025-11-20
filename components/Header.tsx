import React from 'react';
import { Layers, GitBranch, User, Settings } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="h-14 bg-kpc-panel border-b border-kpc-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <h1 className="font-bold text-lg tracking-tight text-white">
          KPC <span className="text-blue-400 font-light">AI Forge</span>
        </h1>
      </div>

      <div className="flex items-center gap-4 text-gray-400">
        <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <GitBranch className="w-3.5 h-3.5" />
          <span>main</span>
          <span className="text-slate-600">|</span>
          <span className="text-green-500">系统在线</span>
        </div>
        
        <button className="hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 p-1.5 rounded-full transition-colors">
          <User className="w-5 h-5 text-white" />
        </button>
      </div>
    </header>
  );
};

export default Header;