import React, { useState } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant, TaskProgress, SubTask } from '../types.ts';
import { Zap, Star, Bell, Coffee, Calendar as CalendarIcon, Clock, Plus, X, Check, Trash2, Tag, Briefcase, AlignLeft, LayoutGrid } from 'lucide-react';
import { priorityBadgeStyles, getTagColor } from '../config/taskColors.ts';

export const QUADRANT_OPTIONS: { value: EisenhowerQuadrant; icon: React.ElementType; label: string; desc: string; selectedClass: string }[] = [
  { value: EisenhowerQuadrant.Q1, icon: Zap, label: '重要 & 紧急', desc: '立即处理', selectedClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
  { value: EisenhowerQuadrant.Q2, icon: Star, label: '重要 & 不紧急', desc: '计划执行', selectedClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { value: EisenhowerQuadrant.Q3, icon: Bell, label: '紧急 & 不重要', desc: '审慎处理', selectedClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
  { value: EisenhowerQuadrant.Q4, icon: Coffee, label: '不重要 & 不紧急', desc: '暂缓排除', selectedClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
];

export const PROGRESS_OPTIONS: TaskProgress[] = [
  TaskProgress.INITIAL, TaskProgress.IN_PROGRESS, TaskProgress.ON_HOLD,
  TaskProgress.BLOCKED, TaskProgress.COMPLETED, TaskProgress.DELAYED,
];

const PROGRESS_LABELS: Record<TaskProgress, { label: string; color: string }> = {
  [TaskProgress.INITIAL]: { label: '初始', color: 'bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-zinc-300' },
  [TaskProgress.IN_PROGRESS]: { label: '进行中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  [TaskProgress.ON_HOLD]: { label: '挂起', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  [TaskProgress.BLOCKED]: { label: '阻塞', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  [TaskProgress.COMPLETED]: { label: '已完成', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  [TaskProgress.DELAYED]: { label: '延迟', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};

interface TaskEditorCoreProps {
  mode: 'panel' | 'modal';
  title: string; onTitleChange: (v: string) => void;
  description: string; onDescriptionChange: (v: string) => void;
  priority: Priority; onPriorityChange: (v: Priority) => void;
  quadrant: EisenhowerQuadrant; onQuadrantChange: (v: EisenhowerQuadrant) => void;
  progress: TaskProgress; onProgressChange: (v: TaskProgress) => void;
  startDate: string; onStartDateChange: (v: string) => void;
  endDate: string; onEndDateChange: (v: string) => void;
  isEndDateDisabled?: boolean;
  startTime?: string; onStartTimeChange?: (v: string) => void;
  duration?: number; onDurationChange?: (v: number) => void;
  projectId?: string; onProjectIdChange: (v: string | undefined) => void;
  projects: Project[];
  tags: string[]; onTagsChange: (tags: string[]) => void;
  subTasks: SubTask[]; onSubTasksChange: (subTasks: SubTask[]) => void;
  onTitleBlur?: () => void; titleError?: boolean;
  children?: React.ReactNode;
}

// Shared section wrapper
const Section: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode; className?: string }> = ({ icon, label, children, className }) => (
  <div className={`${className || ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-gray-400 dark:text-zinc-500">{icon}</span>
      <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
    {children}
  </div>
);

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
  const isPanel = mode === 'panel';

  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) onTagsChange([...tags, t]); setTagInput(''); };
  const removeTag = (tag: string) => onTagsChange(tags.filter(t => t !== tag));
  const addSubTask = () => { const t = prompt('子任务名称'); if (t?.trim()) onSubTasksChange([...subTasks, { id: crypto.randomUUID(), title: t.trim(), completed: false }]); };
  const toggleSubTask = (id: string) => onSubTasksChange(subTasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  const deleteSubTask = (id: string) => onSubTasksChange(subTasks.filter(s => s.id !== id));

  const fieldClass = `w-full bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 py-3 text-sm outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 focus:bg-white dark:focus:bg-zinc-800 transition-all text-gray-800 dark:text-gray-200 placeholder:text-gray-400`;

  return (
    <div className={`${isPanel ? 'divide-y divide-gray-100 dark:divide-zinc-800/50' : 'space-y-4'}`}>
      {/* Title */}
      <div className={isPanel ? 'pb-4' : ''}>
        <div className="relative">
          <input type="text" value={title} onChange={e => { onTitleChange(e.target.value); if (titleError && onTitleBlur) onTitleBlur(); }}
            onBlur={onTitleBlur} placeholder="事项标题"
            className={`w-full text-lg font-semibold bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-zinc-600 pb-1 ${titleError ? 'border-b-2 border-red-400' : 'border-b-2 border-transparent focus:border-indigo-400 transition-colors'}`} />
          {children && <div className="absolute right-0 top-0">{children}</div>}
        </div>
        {titleError && <p className="text-red-400 text-xs mt-1.5">标题不能为空</p>}
      </div>

      {/* Description */}
      <div className={isPanel ? 'py-4' : ''}>
        <textarea value={description} onChange={e => onDescriptionChange(e.target.value)} onBlur={onTitleBlur}
          placeholder="添加备注..."
          className={`${fieldClass} min-h-[72px] resize-none`} />
      </div>

      {/* Date & Time */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<CalendarIcon size={14} />} label="日期 & 时间">
          <div className="flex items-center gap-2">
            <input type="date" value={startDate} onChange={e => onStartDateChange(e.target.value)} onBlur={onTitleBlur}
              className="flex-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 dark:color-scheme-dark" />
            <span className="text-gray-300 text-sm">至</span>
            <input type="date" value={endDate} onChange={e => onEndDateChange(e.target.value)} disabled={isEndDateDisabled} onBlur={onTitleBlur}
              className="flex-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 dark:color-scheme-dark disabled:opacity-40" />
          </div>
          {onStartTimeChange && (
            <div className="flex items-center gap-2 mt-2">
              <input type="time" value={startTime || ''} onChange={e => onStartTimeChange(e.target.value)} onBlur={onTitleBlur}
                className="flex-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 dark:color-scheme-dark" />
              <select value={duration || 60} onChange={e => onDurationChange?.(Number(e.target.value))} onBlur={onTitleBlur}
                className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5 text-sm outline-none border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600">
                {[15,30,60,90,120].map(m => <option key={m} value={m}>{m} 分钟</option>)}
              </select>
            </div>
          )}
        </Section>
      </div>

      {/* Priority — inline pills */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<Zap size={14} />} label="优先级">
          <div className="flex gap-2">
            {[
              { v: Priority.HIGH, label: '高', active: 'bg-red-500 text-white', inactive: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400' },
              { v: Priority.MEDIUM, label: '中', active: 'bg-amber-500 text-white', inactive: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400' },
              { v: Priority.LOW, label: '低', active: 'bg-sky-500 text-white', inactive: 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400' },
            ].map(({ v, label, active, inactive }) => (
              <button key={v} onClick={() => onPriorityChange(v)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${priority === v ? active + ' shadow-sm' : inactive + ' hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Quadrant — 2x2 grid */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<LayoutGrid size={14} />} label="四象限">
          <div className="grid grid-cols-2 gap-2">
            {QUADRANT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => onQuadrantChange(opt.value)}
                className={`p-2.5 rounded-xl text-left border transition-all duration-200 ${quadrant === opt.value ? opt.selectedClass + ' shadow-sm' : 'bg-gray-50 dark:bg-zinc-800/50 border-transparent hover:border-gray-200 dark:hover:border-zinc-700'}`}>
                <div className="flex items-center gap-1.5"><opt.icon size={13}/><span className="text-xs font-semibold">{opt.label}</span></div>
                <p className="text-[10px] mt-0.5 opacity-60">{opt.desc}</p>
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Progress — styled chips */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<AlignLeft size={14} />} label="进展">
          <div className="flex flex-wrap gap-1.5">
            {PROGRESS_OPTIONS.map(p => {
              const info = PROGRESS_LABELS[p];
              return (
                <button key={p} onClick={() => onProgressChange(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${progress === p ? info.color + ' ring-1 ring-current/20' : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'}`}>
                  {info.label}
                </button>
              );
            })}
          </div>
        </Section>
      </div>

      {/* Project */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<Briefcase size={14} />} label="项目">
          <select value={projectId || ''} onChange={e => onProjectIdChange(e.target.value || undefined)} onBlur={onTitleBlur}
            className={`${fieldClass} appearance-none`}>
            <option value="">无项目</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </Section>
      </div>

      {/* Tags */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<Tag size={14} />} label="标签">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map(tag => {
              const c = getTagColor(tag);
              return (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{ backgroundColor: c + '18', color: c, borderColor: c + '40' }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} className="opacity-60 hover:opacity-100 ml-0.5"><X size={11}/></button>
                </span>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="添加标签..." className={`${fieldClass} flex-1 py-2 text-xs`} />
            <button onClick={addTag} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 transition-colors"><Plus size={14}/></button>
          </div>
        </Section>
      </div>

      {/* Subtasks */}
      <div className={isPanel ? 'py-4' : ''}>
        <Section icon={<Check size={14} />} label={`子任务 (${subTasks.filter(s => s.completed).length}/${subTasks.length})`}>
          <div className="space-y-1.5 mb-2">
            {subTasks.map(st => (
              <div key={st.id} className="flex items-center gap-2.5 group py-1">
                <button onClick={() => toggleSubTask(st.id)}
                  className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${st.completed ? 'bg-green-500 border-green-500 text-white scale-90' : 'border-gray-300 dark:border-zinc-600 hover:border-indigo-400'}`}>
                  {st.completed && <Check size={10} strokeWidth={3}/>}
                </button>
                <span className={`flex-1 text-sm ${st.completed ? 'line-through text-gray-400 dark:text-zinc-500' : 'text-gray-700 dark:text-zinc-300'}`}>{st.title}</span>
                <button onClick={() => deleteSubTask(st.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
          <button onClick={addSubTask} className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-600 font-medium transition-colors">
            <Plus size={15}/> 添加子任务
          </button>
        </Section>
      </div>
    </div>
  );
};
