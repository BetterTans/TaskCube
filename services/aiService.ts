import { AISettings, Task, Priority, EisenhowerQuadrant } from "../types";

// Helper to get settings from localStorage
const getSettings = (): AISettings => {
    const saved = localStorage.getItem('taskcube-ai-settings');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Could not parse AI settings, using default.", e);
        }
    }
    return {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-3.5-turbo'
    };
};

// Generic function to call an OpenAI-compatible API
const callAI = async (messages: {role: string; content: string}[], expectJson: boolean) => {
    const settings = getSettings();
    if (!settings.apiKey) {
        console.warn("AI API Key is not set in settings.");
        throw new Error("API Key is not configured.");
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
    };

    const body: any = {
        model: settings.model,
        messages,
        temperature: 0.3,
    };
    
    // Enable JSON mode if supported by the model/endpoint
    if (expectJson) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${settings.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("AI API Error:", errorText);
        throw new Error(`AI request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    if (expectJson) {
        try {
            // The content itself is a JSON string that needs to be parsed
            return JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse AI JSON response:", content);
            throw new Error("AI returned invalid JSON.");
        }
    }
    return content;
};


/**
 * Breaks down a task title into a list of subtasks using AI.
 */
export const breakDownTask = async (taskTitle: string): Promise<string[]> => {
    const messages = [
        { role: 'system', content: "You are a task breakdown expert. Break down the user's task into a JSON array of 3-5 concise, actionable subtask strings. Your response must be a valid JSON object with a single key 'subtasks' which is an array of strings." },
        { role: 'user', content: `Task to break down: "${taskTitle}"` }
    ];

    try {
        const result = await callAI(messages, true);
        if (result && Array.isArray(result.subtasks)) {
            return result.subtasks;
        }
        return [];
    } catch (error) {
        console.error("AI Service Error (breakDownTask):", error);
        alert("智能拆解失败，请检查AI设置或网络连接。");
        return [];
    }
};

/**
 * Parses task details from a natural language string.
 */
export const parseTaskFromNaturalLanguage = async (input: string, referenceDateStr: string): Promise<Partial<Task>> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are a JSON parser extracting task details from natural language.
Context:
- Today's Date: ${todayStr} (YYYY-MM-DD)
- Default Date (if none specified): ${referenceDateStr} (YYYY-MM-DD)
Rules:
1. Extract 'title' as a clean version of the task, without time/date info.
2. Extract 'date' in YYYY-MM-DD format.
3. Extract 'startTime' in HH:mm (24h) format.
4. Extract 'duration' in minutes. Default to 60 if a start time is present but no duration.
5. Infer 'priority' (High, Medium, Low) and Eisenhower 'quadrant' (Q1, Q2, Q3, Q4).
Your response must be a valid JSON object with the extracted fields.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this: "${input}"` }
    ];

    try {
        const result = await callAI(messages, true);
        const task: Partial<Task> = {};
        if (result.title) task.title = result.title;
        if (result.date) task.date = result.date;
        if (result.priority && Object.values(Priority).includes(result.priority)) task.priority = result.priority;
        if (result.quadrant && Object.values(EisenhowerQuadrant).includes(result.quadrant)) task.quadrant = result.quadrant;
        if (result.description) task.description = result.description;
        if (result.startTime) {
            task.startTime = result.startTime;
            task.duration = result.duration || 60;
        }
        return task;
    } catch (error) {
        console.error("AI Service Error (parseTaskFromNaturalLanguage):", error);
        alert("智能识别失败，请检查AI设置。将仅使用输入内容作为标题。");
        return { title: input }; // Fallback
    }
};

/**
 * Generates a preliminary project plan with key tasks.
 */
export const generateProjectPlan = async (projectTitle: string, projectDesc?: string): Promise<{ title: string; priority: Priority; reason: string }[]> => {
    const systemPrompt = `You are a project management expert. Create a preliminary action plan for a project.
List 3-5 key next actions (Tasks).
Your response must be a valid JSON object with a single key 'tasks', containing an array of objects.
Each object must have 'title' (string), 'priority' (enum: High, Medium, Low), and 'reason' (string).`;
    
    const userPrompt = `Project Name: "${projectTitle}"\n${projectDesc ? `Project Description: ${projectDesc}` : ''}`;
    
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    try {
        const result = await callAI(messages, true);
        if (result && Array.isArray(result.tasks)) {
            return result.tasks;
        }
        return [];
    } catch (error) {
        console.error("AI Service Error (generateProjectPlan):", error);
        alert("生成项目计划失败，请检查AI设置。");
        return [];
    }
};

/**
 * Analyzes a list of tasks and assigns priorities.
 */
export const prioritizeTasksAI = async (tasks: Task[]): Promise<{ taskId: string; priority: Priority; reason: string }[]> => {
    if (tasks.length === 0) return [];
    
    const taskSummaries = tasks.map(t => ({ id: t.id, title: t.title, currentPriority: t.priority }));
    const systemPrompt = `You are a time management master. Analyze the provided JSON list of tasks.
Re-assign a priority (High, Medium, Low) to each task based on inferred urgency and importance.
Your response must be a valid JSON object with a key 'orders', containing an array of objects.
Each object must have 'taskId' (string), 'priority' (enum: High, Medium, Low), and a brief 'reason' (string).`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(taskSummaries) }
    ];

    try {
        const result = await callAI(messages, true);
        if (result && Array.isArray(result.orders)) {
            return result.orders;
        }
        return [];
    } catch (error) {
        console.error("AI Service Error (prioritizeTasksAI):", error);
        return [];
    }
};