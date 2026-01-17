
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
  const [isGenerating, setIsGenerating] = useState(false); // AI 拆解中
  const [isSmartFilling, setIsSmartFilling] = useState(false); // AI 智能填空中
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [singleDate, setSingleDate] = useState('');
  // 时间状态
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);

  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // 编辑模式：single (修改当前这一个) 或 series (修改整个周期系列)
  const [editMode, setEditMode] = useState<'single' | 'series'>('single');

  // 周期性设置状态
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurFreq, setRecurFreq] = useState<RecurringFrequency>('daily');
  const [recurInterval, setRecurInterval] = useState(1);
  const [recurWeekDays, setRecurWeekDays] = useState<number[]>([]);
  const [recurStartDate, setRecurStartDate] = useState('');
  const [recurEndDate, setRecurEndDate] = useState('');

  // 初始化表单数据
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // 编辑现有任务
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setQuadrant(task.quadrant || EisenhowerQuadrant.Q2);
        setSingleDate(task.date); 
        setSelectedProjectId(task.projectId || '');
        setSubtasks(task.subTasks || []); 
        setEditMode('single');
        
        // 时间逻辑
        if (task.startTime) {
           setIsAllDay(false);
           setStartTime(task.startTime);
           setDuration(task.duration || 60);
        } else {
           setIsAllDay(true);
           setStartTime('09:00'); // 默认值
           setDuration(60);
        }
        
        // 如果关联了周期规则
        if (recurringRule) {
           setRecurFreq(recurringRule.frequency);
           setRecurInterval(recurringRule.interval);
           setRecurWeekDays(recurringRule.weekDays || []);
           setRecurStartDate(recurringRule.startDate);
           setRecurEndDate(recurringRule.endDate || '');
           if (recurringRule.quadrant) setQuadrant(recurringRule.quadrant);
           if (recurringRule.projectId) setSelectedProjectId(recurringRule.projectId);
        }
        setIsRecurring(!!recurringRule);
      } else if (recurringRule) {
        // 编辑纯规则（从管理器进入）
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
        
        const templateSubtasks = recurringRule.subTaskTitles?.map(t => ({
           id: crypto.randomUUID(),
           title: t,
           completed: false
        })) || [];
        setSubtasks(templateSubtasks);

        setEditMode('series');
        setIsRecurring(true);
        setSingleDate(recurringRule.startDate);
        
        if (recurringRule.startTime) {
           setIsAllDay(false);
           setStartTime(recurringRule.startTime);
           setDuration(recurringRule.duration || 60);
        } else {
           setIsAllDay(true);
        }
      } else {
        // 新建任务
        setTitle('');
        setDescription('');
        setPriority(Priority.MEDIUM);
        setQuadrant(EisenhowerQuadrant.Q2);
        setSingleDate(dateStr); 
        setSelectedProjectId(initialProjectId || '');
        setSubtasks([]); 
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
    }
  }, [isOpen, task, dateStr, recurringRule, initialProjectId, initialTime]);

  if (!isOpen) return null;

  // AI 智能填充：根据标题解析时间、日期等
  const handleSmartFill = async () => {
    if (!title.trim()) return;
    setIsSmartFilling(true);
    
    // 使用当前选中日期作为参考基准，若无则使用今天
    const refDate = singleDate || new Date().toISOString().split('T')[0];
    const parsed = await parseTaskFromNaturalLanguage(title, refDate);

    if (parsed) {
       if (parsed.title) setTitle(parsed.title);
       if (parsed.date) setSingleDate(parsed.date);
       if (parsed.startTime) {
          setStartTime(parsed.startTime);
          setIsAllDay(false);
       }
       if (parsed.duration) setDuration(parsed.duration);
       if (parsed.priority) setPriority(parsed.priority);
       if (parsed.quadrant) setQuadrant(parsed.quadrant);
       if (parsed.description) {
         // 追加描述
         setDescription(prev => prev ? `${prev}\n${parsed.description}` : parsed.description!);
       }
    }
    setIsSmartFilling(false);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const timeData = isAllDay ? { startTime: undefined, duration: undefined } : { startTime, duration };

    // 场景 1: 更新整个周期规则
    if (editMode === 'series' && recurringRule && onUpdateRule) {
      onUpdateRule(recurringRule.id, {
        title,
        description,
        priority,
        quadrant,
        frequency: recurFreq,
        interval: recurInterval,
        weekDays: recurFreq === 'weekly' ? recurWeekDays : undefined,
        startDate: recurStartDate,
        endDate: recurEndDate || undefined,
        projectId: selectedProjectId || undefined,
        subTaskTitles: subtasks.map(s => s.title),
        ...timeData
      });
      onClose();
      return;
    }

    // 场景 2: 新建任务且开启了重复
    if (isRecurring && !task && editMode === 'single') {
      const newRule: Partial<RecurringRule> = {
        title,
        description,
        priority,
        quadrant,
        frequency: recurFreq,
        interval: recurInterval,
        weekDays: recurFreq === 'weekly' ? recurWeekDays : undefined,
        startDate: recurStartDate || singleDate, 
        endDate: recurEndDate || undefined,
        projectId: selectedProjectId || undefined,
        subTaskTitles: subtasks.map(s => s.title),
        ...timeData
      };
      onSave({}, newRule);
    } else {
      // 场景 3: 保存单次任务（新建或更新）
      onSave({
        id: task?.id, 
        title,
        description,
        priority,
        quadrant,
        date: singleDate,
        projectId: selectedProjectId || undefined,
        subTasks: subtasks,
        ...timeData
      });
    }
    onClose();
  };

  // AI 拆解任务
  const handleGenerateSubtasks = async () => {
    if (!title.trim()) return; 
    setIsGenerating(true);
    const subtaskTitles = await breakDownTask(title);
    if (subtaskTitles.length > 0) {
      const newSubtasks: SubTask[] = subtaskTitles.map(t => ({
        id: crypto.randomUUID(),
        title: t,
        completed: false
      }));
      setSubtasks(prev => [...prev, ...newSubtasks]);
    }
    setIsGenerating(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: SubTask = {
      id: crypto.randomUUID(),
      title: newSubtaskTitle.trim(),
      completed: false
    };
    setSubtasks(prev => [...prev, newSubtask]);
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
        
        {/* iOS 风格头部 */}
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm font-medium px-2 py-1 ios-btn-active">
            取消
          </button>
          <div className="font-semibold text-gray-900 dark:text-white">
             {task ? '编辑事项' : '新建事项'}
          </div>
          <button 
             onClick={handleSave} 
             className={`text-indigo-600 dark:text-indigo-400 font-semibold text-sm px-2 py-1 ios-btn-active ${!title.trim() ? 'opacity-50' : ''}`}
             disabled={!title.trim()}
          >
             完成
          </button>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
          
          <div className="space-y-4">
             {/* 标题和描述 */}
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
                  {/* AI 智能填充按钮 */}
                  <button 
                    onClick={handleSmartFill}
                    disabled={!title.trim() || isSmartFilling}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${title.trim() ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-gray-300 dark:text-zinc-700'}`}
                    title="AI 智能识别时间与日期"
                  >
                     <Wand2 size={18} className={isSmartFilling ? 'animate-spin' : ''} />
                  </button>
                </div>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="备注..."
                  className="w-full px-4 py-3 text-sm text-gray-600 dark:text-gray-300 outline-none resize-none h-20 bg-transparent"
                />
             </div>

             {/* 时间和项目设置组 */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                
                {/* 日期选择 */}
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-red-500 rounded-md p-1 text-white"><CalendarIcon size={14} /></div>
                      <span className="text-sm font-medium">日期</span>
                   </div>
                   <input 
                      type="date"
                      value={editMode === 'series' ? recurStartDate : singleDate}
                      onChange={(e) => {
                         const v = e.target.value;
                         if (editMode === 'series') setRecurStartDate(v);
                         else setSingleDate(v);
                      }}
                      className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none text-right font-medium dark:color-scheme-dark"
                   />
                </div>

                {/* 全天开关 */}
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-blue-500 rounded-md p-1 text-white"><Clock size={14} /></div>
                      <span className="text-sm font-medium">全天</span>
                   </div>
                   <button 
                     onClick={() => setIsAllDay(!isAllDay)}
                     className={`w-11 h-6 rounded-full transition-colors relative ${isAllDay ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'}`}
                   >
                     <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isAllDay ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} />
                   </button>
                </div>

                {/* 时间选择器 (仅非全天显示) */}
                {!isAllDay && (
                   <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-zinc-800/50 animate-in slide-in-from-top-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">时间设置</span>
                      <div className="flex gap-2">
                        <input 
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:text-white dark:color-scheme-dark"
                        />
                        <select 
                          value={duration}
                          onChange={(e) => setDuration(Number(e.target.value))}
                          className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:text-white"
                        >
                           <option value={15}>15 分钟</option>
                           <option value={30}>30 分钟</option>
                           <option value={60}>1 小时</option>
                           <option value={90}>1.5 小时</option>
                           <option value={120}>2 小时</option>
                        </select>
                      </div>
                   </div>
                )}

                {/* 项目选择 */}
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-indigo-500 rounded-md p-1 text-white"><Briefcase size={14} /></div>
                      <span className="text-sm font-medium">项目</span>
                   </div>
                   <select 
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="bg-transparent text-gray-500 dark:text-gray-400 text-sm outline-none text-right font-medium w-40 dir-rtl"
                   >
                      <option value="">无</option>
                      {projects.filter(p => p.status !== 'completed').map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                   </select>
                </div>
                
                {/* 优先级 */}
                <div className="flex items-center justify-between px-4 py-3">
                   <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <div className="bg-orange-500 rounded-md p-1 text-white"><Tag size={14} /></div>
                      <span className="text-sm font-medium">优先级</span>
                   </div>
                   <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg">
                      {[Priority.LOW, Priority.MEDIUM, Priority.HIGH].map(p => (
                        <button
                          key={p}
                          onClick={() => setPriority(p)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                            priority === p ? 'bg-white dark:bg-zinc-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
                        </button>
                      ))}
                   </div>
                </div>

                {/* 重复选项开关 */}
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

                {/* 重复详细设置面板 */}
                {isRecurring && (
                   <div className="bg-gray-50 dark:bg-zinc-800 p-4 border-t border-gray-100 dark:border-zinc-700">
                      {recurringRule && (
                        <div className="flex bg-white dark:bg-zinc-900 w-fit p-1 rounded-lg border border-gray-200 dark:border-zinc-700 mb-3 mx-auto">
                           <button onClick={() => setEditMode('single')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editMode === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>仅此任务</button>
                           <button onClick={() => setEditMode('series')} className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${editMode === 'series' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}>后续所有</button>
                        </div>
                      )}
                      <RecurringOptions 
                        frequency={recurFreq}
                        interval={recurInterval}
                        weekDays={recurWeekDays}
                        startDate={recurStartDate}
                        endDate={recurEndDate}
                        onChange={(updates) => {
                           if (updates.frequency) setRecurFreq(updates.frequency);
                           if (updates.interval) setRecurInterval(updates.interval);
                           if (updates.weekDays) setRecurWeekDays(updates.weekDays);
                           if (updates.startDate) setRecurStartDate(updates.startDate);
                           if (updates.endDate !== undefined) setRecurEndDate(updates.endDate);
                        }}
                      />
                   </div>
                )}
             </div>

             {/* 四象限归类 */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 p-3">
                 <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mb-2">
                    <LayoutGrid size={14} className="text-purple-500" />
                    <span className="text-sm font-medium">象限归类</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    {quadrantOptions.map(q => (
                       <button
                         key={q.id}
                         onClick={() => setQuadrant(q.id)}
                         className={`flex items-center justify-center gap-2 text-xs py-2 rounded-lg border font-medium transition-all ${quadrant === q.id ? q.color + ' ring-1 ring-inset' : 'bg-gray-50 dark:bg-zinc-800 border-transparent text-gray-400 dark:text-gray-500'}`}
                       >
                         {q.icon}
                         {q.label}
                       </button>
                    ))}
                 </div>
             </div>

             {/* 子任务列表 */}
             <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                   <div className="flex items-center gap-2 font-medium text-sm text-gray-700 dark:text-gray-300">
                      <AlignLeft size={16} /> 子任务
                   </div>
                   <button 
                      onClick={handleGenerateSubtasks}
                      disabled={isGenerating || !title.trim()}
                      className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                   >
                      <Sparkles size={12} /> {isGenerating ? '思考中...' : 'AI 拆解'}
                   </button>
                </div>
                <div className="p-2 space-y-1">
                   {subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg group">
                         <button onClick={() => handleToggleSubtaskLocal(subtask.id)} className={subtask.completed ? 'text-green-500' : 'text-gray-300 dark:text-zinc-600'}>
                            {subtask.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                         </button>
                         <span className={`flex-1 text-sm ${subtask.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{subtask.title}</span>
                         <button onClick={(e) => handleDeleteSubtask(subtask.id, e)} className="text-gray-400 opacity-0 group-hover:opacity-100 p-1">
                            <X size={14} />
                         </button>
                      </div>
                   ))}
                   <div className="flex items-center gap-3 p-2">
                      <Plus size={18} className="text-gray-300 dark:text-zinc-600" />
                      <input 
                         type="text" 
                         value={newSubtaskTitle}
                         onChange={(e) => setNewSubtaskTitle(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                         placeholder="添加步骤..."
                         className="flex-1 text-sm outline-none placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white"
                      />
                   </div>
                </div>
             </div>

             {/* 删除按钮 */}
             {task && (
               <button 
                  onClick={() => { onDelete(task.id); onClose(); }}
                  className="w-full py-3 text-red-500 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
               >
                  删除事项
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
