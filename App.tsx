import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task, SubTask, Priority, RecurringRule, EisenhowerQuadrant, Project, ThemeMode, AISettings, TaskProgress } from './types.ts';
import { generateTasksFromRule, parseDate } from './services/recurringService.ts';
import { FullCalendar } from './components/FullCalendar.tsx';
import { TableView } from './components/TableView.tsx';
import { DayTimeView } from './components/DayTimeView.tsx';
import { MatrixView } from './components/MatrixView.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { RecurringManager } from './components/RecurringManager.tsx';
import { ProjectListModal } from './components/ProjectListModal.tsx';
import { ProjectDetailModal } from './components/ProjectDetailModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { CommandPalette, Command } from './components/CommandPalette.tsx';
import { EventPopover } from './components/EventPopover.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { ViewTabs } from './components/ViewTabs.tsx';
import { FilterIndicator } from './components/FilterIndicator.tsx';
import { TaskDetailPanel } from './components/TaskDetailPanel.tsx';
import { CalendarSkeleton, DayViewSkeleton, MatrixSkeleton, TableSkeleton } from './components/Skeletons.tsx';
import { ToastContainer } from './components/ToastContainer.tsx';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { useToast } from './hooks/useToast.ts';
import { useTaskFilters } from './hooks/useTaskFilters.ts';
import { Box, ChevronLeft, ChevronRight, Plus, Settings, Sun, Edit, Briefcase } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db.ts';
import { useHotkeys } from './hooks/useHotkeys.ts';
import { generateUUID } from './utils/generateUUID.ts';
import { getTodayString } from './utils/dateUtils.ts';
import { DEFAULT_AI_SETTINGS } from './config/defaultValues.ts';
import { STORAGE_KEYS } from './config/storageKeys.ts';
import { initAutoBackup, triggerBackup, checkAndRestoreBackup, isFileSystemAccessSupported, selectBackupDirectory, clearBackupDirectory, isBackupConfigured } from './services/autoBackup.ts';

// Helper function to get the week range
const getWeekRange = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const startOfWeek = new Date(d.setDate(diff));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return {
        start: getTodayString(startOfWeek),
        end: getTodayString(endOfWeek),
    };
};

const TODAY = getTodayString();

const DEFAULT_HOTKEYS = {
  'new_task': 'n',
  'go_to_today': 't',
  'toggle_view': 'v',
  'open_projects': 'p',
  'open_palette': 'meta+k'
};

// 视图模式类型
type ViewMode = 'calendar' | 'day' | 'matrix' | 'table';

