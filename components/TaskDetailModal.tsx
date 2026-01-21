import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, TaskProgress, Priority, SubTask, RecurringFrequency, RecurringRule, EisenhowerQuadrant, Project } from '../types';
import { breakDownTask, parseTaskFromNaturalLanguage } from '../services/aiService';
import { parseDate } from '../services/recurringService';
import { Button } from './Button';
import { RecurringOptions } from './RecurringOptions';
import { TaskSelectorPopover } from './TaskSelectorPopover';
import {
  X,
  Trash2,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  AlignLeft,
  Repeat,
  Tag,
  LayoutGrid,
  Clock,
  Briefcase,
  Plus,
  ChevronRight,
  Zap,
  Star,
  Bell,
  Coffee,
  Wand2,
  Link2,
  Activity
} from 'lucide-react';

const generateUUID = () => {
  if (crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // 现有任务（如果为 null 则为新建）
  dateStr: string; // 默认日期
  allTasks: Task[]; // 所有任务，用于依赖选择
  recurringRule?: RecurringRule; // 关联的周期规则
  projects?: Project[];
  initialProjectId?: string | null;
  onSave: (task: Partial<Task>, rule?: Partial<RecurringRule>) => void;
  onUpdateRule?: (ruleId: string, ruleData: Partial<RecurringRule>) => void;
  onDelete: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onUpdateSubtasks?: (taskId: string, subtasks: SubTask[]) => void;
  initialTime?: string; // 初始时间（例如从日视图点击时间格）
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  dateStr,
  allTasks,
  recurringRule,
  projects = [],
  initialProjectId,
  onSave,
  onUpdateRule,
  onDelete,
  initialTime
}) => {
  // --- 表单状态 ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [quadrant, setQuadrant] = useState<EisenhowerQuadrant>(EisenhowerQuadrant.Q2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSmartFilling, setIsSmartFilling] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);

  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);

  // 任务进展状态
  const [progress, setProgress] = useState<TaskProgress>(TaskProgress.INITIAL);

  // 依赖选择器状态
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorAnchorRef = useRef<HTMLButtonElement>(null);

  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurringFrequency>('daily');
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurWeekDays, setRecurWeekDays] = useState<number[]>([]);
  const [recurStartDate, setRecurStartDate] = useState('');
  const [recurEndDate, setRecurEndDate] = useState('');
  
  const tasksById = useMemo(() => new Map(allTasks.map(t => [t.id, t])), [allTasks]);

  useEffect(() => {
    if (isOpen) {
      setIsSmartFilling(false);

      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setQuadrant(task.quadrant || EisenhowerQuadrant.Q2);
        setStartDate(task.date || dateStr);
        setEndDate(task.endDate || '');
        setSelectedProjectId(task.projectId || '');
        setSubtasks(task.subTasks || []);
        setTags(task.tags || []);
        setPredecessorIds(task.predecessorIds || []);
        setProgress(task.progress || (task.completed ? TaskProgress.COMPLETED : TaskProgress.INITIAL)); // 加载任务进展
        setEditMode('single');
        setIsRecurring(!!recurringRule);

        if (task.startTime) {
           setIsAllDay(false);
           setStartTime(task.startTime);
           setDuration(task.duration || 60);
        } else {
           setIsAllDay(true);
           setStartTime('09:00');
           setDuration(60);
        }

        if (recurringRule) {
           setRecurFreq(recurringRule.frequency);
           setRecurInterval(recurringRule.interval);
           setRecurWeekDays(recurringRule.weekDays || []);
           setRecurStartDate(recurringRule.startDate);
           setRecurEndDate(recurringRule.endDate || '');
           if (recurringRule.quadrant) setQuadrant(recurringRule.quadrant);
           if (recurringRule.projectId) setSelectedProjectId(recurringRule.projectId);
           if (recurringRule.tags) setTags(recurringRule.tags);
        } else {
           const effectiveDate = task.date || dateStr;
           setRecurStartDate(effectiveDate);
           const d = parseDate(effectiveDate);
           setRecurWeekDays([d.getDay()]);
           setRecurFreq('daily');
           setRecurInterval(1);
           setRecurEndDate('');
        }
      } else if (recurringRule) {
        // ... (existing logic, dependencies not supported on rules)
      } else {
        // 新建任务
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
        setQuadrant(EisenhowerQuadrant.Q2);
        setStartDate(dateStr);
        setEndDate(dateStr);
        setSelectedProjectId(initialProjectId || '');
        setSubtasks([]);
        setTags([]);
        setPredecessorIds([]);
        setProgress(TaskProgress.INITIAL); // 新任务默认进展为初始
        setEditMode('single');
        setIsRecurring(false);
        setRecurFreq('daily');
        setRecurInterval(1);
        setRecurStartDate(dateStr);
        setRecurEndDate('');

        if (initialTime) {
           setIsAllDay(false);
           setStartTime(initialTime);
           setDuration(60);
        } else {
           setIsAllDay(true);
           setStartTime('09:00');
           setDuration(60);
        }

        const d = parseDate(dateStr);
        setRecurWeekDays([d.getDay()]);
      }
      setNewSubtaskTitle('');
      setNewTagInput('');
    }
  }, [isOpen, task, dateStr, recurringRule, initialProjectId, initialTime]);

  if (!isOpen) return null;

  // --- Dependency Logic ---
  const checkCircularDependency = (taskId: string, potentialPredId: string): boolean => {
    const visited = new Set<string>();
    let queue: string[] = [];
    // Start traversal from all successors of the task being modified
    const initialTask = tasksById.get(taskId);
    if (initialTask?.successorIds) {
      queue = [...initialTask.successorIds];
    }
    
    while(queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === potentialPredId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const taskNode = tasksById.get(currentId);
      if (taskNode?.successorIds) {
        for (const succId of taskNode.successorIds) {
          if (!visited.has(succId)) {
            queue.push(succId);
          }
        }
      }
    }
    return false;
  };

  const handleAddPredecessor = (predId: string) => {
    if (task && checkCircularDependency(task.id, predId)) {
       alert("无法添加，这会造成循环依赖！");
       return;
    }
    if (!predecessorIds.includes(predId)) {
      setPredecessorIds(prev => [...prev, predId]);
    }
  };
  
  const handleRemovePredecessor = (predId: string) => {
    setPredecessorIds(prev => prev.filter(id => id !== predId));
  };

  const predecessors = predecessorIds.map(id => tasksById.get(id)).filter(Boolean) as Task[];
  const successors = task?.successorIds?.map(id => tasksById.get(id)).filter(Boolean) as Task[] || [];

  // --- Handlers ---
  const handleSmartFill = async () => {
    if (!title.trim()) return;
    setIsSmartFilling(true);
    const parsed = await parseTaskFromNaturalLanguage(title, startDate);
    setIsSmartFilling(false);
    if (parsed.title) setTitle(parsed.title);
    if (parsed.date) setStartDate(parsed.date);
    if (parsed.priority) setPriority(parsed.priority);
    if (parsed.quadrant) setQuadrant(parsed.quadrant);
    if (parsed.startTime) {
      setIsAllDay(false);
      setStartTime(parsed.startTime);
      if (parsed.duration) setDuration(parsed.duration);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    if (newEndDate < startDate) {
      setStartDate(newEndDate);
    }
  };

  const handleRecurringToggle = () => {
    const newState = !isRecurring;
    setIsRecurring(newState);
    if (newState && !recurringRule) {
      setRecurStartDate(startDate);
      const d = parseDate(startDate);
      setRecurWeekDays([d.getDay()]);
    }
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleGenerateSubtasks = async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    const subtaskTitles = await breakDownTask(title);
    if (subtaskTitles.length > 0) {
      const newSubtasks: SubTask[] = subtaskTitles.map(t => ({ id: generateUUID(), title: t, completed: false }));
      setSubtasks(s => [...s, ...newSubtasks]);
    }
    setIsGenerating(false);
  };
  
  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      setSubtasks([...subtasks, { id: generateUUID(), title: newSubtaskTitle.trim(), completed: false }]);
      setNewSubtaskTitle('');
    }
  };

  const handleDeleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubtasks(subtasks.filter(s => s.id !== subtaskId));
  };
  
  const handleToggleSubtaskLocal = (subtaskId: string) => {
    setSubtasks(subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s));
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    const timeData = isAllDay ? { startTime: undefined, duration: undefined } : { startTime, duration };

    // Case 1: Editing the entire series of a recurring task
    if (editMode === 'series' && recurringRule && onUpdateRule) {
        onUpdateRule(recurringRule.id, {
            title, description, priority, quadrant,
            projectId: selectedProjectId || undefined,
            tags: tags,
            startTime: timeData.startTime,
            duration: timeData.duration,
        });
    }
    // Case 2: Creating a new recurring rule (from scratch OR by converting a single task)
    else if (isRecurring) {
        onSave({}, {
            title, description, priority, quadrant,
            frequency: recurFreq,
            interval: recurInterval,
            weekDays: recurWeekDays,
            startDate: recurStartDate,
            endDate: recurEndDate,
            projectId: selectedProjectId || undefined,
            tags: tags,
            subTaskTitles: subtasks.map(s => s.title),
            ...timeData
        });
        // If we were converting an existing single task, delete it.
        if (task && !task.recurringRuleId) {
            onDelete(task.id);
        }
    }
    // Case 3: Saving a single task (new or update)
    else {
        const taskData: Partial<Task> = {
            id: task?.id, title, description, priority, quadrant,
            date: startDate,
            endDate: endDate && endDate >= startDate ? endDate : undefined,
            projectId: selectedProjectId || undefined,
            subTasks: subtasks,
            tags: tags,
            predecessorIds: predecessorIds,
            progress: progress, // 保存任务进展
            ...timeData,
        };
        // If task was recurring but is now single, detach it from the rule.
        if (task?.recurringRuleId && editMode === 'single') {
            taskData.recurringRuleId = undefined; 
        }
        onSave(taskData);
    }
    onClose();
  };

  const isSaveDisabled = !title.trim() || (isRecurring && !recurEndDate);

  const quadrantOptions = [
    { id: EisenhowerQuadrant.Q1, label: '重要 & 紧急', desc: '立即处理', icon: <Zap size={12}/>, selectedClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' },
    { id: EisenhowerQuadrant.Q2, label: '重要 & 不紧急', desc: '计划执行', icon: <Star size={12}/>, selectedClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' },
    { id: EisenhowerQuadrant.Q3, label: '紧急 & 不重要', desc: '审慎处理', icon: <Bell size={12}/>, selectedClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' },
    { id: EisenhowerQuadrant.Q4, label: '不重要 & 不紧急', desc: '暂缓排除', icon: <Coffee size={12}/>, selectedClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-[#F2F2F7] dark:bg-black sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-white/20 dark:border-zinc-800">
        
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium px-2 py-1 ios-btn-active">取消</button>
          <div className="font-semibold text-gray-900 dark:text-white">{task ? '编辑事项' : '新建事项'}</div>
          <button onClick={handleSave} className={`text-indigo-600 dark:text-indigo-400 font-semibold text-sm px-2 py-1 ios-btn-active ${isSaveDisabled ? 'opacity-50' : ''}`} disabled={isSaveDisabled}>完成</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div className="space-y-4">
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="事项标题"
                      className="w-full pl-4 pr-12 py-3 border-b border-gray-100 dark:border-zinc-800 outline-none text-base font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white"
                    />
                    <button 
                      onClick={handleSmartFill} 
                      disabled={isSmartFilling}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 disabled:text-gray-400 disabled:animate-pulse p-1"
                      title="智能识别"
                    >
                      <Wand2 size={18} />
                    </button>
                </div>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="备注..."
                    className="w-full px-4 py-3 outline-none text-sm text-gray-600 dark:text-gray-300 resize-none h-20 bg-transparent"
                />
            </div>
             
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                {/* Date/Time Settings */}
                <div className="p-3 space-y-3">
                    <div className="flex items-center">
                        <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                            <div className="bg-red-500 rounded-md p-1 text-white"><CalendarIcon size={14}/></div>
                            <span className="text-sm font-medium">日期</span>
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"/>
                            <span>-</span>
                            <input 
                              type="date" 
                              value={isRecurring ? '' : endDate}
                              onChange={handleEndDateChange} 
                              disabled={isRecurring}
                              className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                            <div className="bg-blue-500 rounded-md p-1 text-white"><Clock size={14}/></div>
                            <span className="text-sm font-medium">时间</span>
                        </div>
                        <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="all-day-check" checked={isAllDay} onChange={(e) => setIsAllDay(e.target.checked)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-zinc-600 dark:bg-zinc-700 dark:checked:bg-indigo-500" />
                                <label htmlFor="all-day-check">全天</label>
                            </div>
                            {!isAllDay && (
                                <>
                                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"/>
                                    <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-16 bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"/>
                                    <span>分钟</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Project */}
                <div className="p-3 flex items-center">
                    <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                        <div className="bg-purple-500 rounded-md p-1 text-white"><Briefcase size={14}/></div>
                        <span className="text-sm font-medium">项目</span>
                    </div>
                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="flex-1 bg-transparent text-right outline-none text-sm text-gray-500 dark:text-gray-400">
                        <option value="">无</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600 ml-1"/>
                </div>

                {/* Priority */}
                <div className="p-3 flex items-center">
                     <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                        <div className="bg-orange-500 rounded-md p-1 text-white"><Zap size={14}/></div>
                        <span className="text-sm font-medium">优先级</span>
                     </div>
                     <div className="flex-1 flex justify-end">
                        <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                           {Object.values(Priority).map(p => (
                              <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${priority === p ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                 {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
                              </button>
                           ))}
                        </div>
                     </div>
                </div>

                {/* Progress */}
                <div className="p-3 flex items-center">
                     <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                        <div className="bg-green-500 rounded-md p-1 text-white"><Activity size={14}/></div>
                        <span className="text-sm font-medium">进展</span>
                     </div>
                     <div className="flex-1 flex justify-end">
                        <select
                          value={progress}
                          onChange={(e) => setProgress(e.target.value as TaskProgress)}
                          className="bg-gray-100 dark:bg-zinc-800 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-sm border-none min-w-[120px]"
                        >
                          <option value={TaskProgress.INITIAL}>初始</option>
                          <option value={TaskProgress.IN_PROGRESS}>进行中</option>
                          <option value={TaskProgress.ON_HOLD}>挂起</option>
                          <option value={TaskProgress.BLOCKED}>阻塞</option>
                          <option value={TaskProgress.COMPLETED}>已完成</option>
                          <option value={TaskProgress.DELAYED}>延迟</option>
                        </select>
                     </div>
                </div>

                {/* Tags */}
                <div className="p-3">
                    <div className="flex items-center mb-2">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <div className="bg-teal-500 rounded-md p-1 text-white"><Tag size={14}/></div>
                            <span className="text-sm font-medium">标签</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <div key={tag} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12}/></button>
                            </div>
                        ))}
                        <input
                            type="text"
                            value={newTagInput}
                            onChange={e => setNewTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                            placeholder="添加标签..."
                            className="flex-1 bg-transparent outline-none text-xs min-w-[80px]"
                        />
                    </div>
                </div>
                
                {/* Recurring */}
                <div className="p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <div className="bg-indigo-500 rounded-md p-1 text-white"><Repeat size={14}/></div>
                            <span className="text-sm font-medium">重复</span>
                        </div>
                        <label htmlFor="recurring-toggle" className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" id="recurring-toggle" className="sr-only peer" checked={isRecurring} onChange={handleRecurringToggle} />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    {isRecurring && <div className="mt-3"><RecurringOptions 
                        frequency={recurFreq} 
                        interval={recurInterval} 
                        weekDays={recurWeekDays} 
                        startDate={recurStartDate} 
                        endDate={recurEndDate} 
                        isRequired={isRecurring}
                        onChange={(updates) => {
                            if (updates.frequency) setRecurFreq(updates.frequency);
                            if (updates.interval) setRecurInterval(updates.interval);
                            if (updates.weekDays) setRecurWeekDays(updates.weekDays);
                            if (updates.startDate) setRecurStartDate(updates.startDate);
                            if (updates.hasOwnProperty('endDate')) setRecurEndDate(updates.endDate);
                        }}
                    /></div>}
                    {recurringRule && (
                      <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                         <p className="mb-1 font-semibold">此为周期任务，你要编辑？</p>
                         <div className="flex gap-2">
                            <button onClick={() => setEditMode('single')} className={`px-2 py-1 rounded ${editMode === 'single' ? 'bg-white dark:bg-indigo-800' : ''}`}>仅此事项</button>
                            <button onClick={() => setEditMode('series')} className={`px-2 py-1 rounded ${editMode === 'series' ? 'bg-white dark:bg-indigo-800' : ''}`}>后续所有</button>
                         </div>
                      </div>
                    )}
                </div>
            </div>

             {/* --- Dependencies --- */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2 p-3 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-zinc-800">
                  <div className="bg-green-500 rounded-md p-1 text-white"><Link2 size={14}/></div>
                  <span className="text-sm font-medium">关联任务</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">前置任务 (需先完成)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {predecessors.map(p => (
                        <div key={p.id} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
                          {p.title}
                          <button onClick={() => handleRemovePredecessor(p.id)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12}/></button>
                        </div>
                      ))}
                      <button ref={selectorAnchorRef} onClick={() => setIsSelectorOpen(true)} className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-full">
                        <Plus size={12} /> 添加
                      </button>
                    </div>
                  </div>
                   <div>
                    <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">后置任务 (依赖此项)</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {successors.length > 0 ? successors.map(s => (
                        <div key={s.id} className="bg-gray-50 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
                          {s.title}
                        </div>
                      )) : <p className="text-xs text-gray-400 italic mt-1">无</p>}
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 p-3">
                <div className="flex items-center gap-2 mb-3 text-gray-700 dark:text-gray-300">
                    <div className="bg-green-500 rounded-md p-1 text-white"><LayoutGrid size={14}/></div>
                    <span className="text-sm font-medium">四象限</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {quadrantOptions.map(opt => (
                        <button key={opt.id} onClick={() => setQuadrant(opt.id)} className={`p-2 rounded-lg text-left transition-colors ${quadrant === opt.id ? opt.selectedClass : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}>
                            <div className="flex items-center gap-1.5">
                                {opt.icon}
                                <span className="text-xs font-semibold">{opt.label}</span>
                            </div>
                            <p className="text-[10px] mt-0.5">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>
             
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <div className="bg-cyan-500 rounded-md p-1 text-white"><AlignLeft size={14}/></div>
                        <span className="text-sm font-medium">子任务</span>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={handleGenerateSubtasks}
                      isLoading={isGenerating}
                      className="gap-1 text-indigo-600 dark:text-indigo-400"
                    >
                      <Sparkles size={14} /> AI 拆解
                    </Button>
                </div>
                <div className="p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {subtasks.map(sub => (
                      <div key={sub.id} className="flex items-center gap-3 group/sub">
                          <button onClick={() => handleToggleSubtaskLocal(sub.id)} className="shrink-0">{sub.completed ? <CheckCircle2 size={18} className="text-green-500"/> : <Circle size={18} className="text-gray-300 dark:text-zinc-600"/>}</button>
                          <input type="text" value={sub.title} onChange={(e) => setSubtasks(s => s.map(i => i.id === sub.id ? {...i, title: e.target.value} : i))} className={`flex-1 bg-transparent outline-none text-sm ${sub.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-800 dark:text-gray-200'}`} />
                          <button onClick={(e) => handleDeleteSubtask(sub.id, e)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/sub:opacity-100"><Trash2 size={14}/></button>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <Plus size={18} className="text-gray-300 dark:text-zinc-600 shrink-0"/>
                      <input type="text" value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSubtask()} placeholder="添加子任务" className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500" />
                    </div>
                </div>
            </div>

             {task && (<button onClick={() => { onDelete(task.id); onClose(); }} className="w-full py-3 text-red-500 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">删除事项</button>)}
          </div>
        </div>
      </div>
      <TaskSelectorPopover
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        anchorEl={selectorAnchorRef.current}
        tasks={allTasks}
        excludeIds={[task?.id, ...predecessorIds, ...(task?.successorIds || [])].filter(Boolean) as string[]}
        onSelect={handleAddPredecessor}
        title="选择前置任务"
      />
    </div>
  );
};