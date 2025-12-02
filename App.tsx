import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import Workspace from './components/Workspace';
import StepIndicator from './components/StepIndicator';
import InputModal from './components/InputModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import ShareModal from './components/ShareModal';
import { Message, Sender, AgentType, PlanData, GeneratedArtifact, Project, Page, AppSettings, User, ArchitectPlan } from './types';
import { 
    generateArchitectPlan, 
    generateComponentCode, 
    generateAssemblyStream,
    generateRefinementPlan, 
    refineCodeStream 
} from './services/aiService';
import { INITIAL_CODE, MOCK_USERS } from './constants';

const createInitialPage = (id: string, name: string): Page => {
  const initialArtifact: GeneratedArtifact = {
    code: INITIAL_CODE,
    language: 'html',
    version: 0,
    timestamp: Date.now(),
    commitMessage: '初始化'
  };
  
  return {
    id,
    name,
    messages: [
      {
        id: `init-${id}`,
        sender: Sender.SYSTEM,
        text: `欢迎来到页面 "${name}"。请描述您想在此页面构建的功能。`,
        timestamp: Date.now(),
        agent: AgentType.FORGER,
        relatedVersion: 0 // Allow restoring to init state
      }
    ],
    appState: 'idle',
    currentPlan: null,
    generatedArtifact: initialArtifact,
    history: [initialArtifact]
  };
};

// Seed Projects for Mock Users
const SEED_PROJECTS: Project[] = [
    {
        id: 'proj-alice-1',
        ownerId: 'user-alice',
        name: '电商控制台',
        pages: [createInitialPage('p-a1-1', '数据概览'), createInitialPage('p-a1-2', '订单管理')]
    },
    {
        id: 'proj-alice-2',
        ownerId: 'user-alice',
        name: '移动端商城',
        pages: [createInitialPage('p-a2-1', '首页'), createInitialPage('p-a2-2', '购物车')]
    },
    {
        id: 'proj-bob-1',
        ownerId: 'user-bob',
        name: '内部工具库',
        pages: [createInitialPage('p-b1-1', '文档生成器')]
    }
];

const DEFAULT_SETTINGS: AppSettings = {
    model: 'gemini-3-pro-preview', 
    planningTemperature: 0.8,
    codingTemperature: 0.2,
    github: { token: '', owner: '', repo: '', branch: 'main' },
    vectorDb: { enabled: false, endpoint: '', apiKey: '', collection: 'kpc-docs-v3', topK: 3 },
    submitShortcut: 'enter'
};

