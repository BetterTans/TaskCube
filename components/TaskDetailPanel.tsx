import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant, TaskProgress, SubTask, RecurringFrequency, RecurringRule } from '../types.ts';
import { X, Trash2, Plus, Zap, Star, Bell, Coffee, Check, Sparkles, Wand2, Calendar as CalendarIcon, Clock, AlignLeft, Repeat, Tag, LayoutGrid, Briefcase, Link2, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { getProgressDisplay } from '../utils/taskDisplay.ts';
import { generateUUID } from '../utils/generateUUID.ts';
import { breakDownTask, parseTaskFromNaturalLanguage } from '../services/aiService.ts';
import { parseDate } from '../services/recurringService.ts';
import { RecurringOptions } from './RecurringOptions.tsx';
import { TaskSelectorPopover } from './TaskSelectorPopover.tsx';
import { priorityBadgeStyles, getTagColor } from '../config/taskColors.ts';
import type { ToastType } from '../hooks/useToast.ts';

interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveRule?: (task: Partial<Task>, rule: Partial<RecurringRule>) => Promise<void>;
  onUpdateRule?: (ruleId: string, ruleData: Partial<RecurringRule>) => Promise<void>;
  projects: Project[];
  allTasks: Task[];
  recurringRule?: RecurringRule;
  addToast: (message: string, type: ToastType) => string;
}

