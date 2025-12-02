import React from 'react';
import { User } from '../types';
import { Layers, ArrowRight, User as UserIcon } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  return (
    <div className="min-h-screen w-full bg-[#0F172A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="z-10 flex flex-col items-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Brand */}
        <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl shadow-blue-900/20 mb-2">
                <Layers className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
                KPC <span className="text-blue-400 font-light">AI Forge</span>
            </h1>
            <p className="text-slate-400 text-sm max-w-sm text-center leading-relaxed">
                智能前端生成平台。请选择您的账户以继续，每个账户拥有独立的项目空间和偏好设置。
            </p>
        </div>

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onLogin(user)}
                    className="group relative flex flex-col items-center p-6 bg-[#1E293B] hover:bg-[#27354d] border border-slate-700 hover:border-blue-500/50 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                    <div className="relative mb-4">
                        <img 
                            src={user.avatar} 
                            alt={user.name} 
                            className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-blue-400 transition-colors object-cover" 
                        />
                        <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1/4 translate-x-1/4">
                            <ArrowRight size={12} className="text-white" />
                        </div>
                    </div>
                    
                    <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-blue-300 transition-colors">
                        {user.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50">
                        {user.role}
                    </span>
                </button>
            ))}
        </div>

        <div className="text-slate-600 text-xs flex items-center gap-2 mt-8">
            <UserIcon size={12} />
            <span>模拟账户系统</span>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;