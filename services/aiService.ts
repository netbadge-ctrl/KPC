import { GoogleGenAI, Type } from "@google/genai";
import { PlanData, AppSettings } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants
const DEFAULT_MODEL = 'gemini-3-pro-preview';

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
// Expects a standard POST request returning { documents: string[] } or similar.
// Adapters can be added here for specific vendors (Pinecone, Milvus, etc.)
const retrieveContext = async (query: string, settings?: AppSettings): Promise<string> => {
    if (!settings?.vectorDb?.enabled || !settings.vectorDb.endpoint) {
        console.log("Vector DB disabled or missing endpoint, using static context.");
        return STATIC_KPC_CONTEXT;
    }

    try {
        console.log(`Retrieving context from ${settings.vectorDb.endpoint} for query: "${query}"`);
        
        // Generic RAG Payload
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

        if (!response.ok) {
            throw new Error(`Vector DB API responded with ${response.status}`);
        }

        const data = await response.json();
        
        // Flexible parsing strategies for common RAG response formats
        let docs: string[] = [];
        if (Array.isArray(data.documents)) {
            docs = data.documents; // Simple array of strings
        } else if (Array.isArray(data.results)) {
             docs = data.results.map((r: any) => r.text || r.page_content || JSON.stringify(r)); // Common vector result wrappers
        } else if (data.text) {
            docs = [data.text];
        }

        if (docs.length > 0) {
            const dynamicContext = `
[检索增强系统 (RAG) 已激活]
以下是从云端知识库检索到的 KPC 组件最新文档，请**优先**依据此文档编写代码：
---
${docs.join('\n\n')}
---
`;
            return dynamicContext;
        }

        return STATIC_KPC_CONTEXT;

    } catch (error) {
        console.warn("Vector DB Retrieval Failed, falling back to static context:", error);
        return STATIC_KPC_CONTEXT;
    }
};

// Instructions
const PLANNER_INSTRUCTION = `
你是一个名为 "KPC AI Forge" 的首席前端架构师。
你的任务是分析用户的需求（可能是自然语言，也可能包含一张设计图/截图），并为基于 @king-design/vue 的项目设计开发计划。

核心规则：
1. **视觉还原优先**：如果用户提供了图片，必须仔细分析图片中的**布局结构、配色方案（提取十六进制代码）、字体大小关系、间距**。
2. **KPC 组件映射**：优先使用提供的 KPC 组件上下文。
3. **内容提取与语言**：如果图片中有文字，必须在 thought_process 中提及。**如果用户没有提供具体文案，必须默认为组件设计合理的中文文案（Chinese）**。
4. **Tailwind 布局**：在 layout_strategy 中明确 Flexbox/Grid 的具体用法。

输出要求：
1. 必须使用中文回复。
2. 必须返回结构化的 JSON 数据。
`;

const REFINEMENT_INSTRUCTION = `
你是一个代码重构专家。分析现有代码和需求制定修改计划。
规则：
1. 必须使用中文回复。
2. 必须返回结构化的 JSON 数据。
3. 重点分析 DOM 结构或 CSS 类修改。
4. "implementation_steps" 列出具体的修改步骤。
`;

