import React, { useEffect, useRef, useState } from 'react';
import { Message, Sender, AgentType, AppState } from '../types';
import { Send, Bot, User, Loader2 } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  appState: AppState;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, appState }) => {
  const [inputValue, setInputValue] = useState('');
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && (appState === 'idle' || appState === 'ready')) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isProcessing = appState !== 'idle' && appState !== 'ready';

  return (
    <div className="flex flex-col h-full bg-kpc-dark border-r border-kpc-border">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === Sender.USER ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
              {msg.sender === Sender.USER ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.sender === Sender.USER ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1">
                 <span className="text-xs font-bold text-gray-400">
                    {msg.sender === Sender.USER ? '你' : msg.agent || '系统'}
                 </span>
                 <span className="text-[10px] text-gray-600">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                 </span>
              </div>
              
              <div className={`p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === Sender.USER 
                  ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isProcessing && (
             <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot size={16} />
                </div>
                <div className="flex items-center gap-2 bg-slate-800 p-3 rounded-lg rounded-tl-none border border-slate-700">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span className="text-xs text-slate-400 font-mono uppercase">AI 正在思考...</span>
                </div>
             </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      <div className="p-4 bg-kpc-panel border-t border-kpc-border">
        <div className="relative">
            <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            placeholder={isProcessing ? "等待响应..." : "请描述您的 UI 界面需求..."}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg p-3 pr-12 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-20 disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
            />
            <button 
                onClick={handleSend}
                disabled={!inputValue.trim() || isProcessing}
                className="absolute right-3 bottom-3 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors disabled:opacity-50 disabled:bg-slate-700"
            >
            <Send size={16} />
            </button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">
            支持 Plan & Execute (规划-执行) 模式。已启用 KPC 组件库。
        </p>
      </div>
    </div>
  );
};

export default ChatArea;