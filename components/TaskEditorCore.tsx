import React, { useState } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant, TaskProgress, SubTask } from '../types.ts';
import { Zap, Star, Bell, Coffee, Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react';
import { priorityBadgeStyles, getTagColor } from '../config/taskColors.ts';

// ── Shared constants ──
export const QUADRANT_OPTIONS: { value: EisenhowerQuadrant; icon: React.ElementType; label: string; desc: string; selectedClass: string }[] = [
  { value: EisenhowerQuadrant.Q1, icon: Zap, label: '重要 & 紧急', desc: '立即处理', selectedClass: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800' },
  { value: EisenhowerQuadrant.Q2, icon: Star, label: '重要 & 不紧急', desc: '计划执行', selectedClass: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800' },
  { value: EisenhowerQuadrant.Q3, icon: Bell, label: '紧急 & 不重要', desc: '审慎处理', selectedClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
  { value: EisenhowerQuadrant.Q4, icon: Coffee, label: '不重要 & 不紧急', desc: '暂缓排除', selectedClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
];

export const PROGRESS_OPTIONS: TaskProgress[] = [
  TaskProgress.INITIAL, TaskProgress.IN_PROGRESS, TaskProgress.ON_HOLD,
  TaskProgress.BLOCKED, TaskProgress.COMPLETED, TaskProgress.DELAYED,
];

const PROGRESS_LABELS: Record<TaskProgress, string> = {
  [TaskProgress.INITIAL]: '初始',
  [TaskProgress.IN_PROGRESS]: '进行中',
  [TaskProgress.ON_HOLD]: '挂起',
  [TaskProgress.BLOCKED]: '阻塞',
  [TaskProgress.COMPLETED]: '已完成',
  [TaskProgress.DELAYED]: '延迟',
};

const getPriorityBtnClass = (p: Priority): string => {
  const s = priorityBadgeStyles[p];
  return `${s.light} ${s.dark} shadow-sm font-semibold`;
};

// ── Props ──
interface TaskEditorCoreProps {
  mode: 'panel' | 'modal';
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  priority: Priority;
  onPriorityChange: (v: Priority) => void;
  quadrant: EisenhowerQuadrant;
  onQuadrantChange: (v: EisenhowerQuadrant) => void;
  progress: TaskProgress;
  onProgressChange: (v: TaskProgress) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  isEndDateDisabled?: boolean;
  startTime?: string;
  onStartTimeChange?: (v: string) => void;
  duration?: number;
  onDurationChange?: (v: number) => void;
  projectId?: string;
  onProjectIdChange: (v: string | undefined) => void;
  projects: Project[];
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  subTasks: SubTask[];
  onSubTasksChange: (subTasks: SubTask[]) => void;
  // Optional: mode-specific extras
  onTitleBlur?: () => void;
  titleError?: boolean;
  children?: React.ReactNode; // slot for mode-specific actions (AI button, etc)
}

export const TaskEditorCore: React.FC<TaskEditorCoreProps> = ({
  mode, title, onTitleChange, description, onDescriptionChange,
  priority, onPriorityChange, quadrant, onQuadrantChange,
  progress, onProgressChange, startDate, onStartDateChange,
  endDate, onEndDateChange, isEndDateDisabled,
  startTime, onStartTimeChange, duration, onDurationChange,
  projectId, onProjectIdChange, projects, tags, onTagsChange,
  subTasks, onSubTasksChange, onTitleBlur, titleError, children,
}) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      onTagsChange([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  const addSubTask = () => {
    const title = prompt('子任务名称');
    if (title?.trim()) {
      onSubTasksChange([...subTasks, { id: crypto.randomUUID(), title: title.trim(), completed: false }]);
    }
  };

  const toggleSubTask = (id: string) => {
    onSubTasksChange(subTasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSubTask = (id: string) => {
    onSubTasksChange(subTasks.filter(s => s.id !== id));
  };

  const isPanel = mode === 'panel';
  const isModal = mode === 'modal';

  return (
    <div className="space-y-4">
      {/* Title + Description */}
      <div className={`${isPanel ? '' : 'bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800'}`}>
        {isModal && (
          <div className="relative">
            <input
              type="text" value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="事项标题"
              className={`w-full pl-4 pr-12 py-3 border-b border-gray-100 dark:border-zinc-800 outline-none text-base font-medium placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white ${titleError ? 'border-red-500' : ''}`}
            />
            {children}
          </div>
        )}
        {isPanel && (
          <div>
            <div className="relative">
              <input
                type="text" value={title}
                onChange={(e) => { onTitleChange(e.target.value); if (titleError) onTitleBlur?.(); }}
                onBlur={onTitleBlur}
                placeholder="事项标题"
                className={`w-full text-xl font-semibold bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 ${titleError ? 'border-b border-red-500' : ''}`}
              />
              <div className="absolute right-0 top-1/2 -translate-y-1/2">
                {children}
              </div>
            </div>
            {titleError && (
              <p className="text-red-500 text-xs mt-1">标题不能为空</p>
            )}
          </div>
        )}
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          onBlur={onTitleBlur}
          placeholder="备注..."
          className={`w-full px-4 py-3 outline-none text-sm text-gray-600 dark:text-gray-300 resize-none bg-transparent ${isPanel ? 'mt-3 min-h-[80px]' : 'h-20'}`}
        />
      </div>

      {/* Date / Time */}
      <div className={`${isPanel ? 'space-y-3' : 'bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800'}`}>
        <div className="p-3 space-y-3">
          <div className="flex items-center">
            <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
              <div className="bg-red-500 rounded-md p-1 text-white"><CalendarIcon size={14}/></div>
              <span className="text-sm font-medium">日期</span>
            </div>
            <div className="flex-1 flex items-center justify-end gap-2 text-sm">
              <input type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} onBlur={onTitleBlur} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"/>
              <span>-</span>
              <input type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} disabled={isEndDateDisabled} onBlur={onTitleBlur} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none disabled:opacity-50"/>
            </div>
          </div>
          {onStartTimeChange && (
            <div className="flex items-center">
              <div className="flex items-center gap-2 w-24 shrink-0 text-gray-700 dark:text-gray-300">
                <div className="bg-blue-500 rounded-md p-1 text-white"><Clock size={14}/></div>
                <span className="text-sm font-medium">时间</span>
              </div>
              <div className="flex-1 flex items-center justify-end gap-2 text-sm">
                <input type="time" value={startTime || ''} onChange={(e) => onStartTimeChange(e.target.value)} onBlur={onTitleBlur} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none"/>
                <span className="text-xs text-gray-400">时长</span>
                <select value={duration || 60} onChange={(e) => onDurationChange?.(Number(e.target.value))} onBlur={onTitleBlur} className="bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none text-sm">
                  {[15, 30, 60, 90, 120].map(m => <option key={m} value={m}>{m}分钟</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Priority */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">优先级</label>}
        <div className="flex gap-2">
          {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
            <button key={p} onClick={() => onPriorityChange(p)}
              className={`px-3 py-1 rounded-lg text-xs transition-all flex-1 text-center ${priority === p ? getPriorityBtnClass(p) : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>
              {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
            </button>
          ))}
        </div>
      </div>

      {/* Quadrant */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">象限</label>}
        <div className={`grid ${isPanel ? 'grid-cols-2 gap-1.5' : 'grid-cols-2 gap-2'}`}>
          {QUADRANT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onQuadrantChange(opt.value)}
              className={`p-2 rounded-lg text-left transition-colors ${quadrant === opt.value ? opt.selectedClass : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'}`}>
              <div className="flex items-center gap-1.5">
                <opt.icon size={14}/>
                <span className="text-xs font-medium">{opt.label}</span>
              </div>
              <p className="text-xs mt-0.5 opacity-75">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">进展</label>}
        <select value={progress} onChange={(e) => onProgressChange(e.target.value as TaskProgress)} onBlur={onTitleBlur}
          className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none">
          {PROGRESS_OPTIONS.map(p => <option key={p} value={p}>{PROGRESS_LABELS[p]}</option>)}
        </select>
      </div>

      {/* Project */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">项目</label>}
        <select value={projectId || ''} onChange={(e) => onProjectIdChange(e.target.value || undefined)} onBlur={onTitleBlur}
          className="w-full bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark border-none">
          <option value="">无项目</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </div>

      {/* Tags */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">标签</label>}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: getTagColor(tag) + '20', color: getTagColor(tag) }}>
              {tag}
              <button onClick={() => removeTag(tag)} className="hover:opacity-70"><X size={10}/></button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="添加标签..."
            className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-md px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-indigo-500 border-none"/>
          <button onClick={addTag} className="px-2 py-1 bg-indigo-500 text-white rounded-md text-sm"><Plus size={14}/></button>
        </div>
      </div>

      {/* SubTasks */}
      <div className={isPanel ? 'space-y-2' : 'bg-white dark:bg-zinc-900 rounded-xl p-3 shadow-sm border border-gray-200 dark:border-zinc-800'}>
        {isPanel && <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          子任务 ({subTasks.filter(s => s.completed).length}/{subTasks.length})
        </label>}
        {subTasks.map(st => (
          <div key={st.id} className="flex items-center gap-2 py-1">
            <input type="checkbox" checked={st.completed} onChange={() => toggleSubTask(st.id)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
            <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{st.title}</span>
            <button onClick={() => deleteSubTask(st.id)} className="text-gray-400 hover:text-red-500"><X size={14}/></button>
          </div>
        ))}
        <button onClick={addSubTask} className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600 mt-1">
          <Plus size={14}/> 添加子任务
        </button>
      </div>
    </div>
  );
};
