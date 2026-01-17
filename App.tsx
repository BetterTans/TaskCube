import React, { useState, useEffect } from 'react';
import { Task, SubTask, Priority, RecurringRule, EisenhowerQuadrant, Project, AISettings, ThemeMode } from './types';
import { generateTasksFromRule } from './services/recurringService';
import { FullCalendar } from './components/FullCalendar';
import { TableView } from './components/TableView';
import { DayTimeView } from './components/DayTimeView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { DayTaskListModal } from './components/DayTaskListModal';
import { RecurringManager } from './components/RecurringManager';
import { ProjectListModal } from './components/ProjectListModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { Button } from './components/Button';
import { Calendar as CalendarIcon, Table as TableIcon, Repeat, Briefcase, Box, Clock, ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

// 获取今天的 YYYY-MM-DD 字符串
const getTodayString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const TODAY = getTodayString();

// 默认 AI 设置
const DEFAULT_AI_SETTINGS: AISettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: process.env.API_KEY || '',
  model: 'gpt-3.5-turbo'
};

// 视图模式类型
type ViewMode = 'calendar' | 'day' | 'table';

export default function App() {
  // --- 核心状态管理 (使用 IndexedDB + useLiveQuery) ---
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const recurringRules = useLiveQuery(() => db.recurringRules.toArray()) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  
  // 设置和主题仍然保留在 LocalStorage 中，因为它们体积小且不常变动
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // 视图状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // --- 模态框可见性状态 ---
  const [isModalOpen, setIsModalOpen] = useState(false); // 任务详情/编辑
  const [isRecurManagerOpen, setIsRecurManagerOpen] = useState(false); // 周期规则管理
  const [isProjectListOpen, setIsProjectListOpen] = useState(false); // 项目列表
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 设置
  
  // --- 选中项状态 ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null); 
  const [selectedDateStr, setSelectedDateStr] = useState<string>(TODAY);
  
  // 新建任务时的初始预设
  const [newTaskInitialTime, setNewTaskInitialTime] = useState<string | undefined>(undefined);
  const [newTaskInitialProjectId, setNewTaskInitialProjectId] = useState<string | null>(null);

  // 派生状态：当前选中的项目对象
  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  // --- 初始化与设置持久化 ---
  useEffect(() => {
    const savedSettings = localStorage.getItem('taskcube-ai-settings');
    const savedTheme = localStorage.getItem('taskcube-theme');
    
    if (savedSettings) {
      try { setAiSettings(JSON.parse(savedSettings)); } catch (e) { console.error("Failed to parse settings"); }
    }
    if (savedTheme) {
      setTheme(savedTheme as ThemeMode);
    } else {
       if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
       }
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('taskcube-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // 主题切换副作用
  useEffect(() => {
    localStorage.setItem('taskcube-theme', theme);
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // --- 周期性任务自动生成 ---
  useEffect(() => {
    if (recurringRules.length === 0) return;
    
    const generate = async () => {
       const allTasks = await db.tasks.toArray();
       const newTasks: Task[] = [];
       recurringRules.forEach(rule => {
         // 这里我们假设 generateTasksFromRule 纯逻辑函数依然可用
         // 注意：此函数内部逻辑需要确保不会生成重复 ID 的任务
         const generated = generateTasksFromRule(rule, allTasks);
         if (generated.length > 0) {
            newTasks.push(...generated);
         }
       });
       
       if (newTasks.length > 0) {
          await db.tasks.bulkAdd(newTasks);
       }
    };
    
    generate();
  }, [recurringRules]); // 当规则列表变化时检查生成

  // --- 导航控制 ---
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // --- 任务操作处理函数 (Dexie API) ---

  const handleDateClick = (dateStr: string) => {
    const clickedDate = new Date(dateStr);
    const d = new Date(clickedDate.getUTCFullYear(), clickedDate.getUTCMonth(), clickedDate.getUTCDate());
    setCurrentDate(d);
    setViewMode('day');
  };

  const openNewTaskModal = (dateStr?: string, time?: string) => {
    setSelectedDateStr(dateStr || getTodayString());
    setEditingTask(null);
    setEditingRule(null);
    setNewTaskInitialProjectId(null);
    setNewTaskInitialTime(time);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedDateStr(task.date);
    setEditingTask(task);
    setEditingRule(null);
    setNewTaskInitialProjectId(null);
    setIsModalOpen(true);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
       await db.tasks.update(id, { completed: !task.completed });
    }
  }

  const saveTask = async (taskData: Partial<Task>, ruleData?: Partial<RecurringRule>) => {
    if (ruleData) {
      // 创建新的周期规则
      const newRule: RecurringRule = {
        id: crypto.randomUUID(),
        title: ruleData.title!,
        description: ruleData.description,
        priority: ruleData.priority || Priority.MEDIUM,
        quadrant: ruleData.quadrant || EisenhowerQuadrant.Q2,
        frequency: ruleData.frequency!,
        interval: ruleData.interval || 1,
        weekDays: ruleData.weekDays,
        startDate: ruleData.startDate!,
        endDate: ruleData.endDate,
        startTime: ruleData.startTime,
        duration: ruleData.duration,
        createdAt: Date.now(),
        projectId: ruleData.projectId,
        subTaskTitles: ruleData.subTaskTitles
      };
      await db.recurringRules.add(newRule);
    } else if (taskData.id) {
      // 更新现有任务
      await db.tasks.update(taskData.id, taskData);
    } else {
      // 创建新单次任务
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title!,
        description: taskData.description,
        priority: taskData.priority || Priority.MEDIUM,
        quadrant: taskData.quadrant || EisenhowerQuadrant.Q2,
        date: taskData.date || selectedDateStr,
        startTime: taskData.startTime,
        duration: taskData.duration,
        completed: false,
        subTasks: taskData.subTasks || [],
        createdAt: Date.now(),
        isExpanded: false,
        projectId: taskData.projectId
      };
      await db.tasks.add(newTask);
    }
  };

  const updateRecurringRule = async (ruleId: string, ruleData: Partial<RecurringRule>) => {
    await db.recurringRules.update(ruleId, ruleData);

    // 同步更新属于该规则且未完成的任务
    // Dexie 可以使用 Collection.modify，但这里我们先查找再更新以保持逻辑一致
    const relatedTasks = await db.tasks.where('recurringRuleId').equals(ruleId).toArray();
    const activeTasks = relatedTasks.filter(t => !t.completed);
    
    if (activeTasks.length > 0) {
       // 批量更新
       const updates = activeTasks.map(t => ({
          key: t.id,
          changes: {
            title: ruleData.title || t.title,
            description: ruleData.description !== undefined ? ruleData.description : t.description,
            priority: ruleData.priority || t.priority,
            quadrant: ruleData.quadrant || t.quadrant,
            projectId: ruleData.projectId !== undefined ? ruleData.projectId : t.projectId,
            startTime: ruleData.startTime !== undefined ? ruleData.startTime : t.startTime,
            duration: ruleData.duration !== undefined ? ruleData.duration : t.duration,
          }
       }));
       
       for(const update of updates) {
          await db.tasks.update(update.key, update.changes);
       }
    }
  };

  const deleteTask = async (id: string) => {
    await db.tasks.delete(id);
  };

  const deleteRule = async (ruleId: string) => {
    if (window.confirm("确定要删除这个周期规则吗？将同时删除所有未来生成的任务。")) {
      await db.recurringRules.delete(ruleId);
      // 删除关联的未完成任务
      const relatedTasks = await db.tasks.where('recurringRuleId').equals(ruleId).toArray();
      const toDelete = relatedTasks.filter(t => !t.completed).map(t => t.id);
      await db.tasks.bulkDelete(toDelete);
    }
  };

  // --- 项目操作 ---
  const handleCreateProject = async (projectData: Partial<Project>) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: projectData.title!,
      description: projectData.description,
      status: 'active',
      progress: 0,
      startDate: projectData.startDate || TODAY,
      logs: [],
      createdAt: Date.now(),
      ...projectData
    } as Project;
    await db.projects.add(newProject);
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    await db.projects.update(id, updates);
  };

  const deleteProject = async (id: string) => {
    await db.projects.delete(id);
    // 解除任务与该项目的关联
    const projectTasks = await db.tasks.where('projectId').equals(id).toArray();
    for (const task of projectTasks) {
       await db.tasks.update(task.id, { projectId: undefined });
    }
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  // --- 辅助函数 ---
  const getActiveRecurringRule = () => {
    if (editingRule) return editingRule;
    if (editingTask?.recurringRuleId) {
      return recurringRules.find(r => r.id === editingTask.recurringRuleId);
    }
    return undefined;
  };

  const getHeaderTitle = () => {
    if (viewMode === 'calendar') {
       return `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`;
    } else if (viewMode === 'day') {
       const today = new Date().toISOString().split('T')[0];
       const currentStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
       if (today === currentStr) return '今天';
       return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`;
    }
    return '任务列表';
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col bg-[#F2F2F7] dark:bg-black transition-colors duration-300">
      {/* 头部导航栏 (iOS 风格) */}
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 pt-4 pb-2 shrink-0 z-20 border-b border-gray-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between mb-3">
           {/* 左侧：Logo、标题、设置按钮 */}
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-sm flex items-center justify-center text-white">
                    <Box size={18} />
                 </div>
                 <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">TaskCube</h1>
              </div>
              
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-100/50 dark:bg-zinc-800/50 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 rounded-full transition-all active:scale-95"
                title="设置与主题"
              >
                 <Settings size={18} />
              </button>
           </div>
           
           {/* 右侧：操作按钮 */}
           <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsProjectListOpen(true)}
                className="w-9 h-9 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full transition-all active:scale-95"
                title="项目列表"
              >
                 <Briefcase size={18} />
              </button>
              
              <button 
                onClick={() => openNewTaskModal(getTodayString())}
                className="w-9 h-9 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                title="添加新任务"
              >
                 <Plus size={20} />
              </button>
           </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-y-2">
           {/* 日期导航控制 */}
           <div className="flex items-center h-8">
              {(viewMode === 'calendar' || viewMode === 'day') && (
                 <>
                   <button onClick={handlePrev} className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center h-full px-1">
                     <ChevronLeft size={20} />
                     <span className="text-sm">{viewMode === 'day' ? '前一天' : '上个月'}</span>
                   </button>
                   <span className="text-lg font-bold text-gray-900 dark:text-gray-100 mx-2 min-w-[100px] text-center">{getHeaderTitle()}</span>
                   <button onClick={handleNext} className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center h-full px-1">
                     <span className="text-sm">{viewMode === 'day' ? '后一天' : '下个月'}</span>
                     <ChevronRight size={20} />
                   </button>
                 </>
              )}
              {viewMode === 'table' && <span className="text-lg font-bold text-gray-900 dark:text-gray-100">所有任务</span>}
           </div>

           {/* 视图切换分段控制器 */}
           <div className="flex bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg h-8 items-center transition-colors">
             <button
               onClick={() => setViewMode('calendar')}
               className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'calendar' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
               月
             </button>
             <button
               onClick={() => { setViewMode('day'); handleToday(); }}
               className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'day' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
               日
             </button>
             <button
               onClick={() => setViewMode('table')}
               className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
             >
               列表
             </button>
           </div>
        </div>
      </header>

      {/* 主视图区域 */}
      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'calendar' && (
          <div className="h-full p-2 sm:p-4">
             <FullCalendar
               currentDate={currentDate}
               tasks={tasks}
               onPrevMonth={handlePrev}
               onNextMonth={handleNext}
               onToday={handleToday}
               onDateChange={handleDateChange}
               onDateClick={handleDateClick}
               onTaskClick={handleTaskClick}
               onShowMoreClick={(date) => { setCurrentDate(new Date(date)); setViewMode('day'); }}
               onToggleTask={toggleTask}
             />
          </div>
        )}
        
        {viewMode === 'day' && (
           <DayTimeView 
             currentDate={currentDate}
             tasks={tasks}
             onTaskClick={handleTaskClick}
             onTimeSlotClick={(time) => {
                 const dStr = new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                 openNewTaskModal(dStr, time);
             }}
             onToggleTask={toggleTask}
             onDateChange={handleDateChange}
           />
        )}

        {viewMode === 'table' && (
          <div className="h-full bg-white dark:bg-zinc-900">
            <TableView 
              tasks={tasks}
              projects={projects}
              onTaskClick={handleTaskClick}
              onToggleTask={toggleTask}
            />
          </div>
        )}
      </main>

      {/* 弹窗组件 */}
      <TaskDetailModal
        isOpen={isModalOpen}
        onClose={() => {
           setIsModalOpen(false);
           setEditingRule(null);
           setNewTaskInitialTime(undefined);
        }}
        task={editingTask}
        dateStr={selectedDateStr}
        initialTime={newTaskInitialTime}
        recurringRule={getActiveRecurringRule()}
        projects={projects}
        initialProjectId={newTaskInitialProjectId}
        onSave={saveTask}
        onUpdateRule={updateRecurringRule}
        onDelete={deleteTask}
      />

      <RecurringManager 
        isOpen={isRecurManagerOpen}
        onClose={() => setIsRecurManagerOpen(false)}
        rules={recurringRules}
        onDeleteRule={deleteRule}
        onEditRule={(rule) => {
           setEditingRule(rule);
           setEditingTask(null);
           setIsRecurManagerOpen(false);
           setIsModalOpen(true);
        }}
      />

      <ProjectListModal 
        isOpen={isProjectListOpen}
        onClose={() => setIsProjectListOpen(false)}
        projects={projects}
        onCreateProject={handleCreateProject}
        onProjectClick={(p) => {
          setSelectedProjectId(p.id);
          setIsProjectListOpen(false); 
        }}
      />

      <ProjectDetailModal 
        isOpen={!!selectedProject}
        onClose={() => {
           setSelectedProjectId(null);
           setIsProjectListOpen(true);
        }}
        project={selectedProject}
        tasks={tasks}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
        onAddProjectTask={(taskData) => saveTask(taskData)}
        onCreateTaskClick={(projectId) => {
           setNewTaskInitialProjectId(projectId);
           setEditingTask(null);
           setEditingRule(null);
           setIsModalOpen(true);
        }}
        onTaskClick={(t) => {
           setSelectedProjectId(null);
           handleTaskClick(t);
        }}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSave={(newSettings) => setAiSettings(newSettings)}
        currentTheme={theme}
        onThemeChange={setTheme}
      />
    </div>
  );
}