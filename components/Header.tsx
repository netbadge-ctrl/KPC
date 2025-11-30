import React, { memo, useState } from 'react';
import { Layers, GitBranch, Settings, Folder, File, Plus, ChevronDown, Pencil, LogOut, User as UserIcon, Share2 } from 'lucide-react';
import { Project, User } from '../types';

interface HeaderProps {
  projects: Project[];
  activeProjectId: string;
  activePageId: string;
  currentUser: User | null;
  onSelectProject: (projectId: string) => void;
  onSelectPage: (pageId: string) => void;
  onCreateProject: () => void;
  onCreatePage: () => void;
  onRenameProject: () => void;
  onRenamePage: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onShare: () => void; // New Prop
}

const Header: React.FC<HeaderProps> = ({ 
  projects, 
  activeProjectId, 
  activePageId, 
  currentUser,
  onSelectProject, 
  onSelectPage,
  onCreateProject,
  onCreatePage,
  onRenameProject,
  onRenamePage,
  onOpenSettings,
  onLogout,
  onShare
}) => {
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const activePage = activeProject?.pages.find(p => p.id === activePageId) || activeProject?.pages[0];
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 bg-kpc-panel border-b border-kpc-border flex items-center justify-between px-4 shrink-0 z-30">
      
      {/* Left: Branding & Project Nav */}
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight text-white hidden md:block">
            KPC <span className="text-blue-400 font-light">AI Forge</span>
          </h1>
        </div>

        <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
            
            {/* Project Selector */}
            <div className="flex items-center gap-1">
                <div className="relative group">
                    <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                        <Folder className="w-4 h-4 text-blue-400" />
                        <select 
                            className="bg-transparent appearance-none outline-none cursor-pointer w-24 md:w-32 font-medium"
                            value={activeProjectId}
                            onChange={(e) => onSelectProject(e.target.value)}
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-300">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                    </div>
                </div>
                <button 
                    onClick={onRenameProject}
                    className="p-1.5 hover:bg-slate-700 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                    title="重命名项目"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={onCreateProject}
                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-md transition-colors"
                    title="新建项目"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <span className="text-slate-600">/</span>

            {/* Page Selector */}
            <div className="flex items-center gap-1">
                <div className="relative group">
                    <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md transition-colors cursor-pointer">
                        <File className="w-4 h-4 text-emerald-400" />
                        <select 
                            className="bg-transparent appearance-none outline-none cursor-pointer w-24 md:w-32 font-medium"
                            value={activePageId}
                            onChange={(e) => onSelectPage(e.target.value)}
                        >
                            {activeProject?.pages.map(p => (
                                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-300">
                                    {p.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-slate-500" />
                    </div>
                </div>
                 <button 
                    onClick={onRenamePage}
                    className="p-1.5 hover:bg-slate-700 text-slate-500 hover:text-slate-300 rounded-md transition-colors"
                    title="重命名页面"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={onCreatePage}
                    className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 rounded-md transition-colors"
                    title="新建页面"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

        </div>
      </div>

      {/* Right: User & Status */}
      <div className="flex items-center gap-4 text-gray-400">
        <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
          <GitBranch className="w-3.5 h-3.5" />
          <span>v1.2.0</span>
          <span className="text-slate-600">|</span>
          <span className="text-green-500">System Ready</span>
        </div>
        
        <button 
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            title="分享"
        >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">分享</span>
        </button>

        <button 
            onClick={onOpenSettings}
            className="hover:text-white transition-colors p-1.5 rounded-full hover:bg-slate-800"
            title="设置"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile / Logout */}
        <div className="relative">
            <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
            >
                {currentUser ? (
                    <>
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-6 h-6 rounded-full border border-slate-600 object-cover"
                        />
                        <span className="text-xs font-medium text-slate-300 hidden md:block">{currentUser.name}</span>
                        <ChevronDown size={10} className="text-slate-500" />
                    </>
                ) : (
                     <div className="bg-slate-700 p-1.5 rounded-full">
                         <UserIcon className="w-4 h-4 text-white" />
                     </div>
                )}
            </button>
            
            {showUserMenu && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                         <div className="px-4 py-3 border-b border-slate-700/50">
                             <p className="text-xs text-slate-500 font-medium">Logged in as</p>
                             <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
                             <p className="text-xs text-slate-400 truncate">{currentUser?.role}</p>
                         </div>
                         <button 
                            onClick={() => {
                                setShowUserMenu(false);
                                onLogout();
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
                         >
                             <LogOut size={14} />
                             <span>登出 (Logout)</span>
                         </button>
                    </div>
                </>
            )}
        </div>
      </div>
    </header>
  );
};

export default memo(Header);