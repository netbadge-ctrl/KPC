import React, { useState } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import Workspace from './components/Workspace';
import StepIndicator from './components/StepIndicator';
import { Message, Sender, AppState, AgentType, PlanData, GeneratedArtifact } from './types';
// Change import from mock service to real AI service
import { generatePlan, generateCode, refineCode } from './services/aiService';
import { INITIAL_CODE } from './constants';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: Sender.SYSTEM,
      text: "欢迎来到 KPC AI Forge。我是您的前端架构师。请描述您想用 KPC 组件构建的界面。",
      timestamp: Date.now(),
      agent: AgentType.NONE
    }
  ]);
  const [appState, setAppState] = useState<AppState>('idle');
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [generatedArtifact, setGeneratedArtifact] = useState<GeneratedArtifact>({
    code: INITIAL_CODE,
    language: 'html',
    version: 0
  });

  const addMessage = (text: string, sender: Sender, agent: AgentType = AgentType.NONE) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      agent,
      timestamp: Date.now()
    }]);
  };

  const handleSendMessage = async (text: string) => {
    // 1. User Message
    addMessage(text, Sender.USER);
    
    try {
      if (appState === 'ready') {
          // Refinement Mode
          setAppState('refining');
          const newCode = await refineCode(generatedArtifact.code, text);
          setGeneratedArtifact(prev => ({...prev, code: newCode, version: prev.version + 1}));
          addMessage(`我已根据您的要求更新了代码。`, Sender.AI, AgentType.REFINER);
          setAppState('ready');
          return;
      }

      // 2. Planner Step
      setAppState('planning');
      const plan = await generatePlan(text);
      setCurrentPlan(plan);
      addMessage(`我已制定了构建计划。\n\n思考过程：${plan.thought_process}\n策略：${plan.layout_strategy}`, Sender.AI, AgentType.PLANNER);

      // 3. Coder Step
      setAppState('coding');
      const code = await generateCode(plan);
      setGeneratedArtifact({
          code: code,
          language: 'html',
          version: 1
      });
      addMessage("代码生成完毕。您可以在预览标签页查看结果。", Sender.AI, AgentType.CODER);

      setAppState('ready');
    } catch (error) {
      console.error("Process failed:", error);
      addMessage("抱歉，AI 服务遇到了一些问题，请稍后重试。", Sender.SYSTEM);
      setAppState('idle');
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      <Header />
      
      <StepIndicator state={appState} />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat & Prompt */}
        <div className="w-[400px] shrink-0 h-full flex flex-col z-20 shadow-xl shadow-black/20">
          <ChatArea 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            appState={appState}
          />
        </div>

        {/* Right Panel: Workspace (Plan, Code, Preview) */}
        <div className="flex-1 h-full overflow-hidden bg-[#1E293B]">
           <Workspace plan={currentPlan} generatedArtifact={generatedArtifact} />
        </div>
      </main>
    </div>
  );
};

export default App;