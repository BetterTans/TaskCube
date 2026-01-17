
import { Task, Priority, EisenhowerQuadrant, AISettings } from "../types";

// --- Adapter Interfaces ---

/**
 * AI 服务适配器接口 (Adapter Pattern)
 * 
 * 设计目的:
 * 将业务逻辑层（UI 组件）与底层的具体 AI 模型实现解耦。
 * 如果未来需要切换回 Google Gemini SDK、Claude SDK 或其他非 OpenAI 兼容的协议，
 * 只需新建一个实现此接口的类（例如 GeminiAdapter），而无需修改组件代码。
 */
export interface AIServiceAdapter {
  breakDownTask(taskTitle: string): Promise<string[]>;
  parseTaskFromNaturalLanguage(input: string, referenceDateStr: string): Promise<Partial<Task>>;
  generateProjectPlan(projectTitle: string, projectDesc?: string): Promise<{ title: string; priority: Priority; reason: string }[]>;
  prioritizeTasks(tasks: Task[]): Promise<{ taskId: string; priority: Priority; reason: string }[]>;
}

// --- Configuration Management ---

const DEFAULT_SETTINGS: AISettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.API_KEY || '',
  model: 'gpt-3.5-turbo'
};

const getSettings = (): AISettings => {
  const saved = localStorage.getItem('taskcube-ai-settings');
  if (saved) {
    return JSON.parse(saved);
  }
  return DEFAULT_SETTINGS;
};

// --- Base HTTP Helper ---

/**
 * 通用的 OpenAI 兼容接口调用函数
 * 处理 fetch 请求、鉴权、JSON 模式解析等通用逻辑
 */
const callOpenAICompatibleAPI = async (
  systemPrompt: string, 
  userPrompt: string,
  jsonMode: boolean = true
): Promise<any> => {
  const settings = getSettings();
  
  if (!settings.apiKey) {
    console.warn("API Key is missing. Please configure it in settings.");
    return null;
  }

  try {
    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        // 多数现代模型（GPT-4o, DeepSeek-V3）支持 response_format: { type: "json_object" }
        // 如果使用较旧模型可能需要移除此字段，并在 Prompt 中加强约束
        response_format: jsonMode ? { type: "json_object" } : undefined
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API Error:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (jsonMode && content) {
       // 清理可能存在的 Markdown 代码块标记，防止 JSON.parse 失败
       const cleanJson = content.replace(/```json\n?|\n?```/g, '');
       return JSON.parse(cleanJson);
    }

    return content;

  } catch (error) {
    console.error("AI Service Error:", error);
    return null;
  }
};

// --- Concrete Adapter Implementation: OpenAI / Compatible ---

class OpenAIAdapter implements AIServiceAdapter {
  
  async breakDownTask(taskTitle: string): Promise<string[]> {
    const systemPrompt = `你是一个任务拆解专家。请将用户给出的任务分解为 3-5 个简明扼要、可执行的子任务。
    请直接返回 JSON 格式，不要包含任何其他废话。
    格式要求: { "subtasks": ["子任务1", "子任务2", ...] }`;
    
    const result = await callOpenAICompatibleAPI(systemPrompt, `需拆解的任务: "${taskTitle}"`);
    return result?.subtasks || [];
  }

  async parseTaskFromNaturalLanguage(input: string, referenceDateStr: string): Promise<Partial<Task>> {
    const d = new Date();
    const offset = d.getTimezoneOffset() * 60000;
    const todayStr = new Date(d.getTime() - offset).toISOString().split('T')[0];

    const systemPrompt = `
      Context:
      - Today: ${todayStr} (YYYY-MM-DD)
      - Default Date: ${referenceDateStr} (YYYY-MM-DD)
      
      Role: You are a JSON parser extracting task details from natural language.
      
      Rules:
      1. Extract 'date' relative to Today. If no date mentioned, use Default Date.
      2. Extract 'startTime' in HH:mm (24h) if mentioned.
      3. Infer 'priority' (High/Medium/Low) and Eisenhower 'quadrant' (Q1/Q2/Q3/Q4).
      4. Duration defaults to 60 if not specified.
      
      Return strict JSON format:
      {
        "title": "string",
        "date": "YYYY-MM-DD",
        "startTime": "HH:mm" or null,
        "duration": number,
        "priority": "High"|"Medium"|"Low",
        "quadrant": "Q1"|"Q2"|"Q3"|"Q4",
        "description": "string"
      }
    `;

    const result = await callOpenAICompatibleAPI(systemPrompt, `User Input: "${input}"`);

    if (!result) return { title: input };

    const task: Partial<Task> = {
      title: result.title || input,
      date: result.date || referenceDateStr,
      priority: (result.priority as Priority) || Priority.MEDIUM,
      quadrant: (result.quadrant as EisenhowerQuadrant) || EisenhowerQuadrant.Q2,
      description: result.description
    };

    if (result.startTime) {
      task.startTime = result.startTime;
      task.duration = result.duration || 60;
    }

    return task;
  }

  async generateProjectPlan(projectTitle: string, projectDesc?: string): Promise<{ title: string; priority: Priority; reason: string }[]> {
    const systemPrompt = `你是一个项目管理专家。请为一个项目制定初步执行计划。
    列出 3-6 个关键的下一步行动 (Tasks)。
    请返回 JSON 格式。
    格式要求: { "tasks": [{ "title": "任务名", "priority": "High"|"Medium"|"Low", "reason": "理由" }] }`;

    const userPrompt = `项目名称: "${projectTitle}"\n${projectDesc ? `项目描述: ${projectDesc}` : ''}`;

    const result = await callOpenAICompatibleAPI(systemPrompt, userPrompt);
    
    return (result?.tasks || []).map((t: any) => ({
      title: t.title,
      priority: t.priority as Priority,
      reason: t.reason
    }));
  }

  async prioritizeTasks(tasks: Task[]): Promise<{ taskId: string; priority: Priority; reason: string }[]> {
    if (tasks.length === 0) return [];
    
    const systemPrompt = `你是一个时间管理大师。分析任务列表，根据紧迫性和重要性分配优先级。
    返回 JSON 格式: { "orders": [{ "taskId": "id", "priority": "High"|"Medium"|"Low", "reason": "简短理由" }] }`;

    const taskSummaries = tasks.map(t => ({ id: t.id, title: t.title }));
    const result = await callOpenAICompatibleAPI(systemPrompt, JSON.stringify(taskSummaries));

    return (result?.orders || []).map((o: any) => ({
      taskId: o.taskId,
      reason: o.reason,
      priority: o.priority as Priority
    }));
  }
}

// --- Export Singleton Instance ---

const aiAdapter = new OpenAIAdapter();

// 导出包装函数，保持对外的 API 简洁
export const breakDownTask = (title: string) => aiAdapter.breakDownTask(title);
export const parseTaskFromNaturalLanguage = (input: string, refDate: string) => aiAdapter.parseTaskFromNaturalLanguage(input, refDate);
export const generateProjectPlan = (title: string, desc?: string) => aiAdapter.generateProjectPlan(title, desc);
export const prioritizeTasksAI = (tasks: Task[]) => aiAdapter.prioritizeTasks(tasks);