const QUADRANT_OPTIONS: { value: EisenhowerQuadrant; icon: React.ElementType; label: string; desc: string; selectedClass: string }[] = [
  { value: EisenhowerQuadrant.Q1, icon: Zap, label: '重要 & 紧急', desc: '立即处理', selectedClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800' },
  { value: EisenhowerQuadrant.Q2, icon: Star, label: '重要 & 不紧急', desc: '计划执行', selectedClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800' },
  { value: EisenhowerQuadrant.Q3, icon: Bell, label: '紧急 & 不重要', desc: '审慎处理', selectedClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { value: EisenhowerQuadrant.Q4, icon: Coffee, label: '不重要 & 不紧急', desc: '暂缓排除', selectedClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
];

const PROGRESS_OPTIONS: TaskProgress[] = [
  TaskProgress.INITIAL, TaskProgress.IN_PROGRESS, TaskProgress.ON_HOLD,
  TaskProgress.BLOCKED, TaskProgress.COMPLETED, TaskProgress.DELAYED,
];

const getPriorityBtnClass = (p: Priority): string => {
  const s = priorityBadgeStyles[p];
  return `${s.light} ${s.dark} shadow-sm font-semibold`;
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task, isOpen, onClose, onUpdate, onDelete, onSaveRule, onUpdateRule,
  projects, allTasks, recurringRule, addToast,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<Partial<Task>>({});
  const [initialForm, setInitialForm] = useState<Partial<Task>>({});
  const [titleError, setTitleError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSmartFilling, setIsSmartFilling] = useState(false);

  // Recurring state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurringFrequency>('daily');
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurWeekDays, setRecurWeekDays] = useState<number[]>([]);
  const [recurStartDate, setRecurStartDate] = useState('');
  const [recurEndDate, setRecurEndDate] = useState('');
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // Dependencies
  const [predecessorIds, setPredecessorIds] = useState<string[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const selectorAnchorRef = useRef<HTMLButtonElement>(null);

  // Collapsible sections
  const [showRecurring, setShowRecurring] = useState(false);
  const [showDependencies, setShowDependencies] = useState(false);

  const tasksById = useMemo(() => new Map(allTasks.map(t => [t.id, t])), [allTasks]);

  // Sync form when task changes
  useEffect(() => {
    if (task) {
      const init = { ...task };
      setForm(init);
      setInitialForm(init);
      setTitleError(false);
      setShowDeleteConfirm(false);

      setPredecessorIds(task.predecessorIds || []);
      setShowRecurring(!!task.recurringRuleId);
      setIsRecurring(!!task.recurringRuleId);

      if (recurringRule) {
        setRecurFreq(recurringRule.frequency);
        setRecurInterval(recurringRule.interval);
        setRecurWeekDays(recurringRule.weekDays || []);
        setRecurStartDate(recurringRule.startDate);
        setRecurEndDate(recurringRule.endDate || '');
        setEditMode('single');
      } else if (task.recurringRuleId) {
        setRecurFreq('daily');
        setRecurInterval(1);
        const d = parseDate(task.date);
        setRecurWeekDays([d.getDay()]);
        setRecurStartDate(task.date);
        setRecurEndDate('');
        setEditMode('single');
      }
    }
  }, [task?.id]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('[data-popover]')) {
        onClose();
      }
    };
    const timeout = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleBlur = useCallback((field: string, value: unknown) => {
    if (!task) return;
    const initialValue = (initialForm as Record<string, unknown>)[field];
    if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
      if (field === 'title' && !(value as string)?.trim()) {
        setTitleError(true);
        return;
      }
      onUpdate({ id: task.id, [field]: value });
      setInitialForm(prev => ({ ...prev, [field]: value }));
    }
  }, [task, initialForm, onUpdate]);

  const updateField = (field: string, value: unknown) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDelete = () => {
    if (!task) return;
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
    } else {
      onDelete(task.id);
      onClose();
      addToast('任务已删除', 'success');
    }
  };

  // Smart fill
  const handleSmartFill = async () => {
    if (!form.title?.trim()) return;
    setIsSmartFilling(true);
    try {
      const parsed = await parseTaskFromNaturalLanguage(form.title, form.date || '');
      if (parsed.title) { updateField('title', parsed.title); }
      if (parsed.date) { updateField('date', parsed.date); handleBlur('date', parsed.date); }
      if (parsed.priority) { updateField('priority', parsed.priority); handleBlur('priority', parsed.priority); }
      if (parsed.quadrant) { updateField('quadrant', parsed.quadrant); handleBlur('quadrant', parsed.quadrant); }
      if (parsed.startTime) { updateField('startTime', parsed.startTime); handleBlur('startTime', parsed.startTime); }
      if (parsed.duration) { updateField('duration', parsed.duration); handleBlur('duration', parsed.duration); }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "智能识别失败", "warning");
    }
    setIsSmartFilling(false);
  };

  // AI breakdown
  const handleGenerateSubtasks = async () => {
    if (!form.title?.trim()) return;
    setIsGenerating(true);
    try {
      const subtaskTitles = await breakDownTask(form.title);
      if (subtaskTitles.length > 0) {
        const newSubtasks: SubTask[] = subtaskTitles.map(t => ({ id: generateUUID(), title: t, completed: false }));
        const subTasks = [...(form.subTasks || []), ...newSubtasks];
        updateField('subTasks', subTasks);
        onUpdate({ id: task!.id, subTasks });
        setInitialForm(prev => ({ ...prev, subTasks }));
      }
    } catch (e) {
      addToast(e instanceof Error ? e.message : "智能拆解失败", "warning");
    }
    setIsGenerating(false);
  };

  // Tags
  const addTag = () => {
    const tag = tagInput.trim();
    if (!tag || !task) return;
    const currentTags = form.tags || [];
    if (currentTags.includes(tag)) { setTagInput(''); return; }
    const newTags = [...currentTags, tag];
    updateField('tags', newTags);
    onUpdate({ id: task.id, tags: newTags });
    setInitialForm(prev => ({ ...prev, tags: newTags }));
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (!task) return;
    const newTags = (form.tags || []).filter(t => t !== tag);
    updateField('tags', newTags);
    onUpdate({ id: task.id, tags: newTags });
    setInitialForm(prev => ({ ...prev, tags: newTags }));
  };

  // Subtasks
  const addSubTask = () => {
    const title = newSubTaskTitle.trim();
    if (!title || !task) return;
    const newSub: SubTask = { id: generateUUID(), title, completed: false };
    const subTasks = [...(form.subTasks || []), newSub];
    updateField('subTasks', subTasks);
    onUpdate({ id: task.id, subTasks });
    setInitialForm(prev => ({ ...prev, subTasks }));
    setNewSubTaskTitle('');
  };

  const toggleSubTask = (subId: string) => {
    if (!task) return;
    const subTasks = (form.subTasks || []).map(s =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    updateField('subTasks', subTasks);
    onUpdate({ id: task.id, subTasks });
    setInitialForm(prev => ({ ...prev, subTasks }));
  };

  const deleteSubTask = (subId: string) => {
    if (!task) return;
    const subTasks = (form.subTasks || []).filter(s => s.id !== subId);
    updateField('subTasks', subTasks);
    onUpdate({ id: task.id, subTasks });
    setInitialForm(prev => ({ ...prev, subTasks }));
  };

  // Dependencies
  const checkCircularDependency = (taskId: string, potentialPredId: string): boolean => {
    const visited = new Set<string>();
    let queue: string[] = [];
    const initialTask = tasksById.get(taskId);
    if (initialTask?.successorIds) {
      queue = [...initialTask.successorIds];
    }
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (currentId === potentialPredId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const taskNode = tasksById.get(currentId);
      if (taskNode?.successorIds) {
        for (const succId of taskNode.successorIds) {
          if (!visited.has(succId)) queue.push(succId);
        }
      }
    }
    return false;
  };

  const handleAddPredecessor = (predId: string) => {
    if (task && checkCircularDependency(task.id, predId)) {
      addToast("无法添加，这会造成循环依赖！", "warning");
      return;
    }
    if (!predecessorIds.includes(predId)) {
      const newIds = [...predecessorIds, predId];
      setPredecessorIds(newIds);
      onUpdate({ id: task!.id, predecessorIds: newIds });
      setInitialForm(prev => ({ ...prev, predecessorIds: newIds }));
    }
  };

  const handleRemovePredecessor = (predId: string) => {
    const newIds = predecessorIds.filter(id => id !== predId);
    setPredecessorIds(newIds);
    if (task) {
      onUpdate({ id: task.id, predecessorIds: newIds });
      setInitialForm(prev => ({ ...prev, predecessorIds: newIds }));
    }
  };

  // Recurring
  const handleRecurringToggle = () => {
    const newState = !isRecurring;
    setIsRecurring(newState);
    setShowRecurring(newState);
    if (newState && !recurringRule) {
      const startDate = form.date || '';
      setRecurStartDate(startDate);
      const d = parseDate(startDate);
      setRecurWeekDays([d.getDay()]);
    }
  };

  const handleSaveRecurring = () => {
    if (!task || !onSaveRule || !isRecurring) return;
    const timeData = form.startTime ? { startTime: form.startTime, duration: form.duration } : { startTime: undefined, duration: undefined };

    if (editMode === 'series' && recurringRule && onUpdateRule) {
      onUpdateRule(recurringRule.id, {
        title: form.title, description: form.description, priority: form.priority,
        quadrant: form.quadrant, projectId: form.projectId, tags: form.tags,
        startTime: timeData.startTime, duration: timeData.duration,
      });
      addToast('周期规则已更新', 'success');
    } else if (isRecurring && !task.recurringRuleId) {
      onSaveRule({}, {
        title: form.title!, description: form.description, priority: form.priority || Priority.MEDIUM,
        quadrant: form.quadrant || EisenhowerQuadrant.Q2,
        frequency: recurFreq, interval: recurInterval, weekDays: recurWeekDays,
        startDate: recurStartDate, endDate: recurEndDate,
        projectId: form.projectId, tags: form.tags || [],
        subTaskTitles: (form.subTasks || []).map(s => s.title),
        ...timeData,
      });
      addToast('周期任务已创建', 'success');
    }
  };

  if (!task) return null;

  const predecessors = predecessorIds.map(id => tasksById.get(id)).filter(Boolean) as Task[];
  const successors = task.successorIds?.map(id => tasksById.get(id)).filter(Boolean) as Task[] || [];

  // Shared section label style
  const SectionLabel = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
      <div className="bg-indigo-500 rounded-md p-1 text-white">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/20 transition-opacity" />}

      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-96 max-w-[calc(100vw-2rem)] bg-[#F2F2F7] dark:bg-black shadow-2xl z-40 flex flex-col border-l border-white/20 dark:border-zinc-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">取消</button>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">编辑事项</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDelete}
              className={`p-1.5 rounded-lg transition-colors ${
                showDeleteConfirm
                  ? 'bg-red-500 text-white'
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
              title={showDeleteConfirm ? '确认删除' : '删除任务'}
            >
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800" title="关闭">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {/* Title + Smart Fill */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
            <div className="relative">
              <input
                type="text"
                value={form.title || ''}
                onChange={(e) => { updateField('title', e.target.value); setTitleError(false); }}
                onBlur={() => handleBlur('title', form.title)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className={`w-full pl-4 pr-12 py-3 border-b border-gray-100 dark:border-zinc-800 outline-none text-base font-medium bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 ${
                  titleError ? 'ring-2 ring-red-200 dark:ring-red-800' : ''
                }`}
                placeholder="事项标题"
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
              value={form.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              onBlur={() => handleBlur('description', form.description)}
              className="w-full px-4 py-3 outline-none text-sm text-gray-600 dark:text-gray-300 resize-none h-16 bg-transparent placeholder:text-gray-400 dark:placeholder:text-zinc-500"
              placeholder="备注..."
            />
          </div>
          {titleError && <p className="text-xs text-red-500 -mt-3 px-1">标题不能为空</p>}
          {showDeleteConfirm && (
            <div className="p-2 -mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <span>确定要删除此任务吗？此操作不可撤销。</span>
              <button onClick={handleDelete} className="px-2 py-0.5 bg-red-500 text-white rounded font-medium shrink-0">确认</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded font-medium shrink-0">取消</button>
            </div>
          )}

          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
            {/* Date Range */}
            <div className="p-3 flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="bg-red-500 rounded-md p-1 text-white"><CalendarIcon size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">日期</span>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                <input
                  type="date"
                  value={form.date || ''}
                  onChange={(e) => { updateField('date', e.target.value); handleBlur('date', e.target.value); }}
                  className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="date"
                  value={form.endDate || ''}
                  onChange={(e) => { updateField('endDate', e.target.value || undefined); handleBlur('endDate', e.target.value || undefined); }}
                  className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"
                />
              </div>
            </div>

            {/* Time & Duration */}
            <div className="p-3 flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="bg-blue-500 rounded-md p-1 text-white"><Clock size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">时间</span>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                <input
                  type="time"
                  value={form.startTime || ''}
                  onChange={(e) => { updateField('startTime', e.target.value || undefined); handleBlur('startTime', e.target.value || undefined); }}
                  className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"
                />
                <input
                  type="number"
                  value={form.duration || ''}
                  onChange={(e) => { updateField('duration', e.target.value ? Number(e.target.value) : undefined); handleBlur('duration', e.target.value ? Number(e.target.value) : undefined); }}
                  className="w-16 bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 border-none"
                  placeholder="60"
                  min={0}
                />
                <span className="text-xs text-gray-400">分钟</span>
              </div>
            </div>

            {/* Project */}
            <div className="p-3 flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="bg-purple-500 rounded-md p-1 text-white"><Briefcase size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">项目</span>
              </div>
              <select
                value={form.projectId || ''}
                onChange={(e) => { updateField('projectId', e.target.value || undefined); handleBlur('projectId', e.target.value || undefined); }}
                className="flex-1 bg-transparent text-right outline-none text-sm text-gray-500 dark:text-gray-400"
              >
                <option value="">无</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600 ml-1"/>
            </div>

            {/* Priority */}
            <div className="p-3 flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="bg-orange-500 rounded-md p-1 text-white"><Zap size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">优先级</span>
              </div>
              <div className="flex-1 flex justify-end">
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                  {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
                    <button
                      key={p}
                      onClick={() => { updateField('priority', p); handleBlur('priority', p); }}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                        form.priority === p ? getPriorityBtnClass(p) : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="p-3 flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="bg-green-500 rounded-md p-1 text-white"><Activity size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">进展</span>
              </div>
              <select
                value={form.progress || TaskProgress.INITIAL}
                onChange={(e) => { updateField('progress', e.target.value as TaskProgress); handleBlur('progress', e.target.value); }}
                className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 text-sm border-none min-w-[120px] text-right"
              >
                {PROGRESS_OPTIONS.map(p => {
                  const info = getProgressDisplay(p);
                  return <option key={p} value={p}>{info.label}</option>;
                })}
              </select>
            </div>
          </div>

          {/* Quadrant */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-green-500 rounded-md p-1 text-white"><LayoutGrid size={14}/></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">四象限</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {QUADRANT_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = form.quadrant === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { updateField('quadrant', opt.value); handleBlur('quadrant', opt.value); }}
                    className={`p-2 rounded-lg text-left transition-colors border ${
                      isSelected
                        ? opt.selectedClass
                        : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border-gray-200 dark:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon size={12} />
                      <span className="text-xs font-semibold">{opt.label}</span>
                    </div>
                    <p className="text-[10px] mt-0.5 opacity-70">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-teal-500 rounded-md p-1 text-white"><Tag size={14}/></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags || []).map(tag => {
                const tc = getTagColor(tag);
                return (
                  <span key={tag} className={`flex items-center ${tc.light} ${tc.dark} text-xs pl-2 pr-1 py-1 rounded-full font-medium`}>
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12}/></button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 bg-transparent outline-none text-xs px-2 py-1"
                placeholder="添加标签..."
              />
              <button onClick={addTag} className="px-2 py-1 rounded-lg bg-indigo-500 text-white text-xs hover:bg-indigo-600"><Plus size={14}/></button>
            </div>
          </div>

          {/* Subtasks */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
            <div className="p-3 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="bg-cyan-500 rounded-md p-1 text-white"><AlignLeft size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">子任务</span>
              </div>
              <button
                onClick={handleGenerateSubtasks}
                disabled={isGenerating || !form.title?.trim()}
                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <Sparkles size={14} /> AI 拆解
              </button>
            </div>
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {(form.subTasks || []).map(sub => (
                <div key={sub.id} className="flex items-center gap-3 group/sub">
                  <button
                    onClick={() => toggleSubTask(sub.id)}
                    className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                      sub.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-zinc-600'
                    }`}
                  >
                    {sub.completed && <Check size={10} />}
                  </button>
                  <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {sub.title}
                  </span>
                  <button
                    onClick={() => deleteSubTask(sub.id)}
                    className="opacity-0 group-hover/sub:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <Plus size={18} className="text-gray-300 dark:text-zinc-600 shrink-0"/>
                <input
                  type="text"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubTask(); } }}
                  className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500"
                  placeholder="添加子任务"
                />
              </div>
            </div>
          </div>

          {/* Collapsible: Recurring */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
            <button
              onClick={() => setShowRecurring(!showRecurring)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500 rounded-md p-1 text-white"><Repeat size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">重复</span>
                {isRecurring && <span className="text-[10px] text-indigo-500 font-medium bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full">已启用</span>}
              </div>
              {showRecurring ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
            </button>
            {showRecurring && (
              <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <label htmlFor="panel-recurring-toggle" className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" id="panel-recurring-toggle" className="sr-only peer" checked={isRecurring} onChange={handleRecurringToggle} />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">重复任务</span>
                </label>
                {isRecurring && (
                  <>
                    <RecurringOptions
                      frequency={recurFreq}
                      interval={recurInterval}
                      weekDays={recurWeekDays}
                      startDate={recurStartDate || form.date || ''}
                      endDate={recurEndDate}
                      isRequired={isRecurring}
                      onChange={(updates) => {
                        if (updates.frequency) setRecurFreq(updates.frequency);
                        if (updates.interval) setRecurInterval(updates.interval);
                        if (updates.weekDays) setRecurWeekDays(updates.weekDays);
                        if (updates.startDate) setRecurStartDate(updates.startDate);
                        if (updates.hasOwnProperty('endDate')) setRecurEndDate(updates.endDate);
                      }}
                    />
                    {recurringRule && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-xs text-indigo-700 dark:text-indigo-300">
                        <p className="mb-1 font-semibold">此为周期任务，你要编辑？</p>
                        <div className="flex gap-2">
                          <button onClick={() => setEditMode('single')} className={`px-2 py-1 rounded ${editMode === 'single' ? 'bg-white dark:bg-indigo-800' : ''}`}>仅此事项</button>
                          <button onClick={() => setEditMode('series')} className={`px-2 py-1 rounded ${editMode === 'series' ? 'bg-white dark:bg-indigo-800' : ''}`}>后续所有</button>
                        </div>
                      </div>
                    )}
                    {isRecurring && !task.recurringRuleId && onSaveRule && (
                      <button
                        onClick={handleSaveRecurring}
                        className="w-full py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
                      >
                        创建周期规则
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Collapsible: Dependencies */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
            <button
              onClick={() => setShowDependencies(!showDependencies)}
              className="w-full p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="bg-green-500 rounded-md p-1 text-white"><Link2 size={14}/></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">关联任务</span>
                {predecessorIds.length > 0 && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{predecessorIds.length}</span>
                )}
              </div>
              {showDependencies ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
            </button>
            {showDependencies && (
              <div className="px-3 pb-3 space-y-3 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <div>
                  <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">前置任务 (需先完成)</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {predecessors.map(p => (
                      <div key={p.id} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs pl-2 pr-1 py-1 rounded-full border border-gray-200 dark:border-zinc-700">
                        {p.title}
                        <button onClick={() => handleRemovePredecessor(p.id)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12}/></button>
                      </div>
                    ))}
                    <button
                      ref={selectorAnchorRef}
                      onClick={() => setIsSelectorOpen(true)}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-full"
                    >
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
            )}
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
    </>
  );
};
