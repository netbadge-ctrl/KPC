import { GoogleGenAI, Type } from "@google/genai";
import { PlanData, AppSettings } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Constants
const DEFAULT_MODEL = 'gemini-3-pro-preview';

// Instructions
const PLANNER_INSTRUCTION = `
你是一个名为 "KPC AI Forge" 的首席前端架构师。
你的任务是分析用户的需求（可能是自然语言，也可能包含一张设计图/截图），并为 KPC 组件库设计开发计划。

核心规则：
1. **视觉还原优先**：如果用户提供了图片，必须仔细分析图片中的**布局结构、配色方案（提取十六进制代码）、字体大小关系、间距**。
2. **内容提取与语言**：如果图片中有文字，必须在 thought_process 中提及。**如果用户没有提供具体文案，必须默认为组件设计合理的中文文案（Chinese）**，不要使用 Lorem Ipsum 或英文（除非用户明确要求）。
3. **KPC 组件映射**：将视觉元素准确映射到 KPC 组件（如 KPC/Card, KPC/Button, KPC/Input）。
4. **Tailwind 布局**：在 layout_strategy 中明确 Flexbox/Grid 的具体用法（例如：'使用 flex-col 垂直居中，gap-4 控制间距'）。

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
你的任务是根据设计计划（以及可能提供的参考截图）生成 Vue 3 + Tailwind CSS 代码。

核心要求：
1. **进度追踪（非常重要）**：
   - 你**必须**严格按照 plan.implementation_steps 的顺序编写代码。
   - **每当你开始实现第 n 个步骤时**，请在代码合适的位置（通常是相关 HTML 结构之前或 <script> 逻辑之前）插入一行注释标记：\`<!-- [KPC:STEP:n] -->\` (n 为 1, 2, 3...)。
   - 前端系统会解析这个标记来向用户展示进度打勾。请务必包含这些注释！

2. **语言要求（默认中文）**：
   - **除非用户明确指定了其他语言（如“生成英文版”），否则页面中的所有可见文本（标题 H1、段落 P、按钮 Button、输入框 Placeholder、提示信息 Alert 等）必须强制使用中文。**
   - 不要生成 "Lorem Ipsum"，请根据场景生成逼真的**中文模拟数据**（例如：用户名使用“张三”，地址使用“北京市...”）。

3. **参考图绝对优先**：如果提供了参考图，请忽略通用的设计规范，**全力复刻图中的每一个细节**（圆角大小、阴影深度、文字颜色、元素间距）。使用 Tailwind 的任意值语法（如 text-[#333] w-[320px] shadow-[0_4px_12px_rgba(0,0,0,0.1)]）来达到 1:1 还原。
4. **技术栈**：HTML5 单文件, Vue 3 (CDN), Tailwind CSS (CDN)。
5. **样式实现**：
   - 虽然我们使用 "KPC" 组件名义，但你需要**手动实现**这些组件的样式，使其看起来像截图中的样子。
   - 在 <style> 标签中编写必要的自定义 CSS，覆盖默认样式以匹配截图。
   - 按钮、输入框的 padding、border-radius 必须精确。
6. **完整性**：输出完整的 HTML 代码，包含 <html>, <head>, <body>。不要省略代码。
7. **交互**：为按钮添加简单的 click 交互（如 alert），表单添加 submit 阻止默认行为。

输出格式：纯 HTML 代码，无 Markdown 标记。
`;

const REFINER_INSTRUCTION = `
你是一个代码维护专家。根据用户修改意见调整代码。
保持 Vue + Tailwind + KPC CSS 结构。
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
    const contents = buildContents(prompt || "请分析这张图片并生成前端开发计划。", imageBase64);

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

export const generateCodeStream = (plan: PlanData, imageBase64?: string, settings?: AppSettings) => {
    // We pass the plan as text, and attach the image if available so the Coder can see it too.
    const promptText = `请严格根据以下设计计划生成代码，如果附带了图片，请务必 Pixel-Perfect 级还原图片中的所有细节（文字、颜色、间距、圆角）：\n${JSON.stringify(plan)}`;
    const contents = buildContents(promptText, imageBase64);
    return streamHelper(CODER_INSTRUCTION, contents, settings);
}

export const refineCodeStream = (currentCode: string, instruction: string, settings?: AppSettings) => {
    const promptText = `当前代码：\n${currentCode}\n修改要求：\n${instruction}`;
    // Currently refinement doesn't support image input in this UI flow, but streamHelper supports it if we wanted to add it later.
    const contents = buildContents(promptText);
    return streamHelper(REFINER_INSTRUCTION, contents, settings);
}