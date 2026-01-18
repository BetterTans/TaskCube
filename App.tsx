import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, SubTask, Priority, RecurringRule, EisenhowerQuadrant, Project, ThemeMode, AISettings } from './types';
import { generateTasksFromRule } from './services/recurringService';
import { FullCalendar } from './components/FullCalendar';
import { TableView } from './components/TableView';
import { DayTimeView } from './components/DayTimeView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { RecurringManager } from './components/RecurringManager';
import { ProjectListModal } from './components/ProjectListModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette, Command } from './components/CommandPalette';
import { EventPopover } from './components/EventPopover';
import { Button } from './components/Button';
import { Calendar as CalendarIcon, Table as TableIcon, Repeat, Briefcase, Box, Clock, ChevronLeft, ChevronRight, Plus, Settings, Sun, Edit } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { useHotkeys } from './hooks/useHotkeys';

// 获取今天的 YYYY-MM-DD 字符串
const getTodayString = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const TODAY = getTodayString();

const DEFAULT_AI_SETTINGS: AISettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo'
};

const DEFAULT_HOTKEYS = {
  'new_task': 'n',
  'go_to_today': 't',
  'toggle_view': 'v',
  'open_projects': 'p',
  'open_palette': 'meta+k'
};

// 视图模式类型
type ViewMode = 'calendar' | 'day' | 'table';