export default function App() {
  const { toasts, addToast, removeToast } = useToast();

  // --- 核心状态管理 (使用 IndexedDB + useLiveQuery) ---
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const recurringRules = useLiveQuery(() => db.recurringRules.toArray()) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray()) ?? [];
  
  // 设置、主题、快捷键保留在 LocalStorage 中
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [hotkeys, setHotkeys] = useState<Record<string, string>>(DEFAULT_HOTKEYS);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // 视图状态
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('matrix');
  const [matrixDateRange, setMatrixDateRange] = useState(getWeekRange());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true');
  
  // --- 模态框可见性状态 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurManagerOpen, setIsRecurManagerOpen] = useState(false);
  const [isProjectListOpen, setIsProjectListOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [popoverState, setPopoverState] = useState<{ task: Task | null; anchorEl: HTMLElement | null; }>({ task: null, anchorEl: null });
  
  // 追踪是否从侧面板打开了模态框
  const [openedFromPanel, setOpenedFromPanel] = useState(false); // kept for backward compat, unused in calendar

  // --- 选中项状态 ---
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(TODAY);

  // --- 日历过滤和侧面板状态 ---
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterQuadrant, setFilterQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { filteredTasks, counts } = useTaskFilters(
    tasks ?? [],
    filterProjectId,
    filterQuadrant,
  );

  const selectedTask = selectedTaskId ? (tasks ?? []).find(t => t.id === selectedTaskId) ?? null : null;

  // 确认对话框状态
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };
  
  // 新建任务时的初始预设
  const [newTaskInitialTime, setNewTaskInitialTime] = useState<string | undefined>(undefined);
  const [newTaskInitialProjectId, setNewTaskInitialProjectId] = useState<string | null>(null);

  // 派生状态：当前选中的项目对象
  const selectedProject = projects?.find(p => p.id === selectedProjectId) || null;

  // --- 初始化与设置持久化 ---
  useEffect(() => {
    const init = async () => {
      // Auto-backup initialization
      const restored = await checkAndRestoreBackup();
      if (restored) {
        addToast('数据已从本地备份自动恢复', 'success');
      }
      await initAutoBackup();
    };
    init();

    const savedSettings = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const savedHotkeys = localStorage.getItem(STORAGE_KEYS.HOTKEYS);
    
    if (savedSettings) try { setAiSettings(JSON.parse(savedSettings)); } catch (e) {}
    if (savedHotkeys) try { setHotkeys(JSON.parse(savedHotkeys)); } catch (e) {}
    if (savedTheme) {
      setTheme(savedTheme as ThemeMode);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);
  
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(aiSettings)); }, [aiSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HOTKEYS, JSON.stringify(hotkeys)); }, [hotkeys]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(isSidebarCollapsed)); }, [isSidebarCollapsed]);

  // 主题切换副作用
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
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
    if (!recurringRules || !tasks) return;
    (async () => {
       const newTasks: Task[] = recurringRules.flatMap(rule => generateTasksFromRule(rule, tasks));
       if (newTasks.length > 0) await db.tasks.bulkAdd(newTasks);
    })();
  }, [recurringRules, tasks]);

  // --- 自动备份触发 ---
  useEffect(() => {
    triggerBackup();
  }, [tasks, projects, recurringRules]);

  // 计算依赖阻塞状态
  const tasksById = useMemo(() => {
    if (!tasks) return new Map<string, Task>();
    return new Map<string, Task>(tasks.map(t => [t.id, t] as [string, Task]));
  }, [tasks]);

  const blockedTaskIds = useMemo(() => {
    if (!tasks || tasks.length === 0) return new Set<string>();
    
    const blocked = new Set<string>();
    for (const task of tasks) {
      if (task.predecessorIds && task.predecessorIds.length > 0) {
        for (const predId of task.predecessorIds) {
          const predecessor = tasksById.get(predId);
          if (predecessor && !predecessor.completed) {
            blocked.add(task.id);
            break; 
          }
        }
      }
    }
    return blocked;
  }, [tasks, tasksById]);

  const handleDateChange = (date: Date) => setCurrentDate(date);
  const handleToday = () => setCurrentDate(new Date());

  const handleDateClick = (dateStr: string) => {
    setCurrentDate(parseDate(dateStr));
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
  
  const handleTaskPopoverOpen = (task: Task, event: React.MouseEvent) => {
    setPopoverState({ task, anchorEl: event.currentTarget as HTMLElement });
  };
  const handlePopoverClose = () => setPopoverState({ task: null, anchorEl: null });

  const openEditModal = (task: Task) => {
    handlePopoverClose(); 
    setSelectedDateStr(task.date);
    setEditingTask(task);
    setEditingRule(null);
    setNewTaskInitialProjectId(null);
    setIsModalOpen(true);
  };

  const toggleTask = async (id: string) => {
    if (!tasks) return;
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newCompleted = !task.completed;
      const updateData: Partial<Task> = { completed: newCompleted };
      // Sync progress with completed status
      if (newCompleted) {
        updateData.progress = TaskProgress.COMPLETED;
      } else {
        updateData.progress = TaskProgress.INITIAL;
      }
      await db.tasks.update(id, updateData);
    }
  }

  const saveTask = async (taskData: Partial<Task>, ruleData?: Partial<RecurringRule>) => {
    if (ruleData) {
      const newRule: RecurringRule = {
        id: generateUUID(),
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
        id: generateUUID(),
        title: taskData.title!,
        description: taskData.description,
        priority: taskData.priority || Priority.MEDIUM,
        quadrant: taskData.quadrant || EisenhowerQuadrant.Q2,
        date: taskData.date || selectedDateStr,
        endDate: taskData.endDate,
        startTime: taskData.startTime,
        duration: taskData.duration,
        completed: false,
        progress: TaskProgress.INITIAL, // Set default progress for new tasks
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
    showConfirm(
      '删除周期规则',
      '确定要删除这个周期规则吗？将同时删除所有未来生成的任务。',
      async () => {
        await db.recurringRules.delete(ruleId);
        const toDeleteIds = (await db.tasks.where('recurringRuleId').equals(ruleId).toArray()).map(t => t.id);
        await db.tasks.bulkDelete(toDeleteIds);
        addToast('周期规则已删除', 'success');
      }
    );
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    const newProject = {
      id: generateUUID(), title: projectData.title!, status: 'active', progress: 0,
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
  
  const toggleView = useCallback(() => {
    const views: ViewMode[] = ['matrix', 'calendar', 'day', 'table'];
    const currentIndex = views.indexOf(viewMode);
    setViewMode(views[(currentIndex + 1) % views.length]);
  }, [viewMode]);

  const hotkeyActions = useMemo(() => ({
    [hotkeys.open_palette]: () => setIsCommandPaletteOpen(true),
    'shift+?': () => setIsCommandPaletteOpen(true), 
    [hotkeys.new_task]: () => openNewTaskModal(getTodayString()),
    [hotkeys.go_to_today]: handleToday,
    [hotkeys.toggle_view]: toggleView,
    [hotkeys.open_projects]: () => setIsProjectListOpen(true),
    'escape': () => { 
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
    if (!tasks) return staticCommands;
    const taskCommands: Command[] = tasks.map(task => ({
      id: task.id, type: 'task', icon: <Edit size={16}/>, title: `编辑: ${task.title}`, action: () => openEditModal(task)
    }));
    return [...staticCommands, ...taskCommands];
  }, [tasks, hotkeys, openNewTaskModal, toggleView]);

  const renderCurrentView = () => {
    if (tasks === undefined || projects === undefined) {
       switch(viewMode) {
         case 'calendar': return <div className="p-4 h-full"><CalendarSkeleton /></div>;
         case 'day': return <DayViewSkeleton />;
         case 'matrix': return <MatrixSkeleton />;
         case 'table': return <TableSkeleton />;
         default: return null;
       }
    }
    
    switch(viewMode) {
      case 'calendar': return <div className="h-full p-2 sm:p-4"><FullCalendar currentDate={currentDate} tasks={filteredTasks} projects={projects} blockedTaskIds={blockedTaskIds} onDateChange={handleDateChange} onDateClick={handleDateClick} onTaskClick={(task, _e) => setSelectedTaskId(task.id)} onUpdateTask={saveTask} onInlineCreate={(dateStr, title) => saveTask({ title, date: dateStr, priority: Priority.MEDIUM, quadrant: EisenhowerQuadrant.Q2 })} /></div>;
      case 'day': return <DayTimeView currentDate={currentDate} tasks={filteredTasks} blockedTaskIds={blockedTaskIds} onTaskClick={handleTaskPopoverOpen} onTimeSlotClick={(time) => openNewTaskModal(getTodayString(currentDate), time)} onToggleTask={toggleTask} onDateChange={handleDateChange} onUpdateTask={saveTask} />;
      case 'matrix': return <MatrixView tasks={filteredTasks} projects={projects} dateRange={matrixDateRange} blockedTaskIds={blockedTaskIds} onUpdateTask={saveTask} onTaskClick={handleTaskPopoverOpen}/>;
      case 'table': return <TableView tasks={filteredTasks} projects={projects} blockedTaskIds={blockedTaskIds} onTaskClick={openEditModal} onToggleTask={toggleTask} onUpdateTask={saveTask} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden transition-colors duration-300">
      <Sidebar
        filterProjectId={filterProjectId}
        onProjectFilter={setFilterProjectId}
        filterQuadrant={filterQuadrant}
        onQuadrantFilter={setFilterQuadrant}
        projects={projects ?? []}
        taskCounts={counts}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenProjects={() => setIsProjectListOpen(true)}
        onOpenRecurring={() => setIsRecurManagerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg px-4 sm:px-6 py-3 shrink-0 z-20 border-b border-gray-100 dark:border-zinc-800 transition-colors flex items-center justify-between gap-3">
          {/* Left: Date navigation */}
          <div className="flex items-center min-w-0">
              {(viewMode === 'calendar' || viewMode === 'day') && (
                 <div className="flex items-center animate-in fade-in duration-200">
                   <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - (viewMode === 'calendar' ? 1 : 0), d.getDate() - (viewMode === 'day' ? 1 : 0)))} className="text-indigo-600 dark:text-indigo-400 p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 flex-shrink-0"><ChevronLeft size={18} /></button>
                   <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mx-2 min-w-[80px] sm:min-w-[120px] text-center truncate">{viewMode === 'day' ? (getTodayString(currentDate) === TODAY ? '今天' : `${currentDate.getMonth()+1}月${currentDate.getDate()}日`) : `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}</span>
                   <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + (viewMode === 'calendar' ? 1 : 0), d.getDate() + (viewMode === 'day' ? 1 : 0)))} className="text-indigo-600 dark:text-indigo-400 p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 flex-shrink-0"><ChevronRight size={18} /></button>
                 </div>
              )}
              {viewMode === 'matrix' && (
                 <div className="flex items-center gap-2 animate-in fade-in duration-200">
                    <input type="date" value={matrixDateRange.start} onChange={(e) => setMatrixDateRange(r => ({ ...r, start: e.target.value }))} className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-300 dark:color-scheme-dark h-9"/>
                    <span className="text-gray-400 text-sm">-</span>
                    <input type="date" value={matrixDateRange.end} onChange={(e) => setMatrixDateRange(r => ({ ...r, end: e.target.value }))} className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-300 dark:color-scheme-dark h-9"/>
                 </div>
              )}
          </div>
          {/* Center: View Tabs */}
          <ViewTabs viewMode={viewMode} onChange={setViewMode} />
          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => openNewTaskModal(getTodayString())} className="px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-sm font-medium" title="添加新任务 (N)"><Plus size={16} /> <span className="hidden sm:inline">新建任务</span></button>
           </div>
        </header>
        {viewMode !== 'calendar' && (
          <FilterIndicator
            filterProjectId={filterProjectId}
            filterQuadrant={filterQuadrant}
            projects={projects ?? []}
            onClearProject={() => setFilterProjectId(null)}
            onClearQuadrant={() => setFilterQuadrant(null)}
          />
        )}
        <main className="flex-1 overflow-hidden relative">
          {renderCurrentView()}
        </main>
      </div>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      <TaskDetailModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingRule(null); setNewTaskInitialTime(undefined); }} task={editingTask} dateStr={selectedDateStr} allTasks={tasks ?? []} initialTime={newTaskInitialTime} recurringRule={getActiveRecurringRule()} projects={projects ?? []} initialProjectId={newTaskInitialProjectId} onSave={saveTask} onUpdateRule={updateRecurringRule} onDelete={deleteTask} addToast={addToast} />
      <RecurringManager isOpen={isRecurManagerOpen} onClose={() => setIsRecurManagerOpen(false)} rules={recurringRules} onDeleteRule={deleteRule} onEditRule={(rule) => { setEditingRule(rule); setEditingTask(null); setIsRecurManagerOpen(false); setIsModalOpen(true); }} />
      <ProjectListModal isOpen={isProjectListOpen} onClose={() => setIsProjectListOpen(false)} projects={projects ?? []} onCreateProject={handleCreateProject} onProjectClick={(p) => { setSelectedProjectId(p.id); setIsProjectListOpen(false); }} />
      {selectedProject && <ProjectDetailModal isOpen={!!selectedProject} onClose={() => { setSelectedProjectId(null); setIsProjectListOpen(true); }} project={selectedProject} tasks={tasks ?? []} onUpdateProject={updateProject} onDeleteProject={deleteProject} onAddProjectTask={saveTask} onCreateTaskClick={(projectId) => { setNewTaskInitialProjectId(projectId); setEditingTask(null); setEditingRule(null); setIsModalOpen(true); }} onTaskClick={(t) => { setSelectedProjectId(null); openEditModal(t); }} addToast={addToast} />}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={aiSettings} onSave={setAiSettings} currentTheme={theme} onThemeChange={setTheme} hotkeys={hotkeys} onHotkeysChange={setHotkeys} defaultHotkeys={DEFAULT_HOTKEYS} addToast={addToast} />
      <TaskDetailPanel
        task={selectedTask}
        isOpen={!!selectedTask && !isModalOpen}
        onClose={() => setSelectedTaskId(null)}
        onUpdate={saveTask}
        onDelete={async (id) => { await deleteTask(id); }}
        onSaveRule={async (taskData, ruleData) => {
          await saveTask(taskData, ruleData);
        }}
        onUpdateRule={updateRecurringRule}
        projects={projects ?? []}
        allTasks={tasks ?? []}
        recurringRule={getActiveRecurringRule()}
        addToast={addToast}
      />
      <EventPopover
        isOpen={!!popoverState.task}
        onClose={handlePopoverClose}
        task={popoverState.task}
        anchorEl={popoverState.anchorEl}
        projects={projects ?? []}
        onToggle={toggleTask}
        onEdit={openEditModal}
        onDelete={(id) => { deleteTask(id); handlePopoverClose(); }}
        isBlocked={!!popoverState.task && blockedTaskIds.has(popoverState.task.id)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(prev => ({ ...prev, isOpen: false })); }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}