const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // --- Data State (Simulated Database) ---
  const [allProjects, setAllProjects] = useState<Project[]>(SEED_PROJECTS);
  
  // Settings Store: Map<userId, AppSettings>
  const [userSettingsMap, setUserSettingsMap] = useState<Record<string, AppSettings>>({
      'user-alice': { ...DEFAULT_SETTINGS, model: 'gemini-3-pro-preview' }, // Alice likes Pro
      'user-bob': { ...DEFAULT_SETTINGS, model: 'gemini-2.5-flash', codingTemperature: 0.0 } // Bob likes fast & strict
  });

  // --- Active View State ---
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [activePageId, setActivePageId] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false); // New State
  
  // --- Refs & Modals ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'create-project' | 'create-page' | 'rename-project' | 'rename-page' | null;
    title: string;
    defaultValue: string;
    targetId?: string;
  }>({ isOpen: false, type: null, title: '', defaultValue: '' });

  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Derived State ---
  
  // Filter projects for the current user
  const userProjects = useMemo(() => {
      if (!currentUser) return [];
      return allProjects.filter(p => p.ownerId === currentUser.id);
  }, [allProjects, currentUser]);

  const activeProject = useMemo(() => 
    userProjects.find(p => p.id === activeProjectId) || userProjects[0],
  [userProjects, activeProjectId]);

  const activePage = useMemo(() => 
    activeProject?.pages.find(p => p.id === activePageId) || activeProject?.pages[0],
  [activeProject, activePageId]);

  // Current User Settings
  const appSettings = useMemo(() => {
      if (!currentUser) return DEFAULT_SETTINGS;
      return userSettingsMap[currentUser.id] || DEFAULT_SETTINGS;
  }, [currentUser, userSettingsMap]);

  // --- Auth Handlers ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      
      // Ensure user has at least one project
      const myProjects = allProjects.filter(p => p.ownerId === user.id);
      if (myProjects.length === 0) {
           const newProjId = `proj-${Date.now()}`;
           const newPageId = `page-${Date.now()}`;
           const newProject: Project = {
              id: newProjId,
              ownerId: user.id,
              name: '我的第一个项目',
              pages: [createInitialPage(newPageId, '首页')]
           };
           setAllProjects(prev => [...prev, newProject]);
           setActiveProjectId(newProjId);
           setActivePageId(newPageId);
      } else {
          setActiveProjectId(myProjects[0].id);
          setActivePageId(myProjects[0].pages[0].id);
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setActiveProjectId('');
      setActivePageId('');
  };

  const handleSettingsChange = (newSettings: AppSettings) => {
      if (!currentUser) return;
      setUserSettingsMap(prev => ({
          ...prev,
          [currentUser.id]: newSettings
      }));
  };

  // --- Sync Selection Validity ---
  useEffect(() => {
    if (!currentUser || userProjects.length === 0) return;

    const proj = userProjects.find(p => p.id === activeProjectId);
    if (!proj) {
      setActiveProjectId(userProjects[0].id);
      setActivePageId(userProjects[0].pages[0].id);
    } else {
      const page = proj.pages.find(p => p.id === activePageId);
      if (!page) {
        setActivePageId(proj.pages[0].id);
      }
    }
  }, [userProjects, activeProjectId, activePageId, currentUser]);


  // --- Data Updaters ---

  const setPageData = useCallback((projectId: string, pageId: string, updateFn: (page: Page) => Page) => {
    setAllProjects(prevProjects => prevProjects.map(proj => {
      if (proj.id !== projectId) return proj;
      return {
        ...proj,
        pages: proj.pages.map(page => {
          if (page.id !== pageId) return page;
          return updateFn(page);
        })
      };
    }));
  }, []);

  const updateActivePage = useCallback((updates: Partial<Page>) => {
    if(activeProjectId && activePageId) {
        setPageData(activeProjectId, activePageId, (page) => ({ ...page, ...updates }));
    }
  }, [activeProjectId, activePageId, setPageData]);

  const addMessageToActivePage = useCallback((text: string, sender: Sender, agent: AgentType = AgentType.FORGER, image?: string, contentData?: PlanData | ArchitectPlan, relatedVersion?: number) => {
    const newMessage: Message = {
        id: Date.now().toString(),
        text,
        sender,
        agent,
        image,
        timestamp: Date.now(),
        contentData,
        relatedVersion
    };
    if(activeProjectId && activePageId) {
        setPageData(activeProjectId, activePageId, (page) => ({
            ...page,
            messages: [...page.messages, newMessage]
        }));
    }
  }, [activeProjectId, activePageId, setPageData]);


  // --- Event Handlers (Memoized) ---

  const handleModalSubmit = useCallback((name: string) => {
    if (!currentUser) return;
    const timestamp = Date.now();
    switch (modalConfig.type) {
        case 'create-project': {
            const newProjectId = `proj-${timestamp}`;
            const newPageId = `page-${timestamp}`;
            const newProject: Project = {
                id: newProjectId,
                ownerId: currentUser.id,
                name,
                pages: [createInitialPage(newPageId, '首页')]
            };
            setAllProjects(prev => [...prev, newProject]);
            setActiveProjectId(newProjectId);
            setActivePageId(newPageId);
            break;
        }
        case 'create-page': {
            const newPageId = `page-${timestamp}`;
            const newPage = createInitialPage(newPageId, name);
            setAllProjects(prev => prev.map(p => 
                p.id === activeProjectId ? { ...p, pages: [...p.pages, newPage] } : p
            ));
            setActivePageId(newPageId);
            break;
        }
        case 'rename-project': {
            setAllProjects(prev => prev.map(p => 
                p.id === modalConfig.targetId ? { ...p, name } : p
            ));
            break;
        }
        case 'rename-page': {
            if (modalConfig.targetId) {
                setPageData(activeProjectId, modalConfig.targetId, (page) => ({ ...page, name }));
            }
            break;
        }
    }
  }, [modalConfig, activeProjectId, currentUser, setPageData]);

  const modalActions = useMemo(() => ({
      openCreateProject: () => setModalConfig({ isOpen: true, type: 'create-project', title: '创建新项目', defaultValue: `新项目 ${userProjects.length + 1}` }),
      openCreatePage: () => setModalConfig({ isOpen: true, type: 'create-page', title: '创建新页面', defaultValue: `新页面 ${activeProject?.pages.length + 1}` }),
      openRenameProject: () => setModalConfig({ isOpen: true, type: 'rename-project', title: '重命名项目', defaultValue: activeProject?.name || '', targetId: activeProjectId }),
      openRenamePage: () => setModalConfig({ isOpen: true, type: 'rename-page', title: '重命名页面', defaultValue: activePage?.name || '', targetId: activePageId }),
      close: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
  }), [userProjects.length, activeProject, activePage, activeProjectId, activePageId]);

  const handleRestoreVersion = useCallback((versionArtifact: GeneratedArtifact) => {
      updateActivePage({ generatedArtifact: versionArtifact });
  }, [updateActivePage]);

  const restoreVersionFromChat = useCallback((version: number) => {
      if (!activePage) return;
      const artifact = activePage.history.find(h => h.version === version);
      if (artifact) {
          handleRestoreVersion(artifact);
      }
  }, [activePage, handleRestoreVersion]);

  // --- AI Logic (Updated for Hierarchical Flow) ---
  const handleStopGeneration = useCallback(() => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
          addMessageToActivePage("用户已终止生成。", Sender.SYSTEM);
          updateActivePage({ appState: 'ready' });
      }
  }, [addMessageToActivePage, updateActivePage]);

  const handleSendMessage = useCallback(async (text: string, image?: string) => {
    if (!activePage) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    addMessageToActivePage(text, Sender.USER, AgentType.FORGER, image);
    
    try {
      const currentArtifact = activePage.generatedArtifact;
      // Determine if we are updating existing code (Refinement) or building new (Hierarchical)
      const isRefinement = currentArtifact.version > 0 && currentArtifact.code.length > 200;

      if (isRefinement) {
         // --- REFINEMENT FLOW (Legacy) ---
         updateActivePage({ appState: 'planning' });
         if (signal.aborted) return;
         
         const refinementPlan = await generateRefinementPlan(currentArtifact.code, text, appSettings);
         if (signal.aborted) return;
         
         addMessageToActivePage(`分析完成，正在进行局部优化。`, Sender.AI, AgentType.PLANNER, undefined, refinementPlan);
         updateActivePage({ currentPlan: refinementPlan, appState: 'refining' });

         let finalCode = "";
         const streamGenerator = refineCodeStream(currentArtifact.code, text, appSettings);
         
         for await (const chunk of streamGenerator) {
             if (signal.aborted) return;
             finalCode = chunk;
             setPageData(activeProjectId, activePageId, (p) => ({
                 ...p,
                 generatedArtifact: { ...p.generatedArtifact, code: chunk }
             }));
         }
         
         const newArtifact = {
             code: finalCode,
             language: 'html',
             version: currentArtifact.version + 1,
             timestamp: Date.now(),
             commitMessage: '代码优化'
         };
         
         setPageData(activeProjectId, activePageId, (p) => ({
            ...p,
            appState: 'ready',
            generatedArtifact: newArtifact,
            history: [...p.history, newArtifact]
         }));
         addMessageToActivePage(`优化完成 (v${newArtifact.version})。`, Sender.AI, AgentType.REFINER, undefined, undefined, newArtifact.version);

      } else {
         // --- HIERARCHICAL GENERATION FLOW ---
         
         // 1. Architect Phase
         updateActivePage({ appState: 'architecting' });
         const architectPlan = await generateArchitectPlan(text, image, appSettings);
         if (signal.aborted) return;
         
         addMessageToActivePage(
             `架构设计已完成。已定义 ${architectPlan.components.length} 个组件接口契约。`, 
             Sender.AI, 
             AgentType.ARCHITECT, 
             undefined, 
             architectPlan
         );
         updateActivePage({ currentPlan: architectPlan, appState: 'fabricating' });

         // 2. Worker Phase (Parallel)
         // Generate promises for each component
         const componentPromises = architectPlan.components.map(spec => 
             generateComponentCode(spec, appSettings)
                 .then(code => ({ name: spec.name, code }))
         );
         
         // Wait for all workers to finish
         // In a real app, we might want to stream individual completions, but Promise.all is simpler for now
         const results = await Promise.all(componentPromises);
         if (signal.aborted) return;

         const componentCodes: Record<string, string> = {};
         results.forEach(r => componentCodes[r.name] = r.code);

         addMessageToActivePage(
             `所有组件制造完毕 (${results.map(r => r.name).join(', ')})。开始总装...`, 
             Sender.AI, 
             AgentType.WORKER
         );
         updateActivePage({ appState: 'assembling' });

         // 3. Assembly Phase
         let finalCode = "";
         const assemblyStream = generateAssemblyStream(architectPlan, componentCodes, appSettings);

         const nextVersion = (activePage.history.length > 0 ? Math.max(...activePage.history.map(h => h.version)) : 0) + 1;

         for await (const chunk of assemblyStream) {
             if (signal.aborted) return;
             finalCode = chunk;
             setPageData(activeProjectId, activePageId, (p) => ({
                 ...p,
                 generatedArtifact: { ...p.generatedArtifact, code: chunk, version: nextVersion }
             }));
         }

         const newArtifact = {
             code: finalCode,
             language: 'html',
             version: nextVersion,
             timestamp: Date.now(),
             commitMessage: 'Hierarchical Build'
         };

         setPageData(activeProjectId, activePageId, (p) => ({
            ...p,
            appState: 'ready',
            generatedArtifact: newArtifact,
            history: [...p.history, newArtifact]
         }));
         addMessageToActivePage(`系统构建完成 (v${nextVersion})。`, Sender.AI, AgentType.ASSEMBLER, undefined, undefined, nextVersion);
      }

    } catch (error) {
      if (signal.aborted) return;
      console.error("Process failed:", error);
      addMessageToActivePage("生成过程中发生错误，请重试。", Sender.SYSTEM);
      updateActivePage({ appState: 'idle' });
    } finally {
        if (abortControllerRef.current?.signal === signal) {
            abortControllerRef.current = null;
        }
    }
  }, [activePage, activeProjectId, activePageId, appSettings, addMessageToActivePage, updateActivePage, setPageData]);


  // --- Render ---

  if (!currentUser) {
      return <LoginScreen users={MOCK_USERS} onLogin={handleLogin} />;
  }

  // If logged in but no active page (loading state or empty project), handle gracefully
  if (!activePage) {
      return <div className="h-screen w-screen flex items-center justify-center bg-[#0F172A] text-slate-400">正在加载项目...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      <Header 
        projects={userProjects}
        activeProjectId={activeProjectId}
        activePageId={activePageId}
        currentUser={currentUser}
        onSelectProject={setActiveProjectId}
        onSelectPage={setActivePageId}
        onCreateProject={modalActions.openCreateProject}
        onCreatePage={modalActions.openCreatePage}
        onRenameProject={modalActions.openRenameProject}
        onRenamePage={modalActions.openRenamePage}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onShare={() => setIsShareOpen(true)}
      />
      
      <StepIndicator state={activePage.appState} />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Chat */}
        <div className="w-[400px] shrink-0 h-full flex flex-col z-20 shadow-xl shadow-black/20">
          <ChatArea 
            messages={activePage.messages} 
            onSendMessage={handleSendMessage} 
            onStop={handleStopGeneration}
            appState={activePage.appState}
            submitShortcut={appSettings.submitShortcut}
            currentVersion={activePage.generatedArtifact.version}
            onRestoreVersion={restoreVersionFromChat}
          />
        </div>

        {/* Right Panel: Workspace */}
        <div className="flex-1 h-full overflow-hidden bg-[#1E293B]">
           {/* Cast plan to any to avoid strict type issues in this legacy component for now, or update Workspace to handle ArchitectPlan too. 
               Given Workspace mainly displays 'implementation_steps', we might need to adjust it or pass null if ArchitectPlan doesn't match PlanData perfectly. 
               Ideally Workspace should be updated, but for now we focus on the generation logic. */}
           <Workspace 
            plan={activePage.currentPlan as any} 
            generatedArtifact={activePage.generatedArtifact}
            history={activePage.history}
            onRestoreVersion={handleRestoreVersion}
            appState={activePage.appState}
           />
        </div>
      </main>

      <InputModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        initialValue={modalConfig.defaultValue}
        onClose={modalActions.close}
        onSubmit={handleModalSubmit}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSettingsChange={handleSettingsChange}
        currentArtifact={activePage.generatedArtifact}
      />

      {/* Share Modal Integration */}
      {activePage && (
          <ShareModal 
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            artifact={activePage.generatedArtifact}
            projectName={activeProject.name}
            pageName={activePage.name}
          />
      )}
    </div>
  );
};

export default App;