export default function App() {
  // --- 核心状态管理 (使用 IndexedDB + useLiveQuery) ---
  const tasks = useLiveQuery(() => db.tasks.toArray()) ?? [];
  const recurringRules = useLiveQuery(() => db.recurringRules.toArray()) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  
  // 设置、主题、快捷键保留在 LocalStorage 中
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [hotkeys, setHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // 视图状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // --- 模态框可见性状态 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurManagerOpen, setIsRecurManagerOpen] = useState(false);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [popoverState, setPopoverState] = useState<{ task: Task | null; anchorEl: HTMLElement | null; }>({ task: null, anchorEl: null });
  
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
    const savedHotkeys = localStorage.getItem('taskcube-hotkeys');
    
    if (savedSettings) try { setAiSettings(JSON.parse(savedSettings)); } catch (e) {}
    if (savedHotkeys) try { setHotkeys(JSON.parse(savedHotkeys)); } catch (e) {}
    if (savedTheme) {
      setTheme(savedTheme as ThemeMode);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);
  
  useEffect(() => { localStorage.setItem('taskcube-ai-settings', JSON.stringify(aiSettings)); }, [aiSettings]);
  useEffect(() => { localStorage.setItem('taskcube-hotkeys', JSON.stringify(hotkeys)); }, [hotkeys]);

  // 主题切换副作用
  useEffect(() => {
    localStorage.setItem('taskcube-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      root.classList.add(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // --- 周期性任务自动生成 ---
  useEffect(() => {
    if (recurringRules.length === 0) return;
    (async () => {
       const allTasks = await db.tasks.toArray();
       const newTasks: Task[] = recurringRules.flatMap(rule => generateTasksFromRule(rule, allTasks));
       if (newTasks.length > 0) await db.tasks.bulkAdd(newTasks);
    })();
  }, [recurringRules]);

  const handleDateChange = (date: Date) => setCurrentDate(date);
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (dateStr: string) => {
    const clickedDate = new Date(dateStr);
    setCurrentDate(new Date(clickedDate.getUTCFullYear(), clickedDate.getUTCMonth(), clickedDate.getUTCDate()));
    setViewMode('day');
  };

  const openNewTaskModal = useCallback((dateStr?: string, time?: string) => {
    setSelectedDateStr(dateStr || getTodayString());
    setEditingTask(null);
    setEditingRule(null);
    setNewTaskInitialProjectId(null);
    setNewTaskInitialTime(time);
    setIsModalOpen(true);
  }, []);
  
  // --- Event Popover Handlers ---
  const handleTaskPopoverOpen = (task: Task, event: React.MouseEvent) => {
    setPopoverState({ task, anchorEl: event.currentTarget as HTMLElement });
  };
  const handlePopoverClose = () => setPopoverState({ task: null, anchorEl: null });

  // --- Modal Handlers ---
  const openEditModal = (task: Task) => {
    handlePopoverClose(); // Close popover before opening modal
    setSelectedDateStr(task.date);
    setEditingTask(task);
    setEditingRule(null);
    setNewTaskInitialProjectId(null);
    setIsModalOpen(true);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) await db.tasks.update(id, { completed: !task.completed });
  }

  const saveTask = async (taskData: Partial<Task>, ruleData?: Partial<RecurringRule>) => {
    if (ruleData) {
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
        subTaskTitles: ruleData.subTaskTitles,
        tags: ruleData.tags || []
      };
      await db.recurringRules.add(newRule);
    } else if (taskData.id) {
      await db.tasks.update(taskData.id, taskData);
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: taskData.title!,
        description: taskData.description,
        priority: taskData.priority || Priority.MEDIUM,
        quadrant: taskData.quadrant || EisenhowerQuadrant.Q2,
        date: taskData.date || selectedDateStr,
        endDate: taskData.endDate,
        startTime: taskData.startTime,
        duration: taskData.duration,
        completed: false,
        subTasks: taskData.subTasks || [],
        createdAt: Date.now(),
        isExpanded: false,
        projectId: taskData.projectId,
        tags: taskData.tags || []
      };
      await db.tasks.add(newTask);
    }
  };

  const updateRecurringRule = async (ruleId: string, ruleData: Partial<RecurringRule>) => {
    await db.recurringRules.update(ruleId, ruleData);
    const relatedTasks = await db.tasks.where('recurringRuleId').equals(ruleId).filter(t => !t.completed).toArray();
    for (const task of relatedTasks) {
       await db.tasks.update(task.id, {
         title: ruleData.title || task.title,
         description: ruleData.description,
         priority: ruleData.priority,
         quadrant: ruleData.quadrant,
         projectId: ruleData.projectId,
         startTime: ruleData.startTime,
         duration: ruleData.duration,
         tags: ruleData.tags
       });
    }
  };

  const deleteTask = (id: string) => db.tasks.delete(id);
  const deleteRule = async (ruleId: string) => {
    if (window.confirm("确定要删除这个周期规则吗？将同时删除所有未来生成的任务。")) {
      await db.recurringRules.delete(ruleId);
      const toDeleteIds = (await db.tasks.where('recurringRuleId').equals(ruleId).toArray()).map(t => t.id);
      await db.tasks.bulkDelete(toDeleteIds);
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    const newProject = {
      id: crypto.randomUUID(), title: projectData.title!, status: 'active', progress: 0,
      startDate: projectData.startDate || TODAY, logs: [], createdAt: Date.now(),
      color: projectData.color || '#3B82F6', ...projectData
    } as Project;
    await db.projects.add(newProject);
  };
  const updateProject = (id: string, updates: Partial<Project>) => db.projects.update(id, updates);
  const deleteProject = async (id: string) => {
    await db.projects.delete(id);
    const projectTasks = await db.tasks.where('projectId').equals(id).toArray();
    for (const task of projectTasks) await db.tasks.update(task.id, { projectId: undefined });
    if (selectedProjectId === id) setSelectedProjectId(null);
  };
  
  const getActiveRecurringRule = () => recurringRules.find(r => r.id === (editingRule?.id || editingTask?.recurringRuleId));
  
  // --- Keyboard Shortcuts & Command Palette ---
  const toggleView = useCallback(() => {
    const views: ViewMode[] = ['calendar', 'day', 'table'];
    const currentIndex = views.indexOf(viewMode);
    setViewMode(views[(currentIndex + 1) % views.length]);
  }, [viewMode]);

  const hotkeyActions = useMemo(() => ({
    [hotkeys.open_palette]: () => setIsCommandPaletteOpen(true),
    'shift+?': () => setIsCommandPaletteOpen(true), // hardcoded alternative
    [hotkeys.new_task]: () => openNewTaskModal(getTodayString()),
    [hotkeys.go_to_today]: handleToday,
    [hotkeys.toggle_view]: toggleView,
    [hotkeys.open_projects]: () => setIsProjectListOpen(true),
    'escape': () => { // Universal close
        setIsModalOpen(false);
        setIsRecurManagerOpen(false);
        setIsProjectListOpen(false);
        setIsSettingsOpen(false);
        setIsCommandPaletteOpen(false);
        setSelectedProjectId(null);
        handlePopoverClose();
    }
  }), [hotkeys, openNewTaskModal, toggleView]);

  useHotkeys(hotkeyActions, [hotkeys]);

  const commands = useMemo<Command[]>(() => {
    const staticCommands: Command[] = [
      { id: 'new_task', type: 'action', icon: <Plus size={16} />, title: '新建任务', shortcut: hotkeys.new_task.toUpperCase(), action: () => openNewTaskModal(getTodayString()) },
      { id: 'go_to_today', type: 'action', icon: <Sun size={16}/>, title: '跳转到今天', shortcut: hotkeys.go_to_today.toUpperCase(), action: handleToday },
      { id: 'open_projects', type: 'action', icon: <Briefcase size={16}/>, title: '打开项目列表', shortcut: hotkeys.open_projects.toUpperCase(), action: () => setIsProjectListOpen(true) },
      { id: 'switch_view', type: 'action', icon: <Box size={16}/>, title: '切换视图', shortcut: hotkeys.toggle_view.toUpperCase(), action: toggleView },
      { id: 'open_settings', type: 'action', icon: <Settings size={16}/>, title: '打开设置', action: () => setIsSettingsOpen(true) },
    ];
    const taskCommands: Command[] = tasks.map(task => ({
      id: task.id, type: 'task', icon: <Edit size={16}/>, title: `编辑: ${task.title}`, action: () => openEditModal(task)
    }));
    return [...staticCommands, ...taskCommands];
  }, [tasks, hotkeys, openNewTaskModal, toggleView]);

  return (
    <div className="flex h-screen w-screen overflow-hidden flex-col bg-[#F2F2F7] dark:bg-black transition-colors duration-300">
      <header className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 pt-4 pb-2 shrink-0 z-20 border-b border-gray-200 dark:border-zinc-800 transition-colors">
        <div className="flex items-center justify-between mb-3">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-sm flex items-center justify-center text-white"><Box size={18} /></div>
                 <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">TaskCube</h1>
              </div>
              <button onClick={() => setIsSettingsOpen(true)} className="w-9 h-9 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 bg-gray-100/50 dark:bg-zinc-800/50 hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 rounded-full transition-all active:scale-95" title="设置"><Settings size={18} /></button>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => setIsProjectListOpen(true)} className="w-9 h-9 flex items-center justify-center text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-full transition-all active:scale-95" title="项目列表"><Briefcase size={18} /></button>
              <button onClick={() => openNewTaskModal(getTodayString())} className="w-9 h-9 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95" title="添加新任务"><Plus size={20} /></button>
           </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-y-2">
           <div className="flex items-center h-8">
              {(viewMode === 'calendar' || viewMode === 'day') && (
                 <>
                   <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - (viewMode === 'day' ? 1 : 0) | d.setMonth(d.getMonth() - (viewMode === 'day' ? 0 : 1)))))} className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center h-full px-1"><ChevronLeft size={20} /><span className="text-sm">{viewMode === 'day' ? '前一天' : '上个月'}</span></button>
                   <span className="text-lg font-bold text-gray-900 dark:text-gray-100 mx-2 min-w-[100px] text-center">{viewMode === 'day' ? (currentDate.toISOString().split('T')[0] === TODAY ? '今天' : `${currentDate.getMonth()+1}月${currentDate.getDate()}日`) : `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}</span>
                   <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + (viewMode === 'day' ? 1 : 0) | d.setMonth(d.getMonth() + (viewMode === 'day' ? 0 : 1)))))} className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center h-full px-1"><span className="text-sm">{viewMode === 'day' ? '后一天' : '下个月'}</span><ChevronRight size={20} /></button>
                 </>
              )}
              {viewMode === 'table' && <span className="text-lg font-bold text-gray-900 dark:text-gray-100">所有任务</span>}
           </div>
           <div className="flex bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg h-8 items-center transition-colors">
             <button onClick={() => setViewMode('calendar')} className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'calendar' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>月</button>
             <button onClick={() => { setViewMode('day'); handleToday(); }} className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'day' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>日</button>
             <button onClick={() => setViewMode('table')} className={`h-full px-3 rounded-[6px] text-xs font-semibold transition-all flex items-center justify-center ${viewMode === 'table' ? 'bg-white dark:bg-zinc-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>列表</button>
           </div>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {viewMode === 'calendar' && <div className="h-full p-2 sm:p-4"><FullCalendar currentDate={currentDate} tasks={tasks} projects={projects} onDateChange={handleDateChange} onDateClick={handleDateClick} onTaskClick={handleTaskPopoverOpen} onUpdateTask={saveTask} /></div>}
        {viewMode === 'day' && <DayTimeView currentDate={currentDate} tasks={tasks} onTaskClick={handleTaskPopoverOpen} onTimeSlotClick={(time) => openNewTaskModal(new Date(currentDate.getTime() - currentDate.getTimezoneOffset() * 60000).toISOString().split('T')[0], time)} onToggleTask={toggleTask} onDateChange={handleDateChange} onUpdateTask={saveTask} />}
        {viewMode === 'table' && <div className="h-full bg-white dark:bg-zinc-900"><TableView tasks={tasks} projects={projects} onTaskClick={openEditModal} onToggleTask={toggleTask} onUpdateTask={saveTask} /></div>}
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      <TaskDetailModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRule(null); setNewTaskInitialTime(undefined); }} task={editingTask} dateStr={selectedDateStr} initialTime={newTaskInitialTime} recurringRule={getActiveRecurringRule()} projects={projects} initialProjectId={newTaskInitialProjectId} onSave={saveTask} onUpdateRule={updateRecurringRule} onDelete={deleteTask} />
      <RecurringManager isOpen={isRecurManagerOpen} onClose={() => setIsRecurManagerOpen(false)} rules={recurringRules} onDeleteRule={deleteRule} onEditRule={(rule) => { setEditingRule(rule); setEditingTask(null); setIsRecurManagerOpen(false); setIsModalOpen(true); }} />
      <ProjectListModal isOpen={isProjectListOpen} onClose={() => setIsProjectListOpen(false)} projects={projects} onCreateProject={handleCreateProject} onProjectClick={(p) => { setSelectedProjectId(p.id); setIsProjectListOpen(false); }} />
      {selectedProject && <ProjectDetailModal isOpen={!!selectedProject} onClose={() => { setSelectedProjectId(null); setIsProjectListOpen(true); }} project={selectedProject} tasks={tasks} onUpdateProject={updateProject} onDeleteProject={deleteProject} onAddProjectTask={saveTask} onCreateTaskClick={(projectId) => { setNewTaskInitialProjectId(projectId); setEditingTask(null); setEditingRule(null); setIsModalOpen(true); }} onTaskClick={(t) => { setSelectedProjectId(null); openEditModal(t); }} />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={aiSettings} onSave={setAiSettings} currentTheme={theme} onThemeChange={setTheme} hotkeys={hotkeys} onHotkeysChange={setHotkeys} defaultHotkeys={DEFAULT_HOTKEYS} />
      <EventPopover
        isOpen={!!popoverState.task}
        onClose={handlePopoverClose}
        task={popoverState.task}
        anchorEl={popoverState.anchorEl}
        projects={projects}
        onToggle={toggleTask}
        onEdit={openEditModal}
        onDelete={(id) => { deleteTask(id); handlePopoverClose(); }}
      />
    </div>
  );
}