const CODER_INSTRUCTION = `
你是一个资深前端工程师，擅长 Pixel-Perfect（像素级还原）的 UI 开发。
你的任务是根据设计计划生成 Vue 3 + Tailwind CSS 代码。
用户希望使用 NPM 包的方式引入组件库 (\`npm install @king-design/vue\`)。

核心要求：
1. **模拟 NPM 库架构 (Crucial)**：
   - 由于这是单文件预览环境，不能真的运行 npm install。
   - **必须**在 <script> 中创建一个名为 \`KingDesignVue\` 的全局对象来**模拟**这个库。
   - 这个对象必须包含 mock 组件定义 (使用 Tailwind 模拟样式) 和一个 \`install\` 方法 (Vue Plugin 格式)。
   - 在主逻辑中，使用 \`const { Button, Card } = KingDesignVue;\` 来模拟解构引入。
   - 使用 \`app.use(KingDesignVue);\` 来模拟插件安装。

2. **组件实现细节**：
   - 必须使用 \`k-\` 前缀 (如 <k-button>, <k-card>)，这是 KPC 的标准。
   - 组件实现应使用 Tailwind CSS 模拟 KPC 的视觉风格 (Primary Blue: #2563EB)。
   - **参考上下文文档**：如果提供了具体的 Props 或 Events 文档，请严格遵守。
   - **交互性**：组件应当是可交互的 (Button hover 效果, Input v-model 支持等)。

3. **进度追踪**：
   - 严格按照 plan.implementation_steps 顺序编写代码。
   - 在每个步骤代码前插入注释标记：\`<!-- [KPC:STEP:n] -->\`。

4. **代码结构**：
   - 输出完整的 HTML (<!DOCTYPE html>...</html>)。
   - 引入 Vue 3 Global CDN 和 Tailwind CDN。
   - 结构顺序：Mock Library Script -> Main App Script -> HTML Body。

输出格式：纯 HTML 代码，无 Markdown 标记。
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
    // First, check if there is a markdown code block pattern
    const codeBlockRegex = /```(?:html|xml|vue)?\s*([\s\S]*?)```/;
    const match = text.match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    // Fallback: strict cleanup if it starts with backticks but maybe lacks end, or just pure code
    return text.replace(/^```(html|xml|vue)?\s*/, '').replace(/\s*```$/, '').trim();
};

// Helper to construct content with optional image
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

export const generatePlan = async (prompt: string, imageBase64?: string, settings?: AppSettings): Promise<PlanData> => {
  try {
    // RAG Step: Retrieve relevant KPC docs based on user prompt
    const kpcContext = await retrieveContext(prompt, settings);
    
    // Inject retrieved context into the prompt for the Planner
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
            thought_process: { type: Type.STRING, description: "视觉与布局分析（包含颜色、字体、间距的观察）" },
            component_list: { type: Type.ARRAY, items: { type: Type.STRING }, description: "组件列表" },
            layout_strategy: { type: Type.STRING, description: "布局策略 (Tailwind 类名建议)" },
            implementation_steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "实现步骤" },
          },
          required: ["thought_process", "component_list", "layout_strategy", "implementation_steps"],
        })
      },
    });

    if (response.text) return JSON.parse(response.text) as PlanData;
    throw new Error("AI 未返回有效计划");
  } catch (error) {
    console.error("Generate Plan Error:", error);
    // Fallback for UI stability
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

export const generateCodeStream = async function* (plan: PlanData, imageBase64?: string, settings?: AppSettings) {
    // RAG Step: Retrieve context specifically for the required components
    // Use component list as query to get specific API docs
    const query = `KPC 组件文档: ${plan.component_list.join(', ')} 的详细API定义和示例`;
    const kpcContext = await retrieveContext(query, settings);

    const promptText = `请严格根据以下设计计划生成代码，如果附带了图片，请务必 Pixel-Perfect 级还原图片中的所有细节（文字、颜色、间距、圆角）：\n${JSON.stringify(plan)}\n\nKPC Library Docs (@king-design/vue):\n${kpcContext}`;
    const contents = buildContents(promptText, imageBase64);
    
    yield* streamHelper(CODER_INSTRUCTION, contents, settings);
}

export const refineCodeStream = (currentCode: string, instruction: string, settings?: AppSettings) => {
    const promptText = `当前代码：\n${currentCode}\n修改要求：\n${instruction}`;
    // Currently refinement doesn't support image input in this UI flow, but streamHelper supports it if we wanted to add it later.
    const contents = buildContents(promptText);
    return streamHelper(REFINER_INSTRUCTION, contents, settings);
}