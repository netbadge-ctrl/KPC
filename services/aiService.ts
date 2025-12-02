import { GoogleGenAI, Type } from "@google/genai";
import { PlanData, AppSettings, ArchitectPlan, ComponentSpec } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants
const DEFAULT_MODEL = 'gemini-3-pro-preview';
const FAST_MODEL = 'gemini-2.5-flash'; // Good for parallel workers

// Fallback Static Context
const STATIC_KPC_CONTEXT = `
KPC 组件库规范 (@king-design/vue):

1. 安装方式 (参考):
   - npm install @king-design/vue -S
   - 用法: app.use(KPC)

2. 核心组件 (前缀: k-):
   - Button 按钮: <k-button type="primary|secondary|danger|..." size="small|default">文本</k-button>
   - Card 卡片: <k-card title="...">内容...</k-card>
   - Cascader 级联选择: <k-cascader v-model="..." :data="..." />
   - 以及其他标准的 UI 组件。

3. 视觉风格:
   - 主色调 (Primary): #2563EB (蓝色 600)
   - 圆角 (Border Radius): 通常使用 rounded-lg
`;

// Helper: Vector DB Retrieval
const retrieveContext = async (query: string, settings?: AppSettings): Promise<string> => {
    if (!settings?.vectorDb?.enabled || !settings.vectorDb.endpoint) {
        return STATIC_KPC_CONTEXT;
    }

    try {
        console.log(`Retrieving context from ${settings.vectorDb.endpoint} for query: "${query}"`);
        
        const payload = {
            query: query,
            collection_name: settings.vectorDb.collection,
            top_k: settings.vectorDb.topK || 3
        };

        const response = await fetch(settings.vectorDb.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.vectorDb.apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Vector DB API responded with ${response.status}`);
        const data = await response.json();
        
        let docs: string[] = [];
        if (Array.isArray(data.documents)) docs = data.documents;
        else if (Array.isArray(data.results)) docs = data.results.map((r: any) => r.text || r.page_content || JSON.stringify(r));
        else if (data.text) docs = [data.text];

        if (docs.length > 0) {
            return `[检索增强系统 (RAG) 已激活]\n以下是从云端知识库检索到的 KPC 组件最新文档，请**优先**依据此文档编写代码：\n---\n${docs.join('\n\n')}\n---`;
        }
        return STATIC_KPC_CONTEXT;

    } catch (error) {
        console.warn("Vector DB Retrieval Failed, falling back to static context:", error);
        return STATIC_KPC_CONTEXT;
    }
};

// --- SYSTEM INSTRUCTIONS ---

const ARCHITECT_INSTRUCTION = `
你是一个名为 "KPC AI Forge" 的首席前端架构师。
你的任务是设计基于 @king-design/vue 的前端应用架构，采用**分层组件化**模式。

**核心任务：定义契约 (Shared Contract)**
为了让后续的 Worker 并行开发，你必须清晰定义组件之间的“通信接口”。

1. **Global State Definition**: 定义 Vue 3 的 reactive 状态结构，确保变量名统一 (例如: 统一叫 \`searchQuery\` 而不是 \`keyword\`)。
2. **Components**: 拆分 UI 为独立的组件 (e.g., SearchFilter, DataTable)。
3. **Contracts**: 对每个组件，明确定义 \`props\` (输入) 和 \`emits\` (输出事件) 的精确名称。

**约束**:
- 使用中文思考。
- 必须基于 Vue 3 Composition API。
- 必须使用 Tailwind CSS 布局策略。
`;

const WORKER_INSTRUCTION = `
你是一个高效的前端构建 Worker。
你的任务是实现**单个 Vue 组件**，必须严格遵守架构师给出的**接口契约**。

**输入**:
1. 组件名称
2. 接口契约 (Props & Emits)
3. KPC 文档上下文

**要求**:
1. 使用 \`defineComponent\` 定义组件。
2. **绝对不要**输出 \`createApp\` 或完整的 HTML 结构。只输出该组件的 JS 定义代码。
3. 组件模板 template 中使用 Tailwind CSS 和 KPC 组件 (\`k-\` 前缀)。
4. **Coherence**: 变量名必须与契约完全一致。

**输出格式**: 
只返回 JavaScript 代码块，例如:
\`\`\`javascript
const MyComponent = defineComponent({ ... });
\`\`\`
`;

const ASSEMBLER_INSTRUCTION = `
你是一个资深前端装配工 (Assembler)。
你的任务是将架构师的**设计**和 Workers 生成的**组件代码**组装成最终的 \`index.html\`。

**输入**:
1. 架构设计 (包含 Main App 逻辑)
2. 多个 Worker 生成的组件代码片段

**要求**:
1. 输出完整的 HTML5 文档。
2. 引入 Vue 3, Tailwind CSS CDN。
3. **模拟 NPM 库**: 创建 \`KingDesignVue\` 模拟对象 (Mock Lib)，包含 Mock 组件定义和 install 方法。
4. **注册组件**: 将 Worker 生成的代码放入脚本中，并确保它们能被正确引用。
5. **Main App**: 实现架构师定义的 \`setup()\` 逻辑，组合状态和方法。
6. **指令格式**: 确保包含 \`<!-- 组件库: npm install @king-design/vue -S -->\` 注释。

**输出格式**: 纯 HTML 代码。
`;

const PLANNER_INSTRUCTION = `
你是一个名为 "KPC AI Forge" 的首席前端架构师。
你的任务是分析用户的需求（可能是自然语言，也可能包含一张设计图/截图），并为基于 @king-design/vue 的项目设计开发计划。
输出结构化 JSON 数据。
`;

const REFINEMENT_INSTRUCTION = `
你是一个代码重构专家。分析现有代码和需求制定修改计划。
`;

const CODER_INSTRUCTION = `
你是一个资深前端工程师，擅长 Pixel-Perfect（像素级还原）的 UI 开发。
你的任务是根据设计计划生成 Vue 3 + Tailwind CSS 代码。
用户希望使用 NPM 包的方式引入组件库 (\`npm install @king-design/vue -S\`)。
`;

const REFINER_INSTRUCTION = `
你是一个代码维护专家。根据用户修改意见调整代码。
保持 Vue + Tailwind + KPC (Plugin Pattern) 结构。
只输出修改后的完整 HTML 代码，无 Markdown 标记。
`;


// Helper: Common Model Config
const getModelConfig = (settings: AppSettings | undefined, temperatureType: 'planning' | 'coding', responseMimeType?: string, responseSchema?: any) => {
    return {
        temperature: temperatureType === 'planning' ? settings?.planningTemperature : settings?.codingTemperature,
        responseMimeType,
        responseSchema
    };
};

const cleanCode = (text: string) => {
    const codeBlockRegex = /```(?:html|xml|vue|javascript|js)?\s*([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    return text.replace(/^```(html|xml|vue|javascript|js)?\s*/, '').replace(/\s*```$/, '').trim();
};

const buildContents = (text: string, imageBase64?: string) => {
    const parts: any[] = [];
    if (imageBase64) {
        const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
        }
    }
    parts.push({ text: text });
    return parts;
};

// --- HIERARCHICAL API FUNCTIONS ---

// 1. Architect Phase
export const generateArchitectPlan = async (prompt: string, imageBase64?: string, settings?: AppSettings): Promise<ArchitectPlan> => {
    const kpcContext = await retrieveContext(prompt, settings);
    const augmentedPrompt = `${prompt}\n\n参考文档/知识库:\n${kpcContext}`;
    
    const response = await ai.models.generateContent({
        model: settings?.model || DEFAULT_MODEL, // Architect needs strict logic, prefer Pro
        contents: buildContents(augmentedPrompt, imageBase64),
        config: {
            systemInstruction: ARCHITECT_INSTRUCTION,
            ...getModelConfig(settings, 'planning', "application/json", {
                type: Type.OBJECT,
                properties: {
                    thought_process: { type: Type.STRING },
                    global_state_definition: { type: Type.STRING, description: "Vue Reactive State definition (TS/JS)" },
                    components: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                props_contract: { type: Type.STRING, description: "Exact prop names and types" },
                                emits_contract: { type: Type.STRING, description: "Exact emit event names" }
                            },
                            required: ["name", "description", "props_contract", "emits_contract"]
                        }
                    },
                    main_logic_flow: { type: Type.STRING, description: "How to connect components in setup()" }
                },
                required: ["thought_process", "global_state_definition", "components", "main_logic_flow"]
            })
        }
    });

    if (response.text) {
        try {
            const parsed = JSON.parse(response.text);
            // Ensure components array exists to prevent App.tsx crash
            if (!parsed.components || !Array.isArray(parsed.components)) {
                parsed.components = [];
            }
            return parsed as ArchitectPlan;
        } catch (e) {
            console.error("JSON Parse Error", e);
            throw new Error("Architect returned invalid JSON");
        }
    }
    throw new Error("Architect failed to generate plan");
};

// 2. Worker Phase (Parallel)
export const generateComponentCode = async (spec: ComponentSpec, settings?: AppSettings): Promise<string> => {
    // Workers use Flash model for speed and parallelism
    // Retrieve specific context for this component?
    // Ideally we'd do a specific RAG lookup for the component type (e.g. Table vs Button)
    // For now, we rely on the specific prompt.
    const componentContext = await retrieveContext(spec.name + " " + spec.description, settings);

    const prompt = `
    任务: 实现组件 ${spec.name}
    描述: ${spec.description}
    
    【必须遵守的契约】:
    - Props: ${spec.props_contract}
    - Emits: ${spec.emits_contract}
    
    KPC 文档:
    ${componentContext}
    `;

    const response = await ai.models.generateContent({
        model: FAST_MODEL, // Use Flash for workers to be fast
        contents: prompt,
        config: {
            systemInstruction: WORKER_INSTRUCTION,
            ...getModelConfig(settings, 'coding') 
        }
    });

    return cleanCode(response.text || `// Worker failed for ${spec.name}`);
};

// 3. Assembly Phase (Streaming)
export const generateAssemblyStream = async function* (plan: ArchitectPlan, componentCodes: Record<string, string>, settings?: AppSettings) {
    const componentsStr = Object.entries(componentCodes)
        .map(([name, code]) => `/* --- Component: ${name} --- */\n${code}`)
        .join('\n\n');

    const prompt = `
    请将以下内容组装成完整的 index.html。
    
    1. 架构设计:
    ${JSON.stringify(plan)}
    
    2. 已生成的组件代码 (Workers Output):
    ${componentsStr}
    
    3. 任务:
    - 创建 HTML 骨架
    - 嵌入 Mock KPC Library (Button, Card 等基础组件)
    - 嵌入 Workers 的组件代码
    - 编写 Main App setup() 逻辑 (连接 Global State 和组件事件)
    `;

    yield* streamHelper(ASSEMBLER_INSTRUCTION, buildContents(prompt), settings);
};


// --- LEGACY/STANDARD API FUNCTIONS ---

async function* streamHelper(systemInstruction: string, contents: any[], settings?: AppSettings): AsyncGenerator<string, void, unknown> {
    try {
        const result = await ai.models.generateContentStream({
            model: settings?.model || DEFAULT_MODEL,
            contents: contents,
            config: {
                systemInstruction,
                ...getModelConfig(settings, 'coding')
            },
        });

        let accumulatedText = '';
        for await (const chunk of result) {
            const text = chunk.text;
            if (text) {
                accumulatedText += text;
                yield cleanCode(accumulatedText);
            }
        }
    } catch (error) {
        console.error("Stream Error", error);
        throw error;
    }
}

export const generatePlan = async (prompt: string, imageBase64?: string, settings?: AppSettings): Promise<PlanData> => {
  try {
    const kpcContext = await retrieveContext(prompt, settings);
    const augmentedPrompt = `${prompt}\n\n参考文档/知识库:\n${kpcContext}`;
    const contents = buildContents(augmentedPrompt, imageBase64);

    const response = await ai.models.generateContent({
      model: settings?.model || DEFAULT_MODEL,
      contents: contents,
      config: {
        systemInstruction: PLANNER_INSTRUCTION,
        ...getModelConfig(settings, 'planning', "application/json", {
          type: Type.OBJECT,
          properties: {
            thought_process: { type: Type.STRING },
            component_list: { type: Type.ARRAY, items: { type: Type.STRING } },
            layout_strategy: { type: Type.STRING },
            implementation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["thought_process", "component_list", "layout_strategy", "implementation_steps"],
        })
      },
    });

    if (response.text) return JSON.parse(response.text) as PlanData;
    throw new Error("AI 未返回有效计划");
  } catch (error) {
    return {
      thought_process: "AI 服务暂时繁忙。",
      component_list: [],
      layout_strategy: "默认布局",
      implementation_steps: ["重试"]
    };
  }
};

export const generateRefinementPlan = async (currentCode: string, instruction: string, settings?: AppSettings): Promise<PlanData> => {
  try {
    const response = await ai.models.generateContent({
      model: settings?.model || DEFAULT_MODEL,
      contents: `当前代码：\n${currentCode.substring(0, 5000)}...\n用户需求：${instruction}`,
      config: {
        systemInstruction: REFINEMENT_INSTRUCTION,
        ...getModelConfig(settings, 'planning', "application/json", {
          type: Type.OBJECT,
          properties: {
            thought_process: { type: Type.STRING },
            component_list: { type: Type.ARRAY, items: { type: Type.STRING } },
            layout_strategy: { type: Type.STRING },
            implementation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["thought_process", "component_list", "layout_strategy", "implementation_steps"],
        })
      },
    });
    if (response.text) return JSON.parse(response.text) as PlanData;
    throw new Error("AI Refinement Error");
  } catch (error) {
     return {
      thought_process: "直接进行代码修改。",
      component_list: [],
      layout_strategy: "保持原样",
      implementation_steps: ["执行用户指令"]
    };
  }
};

export const generateCodeStream = async function* (plan: PlanData, imageBase64?: string, settings?: AppSettings) {
    const query = `KPC 组件文档: ${plan.component_list.join(', ')} 的详细API定义和示例`;
    const kpcContext = await retrieveContext(query, settings);
    const promptText = `请严格根据以下设计计划生成代码，如果附带了图片，请务必 Pixel-Perfect 级还原图片中的所有细节（文字、颜色、间距、圆角）：\n${JSON.stringify(plan)}\n\nKPC Library Docs (@king-design/vue):\n${kpcContext}`;
    const contents = buildContents(promptText, imageBase64);
    yield* streamHelper(CODER_INSTRUCTION, contents, settings);
}

export const refineCodeStream = (currentCode: string, instruction: string, settings?: AppSettings) => {
    const promptText = `当前代码：\n${currentCode}\n修改要求：\n${instruction}`;
    const contents = buildContents(promptText);
    return streamHelper(REFINER_INSTRUCTION, contents, settings);
}