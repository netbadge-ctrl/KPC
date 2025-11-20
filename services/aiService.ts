import { GoogleGenAI, Type } from "@google/genai";
import { PlanData } from "../types";

// Initialize Gemini Client
// The API key is securely loaded from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// System Instructions for the Agents
const PLANNER_SYSTEM_INSTRUCTION = `
你是一个名为 "KPC AI Forge" 的首席前端架构师。
你的任务是分析用户的自然语言需求，并为 KPC 组件库（一个虚构的、类似 Element Plus 的企业级 Vue 组件库）设计开发计划。

请严格遵循以下规则：
1. 必须使用中文回复。
2. 必须返回结构化的 JSON 数据。
3. 组件列表仅限于 KPC 组件（如 KPC/Button, KPC/Table, KPC/Form 等）。
4. 布局策略应简洁明了，适合 Tailwind CSS 实现。
`;

const CODER_SYSTEM_INSTRUCTION = `
你是一个资深前端工程师。你的任务是根据开发计划生成可执行的代码。

技术栈要求：
1. HTML5 单文件结构。
2. 使用 Vue 3 (通过 CDN: https://unpkg.com/vue@3/dist/vue.global.js)。
3. 使用 Tailwind CSS (通过 CDN: https://cdn.tailwindcss.com)。
4. **核心要求**：由于 "KPC 组件库" 是虚构的，你必须在 <style> 标签中手动实现 .k-btn, .k-input, .k-card, .k-table 等基础样式，使其看起来像一个专业的企业级组件库（风格类似 Ant Design 或 Element Plus，主色调为蓝色 #2563EB）。

输出要求：
1. 只输出纯 HTML 代码，不要包含 Markdown 代码块标记（如 \`\`\`html）。
2. 代码必须是可以直接在浏览器中运行的完整文件。
3. 确保交互逻辑（如点击事件、表单绑定）是可用的。
`;

const REFINER_SYSTEM_INSTRUCTION = `
你是一个代码维护专家。你的任务是根据用户的修改意见，对现有的 HTML 代码进行调整。
请保持原有的代码结构（Vue + Tailwind + KPC CSS），仅根据用户需求进行必要的修改。
只输出修改后的完整 HTML 代码，不要包含 Markdown 标记。
`;

export const generatePlan = async (prompt: string): Promise<PlanData> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: PLANNER_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought_process: { type: Type.STRING, description: "分析用户的需求和业务场景" },
            component_list: { type: Type.ARRAY, items: { type: Type.STRING }, description: "需要的组件列表" },
            layout_strategy: { type: Type.STRING, description: "页面布局结构描述" },
            implementation_steps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "具体的实现步骤" },
          },
          required: ["thought_process", "component_list", "layout_strategy", "implementation_steps"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as PlanData;
    }
    throw new Error("AI 未返回有效计划");
  } catch (error) {
    console.error("Generate Plan Error:", error);
    // Fallback structure if AI fails
    return {
      thought_process: "AI 服务暂时繁忙，无法生成详细思考过程。",
      component_list: [],
      layout_strategy: "默认布局",
      implementation_steps: ["请重试"]
    };
  }
};

export const generateCode = async (plan: PlanData): Promise<string> => {
  try {
    const userPrompt = `请根据以下设计计划生成代码：\n${JSON.stringify(plan)}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: CODER_SYSTEM_INSTRUCTION,
      },
    });

    let code = response.text || "<!-- 代码生成失败 -->";
    // Cleanup markdown if present (just in case)
    code = code.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    return code;
  } catch (error) {
    console.error("Generate Code Error:", error);
    return `<!-- 错误: ${error instanceof Error ? error.message : '未知错误'} -->`;
  }
};

export const refineCode = async (currentCode: string, instruction: string): Promise<string> => {
  try {
    const userPrompt = `
    当前代码：
    ${currentCode}

    修改要求：
    ${instruction}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: REFINER_SYSTEM_INSTRUCTION,
      },
    });

    let code = response.text || currentCode;
    code = code.replace(/^```html\s*/, '').replace(/\s*```$/, '');
    return code;
  } catch (error) {
    console.error("Refine Code Error:", error);
    return currentCode;
  }
};
