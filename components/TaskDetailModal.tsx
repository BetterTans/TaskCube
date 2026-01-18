import React, { useState, useEffect } from 'react';
import { Task, Priority, SubTask, RecurringFrequency, RecurringRule, EisenhowerQuadrant, Project } from '../types';
import { breakDownTask, parseTaskFromNaturalLanguage } from '../services/aiService';
import { Button } from './Button';
import { RecurringOptions } from './RecurringOptions';
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
  Wand2
} from 'lucide-react';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null; // 现有任务（如果为 null 则为新建）
  dateStr: string; // 默认日期
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

  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurringFrequency>('daily');
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurWeekDays, setRecurWeekDays] = useState<number[]>([]);
  const [recurStartDate, setRecurStartDate] = useState('');
  const [recurEndDate, setRecurEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setQuadrant(task.quadrant || EisenhowerQuadrant.Q2);
        setStartDate(task.date); 
        setEndDate(task.endDate || '');
        setSelectedProjectId(task.projectId || '');
        setSubtasks(task.subTasks || []); 
        setTags(task.tags || []);
        setEditMode('single');
        
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
        }
        setIsRecurring(!!recurringRule);
      } else if (recurringRule) {
        setTitle(recurringRule.title);
        setDescription(recurringRule.description || '');
        setPriority(recurringRule.priority);
        setQuadrant(recurringRule.quadrant || EisenhowerQuadrant.Q2);
        setRecurFreq(recurringRule.frequency);
        setRecurInterval(recurringRule.interval);
        setRecurWeekDays(recurringRule.weekDays || []);
        setRecurStartDate(recurringRule.startDate);
        setRecurEndDate(recurringRule.endDate || '');
        if (recurringRule.projectId) setSelectedProjectId(recurringRule.projectId);
        setTags(recurringRule.tags || []);
        
        const templateSubtasks = recurringRule.subTaskTitles?.map(t => ({ id: crypto.randomUUID(), title: t, completed: false })) || [];
        setSubtasks(templateSubtasks);

        setEditMode('series');
        setIsRecurring(true);
        setStartDate(recurringRule.startDate);
        setEndDate(''); // Rules don't have end dates for individual instances
        
        if (recurringRule.startTime) {
           setIsAllDay(false);
           setStartTime(recurringRule.startTime);
           setDuration(recurringRule.duration || 60);
        } else {
           setIsAllDay(true);
        }
      } else {
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
        setQuadrant(EisenhowerQuadrant.Q2);
        setStartDate(dateStr); 
        setEndDate('');
        setSelectedProjectId(initialProjectId || '');
        setSubtasks([]); 
        setTags([]);
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

        const d = new Date(dateStr);
        setRecurWeekDays([d.getDay()]);
      }
      setNewSubtaskTitle('');
      setNewTagInput('');
    }
  }, [isOpen, task, dateStr, recurringRule, initialProjectId, initialTime]);

  if (!isOpen) return null;

  const handleSmartFill = async () => {
    if (!title.trim()) return;
    setIsSmartFilling(true);
    
    const refDate = startDate || new Date().toISOString().split('T')[0];
    const parsed = await parseTaskFromNaturalLanguage(title, refDate);

    if (parsed) {
       if (parsed.title) setTitle(parsed.title);
       if (parsed.date) setStartDate(parsed.date);
       if (parsed.endDate) setEndDate(parsed.endDate);
       if (parsed.startTime) {
          setStartTime(parsed.startTime);
          setIsAllDay(false);
       }
       if (parsed.duration) setDuration(parsed.duration);
       if (parsed.priority) setPriority(parsed.priority);
       if (parsed.quadrant) setQuadrant(parsed.quadrant);
       if (parsed.description) {
         setDescription(prev => prev ? `${prev}\n${parsed.description}` : parsed.description!);
       }
    }
    setIsSmartFilling(false);
  };

  const handleAddTag = () => {
    if(!newTagInput.trim()) return;
    if(!tags.includes(newTagInput.trim())) setTags([...tags, newTagInput.trim()]);
    setNewTagInput('');
  };

  const handleRemoveTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSave = () => {
    if (!title.trim()) return;

    const timeData = isAllDay ? { startTime: undefined, duration: undefined } : { startTime, duration };

    if (editMode === 'series' && recurringRule && onUpdateRule) {
      onUpdateRule(recurringRule.id, {
        title, description, priority, quadrant,
        frequency: recurFreq, interval: recurInterval,
        weekDays: recurFreq === 'weekly' ? recurWeekDays : undefined,
        startDate: recurStartDate, endDate: recurEndDate || undefined,
        projectId: selectedProjectId || undefined,
        subTaskTitles: subtasks.map(s => s.title),
        tags: tags,
        ...timeData
      });
    } else if (isRecurring && !task && editMode === 'single') {
      onSave({}, {
        title, description, priority, quadrant,
        frequency: recurFreq, interval: recurInterval,
        weekDays: recurFreq === 'weekly' ? recurWeekDays : undefined,
        startDate: recurStartDate || startDate, endDate: recurEndDate || undefined,
        projectId: selectedProjectId || undefined,
        subTaskTitles: subtasks.map(s => s.title),
        tags: tags,
        ...timeData
      });
    } else {
      onSave({
        id: task?.id, title, description, priority, quadrant,
        date: startDate,
        endDate: endDate && endDate >= startDate ? endDate : undefined,
        projectId: selectedProjectId || undefined,
        subTasks: subtasks,
        tags: tags,
        ...timeData
      });
    }
    onClose();
  };

  const handleGenerateSubtasks = async () => {
    if (!title.trim()) return; 
    setIsGenerating(true);
    const subtaskTitles = await breakDownTask(title);
    if (subtaskTitles.length > 0) {
      const newSubtasks: SubTask[] = subtaskTitles.map(t => ({ id: crypto.randomUUID(), title: t, completed: false }));
      setSubtasks(prev => [...prev, ...newSubtasks]);
    }
    setIsGenerating(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { id: crypto.randomUUID(), title: newSubtaskTitle.trim(), completed: false }]);
    setNewSubtaskTitle('');
  };

  const handleDeleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
  };

  const handleToggleSubtaskLocal = (subtaskId: string) => {
    setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s));
  };

  const quadrantOptions = [
     { id: EisenhowerQuadrant.Q1, label: '重要紧急', icon: <Zap size={14} className="fill-red-500 text-red-500" />, color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' },
     { id: EisenhowerQuadrant.Q2, label: '重要不急', icon: <Star size={14} className="fill-blue-500 text-blue-500" />, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
     { id: EisenhowerQuadrant.Q3, label: '紧急不重', icon: <Bell size={14} className="fill-orange-500 text-orange-500" />, color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
     { id: EisenhowerQuadrant.Q4, label: '不重不急', icon: <Coffee size={14} className="fill-gray-400 text-gray-400" />, color: 'bg-gray-50 dark:bg-zinc-800/50 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-zinc-700' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-[#F2F2F7] dark:bg-black sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[90vh] sm:h-[85vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 border border-white/20 dark:border-zinc-800">
        
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium px-2 py-1 ios-btn-active">
            取消
          </button>
          <div className="font-semibold text-gray-900 dark:text-white">{task ? '编辑事项' : '新建事项'}</div>
          <button onClick={handleSave} className={`text-indigo-600 dark:text-indigo-400 font-semibold text-sm px-2 py-1 ios-btn-active ${!title.trim() ? 'opacity-50' : ''}`} disabled={!title.trim()}>
             完成
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          <div className="space-y-4">
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isSmartFilling ? "AI 分析中..." : "标题 (试着输入: 明早9点开会)"}
                    className="w-full text-lg px-4 py-3 pr-12 border-b border-gray-100 dark:border-zinc-800 outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white"
                    autoFocus
                    disabled={isSmartFilling}
                  />
                  <button onClick={handleSmartFill} disabled={!title.trim() || isSmartFilling} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${title.trim() ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-gray-300 dark:text-zinc-700'}`} title="AI 智能识别时间与日期">
                     <Wand2 size={18} className={isSmartFilling ? 'animate-spin' : ''} />
                  </button>
                </div>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="备注..." className="w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 outline-none resize-none h-20 bg-transparent" />
             </div>

             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-red-500 rounded-md p-1 text-white"><CalendarIcon size={14} /></div>
                      <span className="text-sm font-medium">日期</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <input type="date" value={editMode === 'series' ? recurStartDate : startDate} onChange={(e) => { const v = e.target.value; if (editMode === 'series') setRecurStartDate(v); else setStartDate(v); }} className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none text-right font-medium dark:color-scheme-dark" />
                      <span className="text-gray-300 dark:text-zinc-600">-</span>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none text-right font-medium dark:color-scheme-dark" placeholder="结束" />
                   </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-blue-500 rounded-md p-1 text-white"><Clock size={14} /></div>
                      <span className="text-sm font-medium">全天</span>
                   </div>
                   <button onClick={() => setIsAllDay(!isAllDay)} className={`w-11 h-6 rounded-full transition-colors relative ${isAllDay ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'}`}>
                     <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAllDay ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
                   </button>
                </div>

                {!isAllDay && (
                   <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-zinc-800/50 animate-in slide-in-from-top-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">时间设置</span>
                      <div className="flex gap-2">
                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:text-white dark:color-scheme-dark" />
                        <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:text-white">
                           <option value={15}>15 分钟</option> <option value={30}>30 分钟</option> <option value={60}>1 小时</option> <option value={90}>1.5 小时</option> <option value={120}>2 小时</option>
                        </select>
                      </div>
                   </div>
                )}

                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-indigo-500 rounded-md p-1 text-white"><Briefcase size={14} /></div>
                      <span className="text-sm font-medium">项目</span>
                   </div>
                   <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none text-right font-medium w-40 dir-rtl">
                      <option value="">无</option>
                      {projects.filter(p => p.status !== 'completed').map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
                   </select>
                </div>
                
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-orange-500 rounded-md p-1 text-white"><Tag size={14} /></div>
                      <span className="text-sm font-medium">优先级</span>
                   </div>
                   <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                      {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                        <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${priority === p ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col px-4 py-3 gap-2">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-teal-500 rounded-md p-1 text-white"><Tag size={14} /></div>
                      <span className="text-sm font-medium">标签</span>
                   </div>
                   <div className="flex flex-wrap gap-2 pl-7">
                      {tags.map(tag => (<div key={tag} className="flex items-center bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-zinc-700">{tag}<button onClick={() => handleRemoveTag(tag)} className="ml-1 text-gray-400 hover:text-red-500"><X size={12} /></button></div>))}
                      <div className="flex items-center gap-1">
                         <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTag()} placeholder="输入标签..." className="text-xs bg-transparent border-b border-gray-200 dark:border-zinc-700 outline-none w-20 py-1 text-gray-600 dark:text-gray-400 focus:border-indigo-500 transition-colors" />
                         <button onClick={handleAddTag} disabled={!newTagInput} className="text-indigo-500 disabled:opacity-30"><Plus size={14} /></button>
                      </div>
                   </div>
                </div>

                <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => !recurringRule && setIsRecurring(!isRecurring)}>
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-gray-500 rounded-md p-1 text-white"><Repeat size={14} /></div>
                      <span className="text-sm font-medium">重复</span>
                   </div>
                   <div className="flex items-center gap-1 text-gray-400">
                      <span className="text-sm">{isRecurring ? (editMode === 'series' ? '规则生效中' : '开启') : '关闭'}</span>
                      <ChevronRight size={16} />
                   </div>
                </div>

                {isRecurring && (
                   <div className="bg-gray-50 dark:bg-zinc-800 p-4 border-t border-gray-100 dark:border-zinc-700">
                      {recurringRule && (
                        <div className="flex bg-white dark:bg-zinc-900 w-fit p-1 rounded-lg border border-gray-200 dark:border-zinc-700 mb-3 mx-auto">
                           <button onClick={() => setEditMode('single')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editMode === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>仅此任务</button>
                           <button onClick={() => setEditMode('series')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editMode === 'series' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>后续所有</button>
                        </div>
                      )}
                      <RecurringOptions frequency={recurFreq} interval={recurInterval} weekDays={recurWeekDays} startDate={recurStartDate} endDate={recurEndDate} onChange={(updates) => {
                           if (updates.frequency) setRecurFreq(updates.frequency); if (updates.interval) setRecurInterval(updates.interval); if (updates.weekDays) setRecurWeekDays(updates.weekDays); if (updates.startDate) setRecurStartDate(updates.startDate); if (updates.endDate !== undefined) setRecurEndDate(updates.endDate);
                        }} />
                   </div>
                )}
             </div>

             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 p-3">
                 <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2"> <LayoutGrid size={14} className="text-purple-500" /> <span className="text-sm font-medium">象限归类</span> </div>
                 <div className="grid grid-cols-2 gap-2"> {quadrantOptions.map(q => (<button key={q.id} onClick={() => setQuadrant(q.id)} className={`flex items-center justify-center gap-2 text-xs py-2 rounded-lg border font-medium transition-all ${quadrant === q.id ? q.color + ' ring-1 ring-inset' : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-gray-400 dark:text-gray-500'}`}> {q.icon} {q.label} </button>))} </div>
             </div>

             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-2 font-medium text-sm text-gray-700 dark:text-gray-300"> <AlignLeft size={16} /> 子任务 </div>
                   <button onClick={handleGenerateSubtasks} disabled={isGenerating || !title.trim()} className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"> <Sparkles size={12} /> {isGenerating ? '思考中...' : 'AI 拆解'} </button>
                </div>
                <div className="p-2 space-y-1">
                   {subtasks.map(subtask => (<div key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg group"> <button onClick={() => handleToggleSubtaskLocal(subtask.id)} className={subtask.completed ? 'text-green-500' : 'text-gray-300 dark:text-zinc-600'}> {subtask.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />} </button> <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{subtask.title}</span> <button onClick={(e) => handleDeleteSubtask(subtask.id, e)} className="text-gray-400 opacity-0 group-hover:opacity-100 p-1"> <X size={14} /> </button> </div>))}
                   <div className="flex items-center gap-3 p-2"> <Plus size={18} className="text-gray-300 dark:text-zinc-600" /> <input type="text" value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()} placeholder="添加步骤..." className="flex-1 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white" /> </div>
                </div>
             </div>

             {task && (<button onClick={() => { onDelete(task.id); onClose(); }} className="w-full py-3 text-red-500 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"> 删除事项 </button>)}
          </div>
        </div>
      </div>
    </div>
  );
};