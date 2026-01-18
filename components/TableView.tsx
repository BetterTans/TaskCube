import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Priority, EisenhowerQuadrant, Project } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Calendar, 
  AlignLeft,
  Filter,
  Search,
  X,
  Briefcase,
  Zap,
  Star,
  Bell,
  Coffee,
  Tag as TagIcon,
  Plus
} from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

export const TableView: React.FC<TableViewProps> = ({ tasks, projects, onTaskClick, onToggleTask, onUpdateTask }) => {
  // --- 列宽调整状态 ---
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    status: 80,
    title: 300,
    project: 140,
    priority: 90,
    quadrant: 130,
    date: 120,
    tags: 160,
    subtasks: 80
  });

  // --- Inline Editing State ---
  // activePopup tracks which cell is currently open for editing: { taskId, field }
  const [activePopup, setActivePopup] = useState<{ taskId: string, field: string } | null>(null);

  // --- 列宽拖拽调整逻辑 ---
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { col, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [col]: Math.max(50, startWidth + diff) // 最小宽度限制为 50px
      }));
    };

    const handleMouseUp = () => {
      if (resizingRef.current) {
        resizingRef.current = null;
        document.body.style.cursor = '';
      }
    };

    // Close popups when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (activePopup) {
         const target = e.target as HTMLElement;
         if (!target.closest('.inline-editor-popup') && !target.closest('.inline-editor-trigger')) {
            setActivePopup(null);
         }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePopup]);

  const startResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = {
      col,
      startX: e.clientX,
      startWidth: colWidths[col]
    };
    document.body.style.cursor = 'col-resize';
  };

  // --- 筛选条件状态 ---
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'active'>('all');
  const [filterTitle, setFilterTitle] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterQuadrant, setFilterQuadrant] = useState<EisenhowerQuadrant | 'all'>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterDate, setFilterDate] = useState('');

  // --- 数据过滤逻辑 (useMemo) ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterStatus === 'completed' && !task.completed) return false;
      if (filterStatus === 'active' && task.completed) return false;
      if (filterTitle && !task.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterQuadrant !== 'all') {
         const q = task.quadrant || EisenhowerQuadrant.Q2; 
         if (q !== filterQuadrant) return false;
      }
      if (filterProject !== 'all') {
        if (filterProject === 'none') {
          if (task.projectId) return false;
        } else {
          if (task.projectId !== filterProject) return false;
        }
      }
      if (filterDate && task.date !== filterDate) return false;
      return true;
    });
  }, [tasks, filterStatus, filterTitle, filterPriority, filterQuadrant, filterProject, filterDate]);

  // --- 排序逻辑 ---
  // 默认排序：日期 > 完成状态 > 优先级
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? 1 : -1;
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const pMap = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
      return pMap[a.priority] - pMap[b.priority];
    });
  }, [filteredTasks]);

  // --- UI Render Helpers ---
  
  const getProjectTitle = (projectId?: string) => {
    if (!projectId) return null;
    const p = projects.find(p => p.id === projectId);
    return p ? p.title : null;
  };

  // FIX: Explicitly type the parameters of the reduce function to resolve a TypeScript inference issue.
  const totalWidth = Object.values(colWidths).reduce((acc: number, w: number) => acc + w, 0);

  // Column Resize Handle
  const ResizeHandle = ({ col }: { col: string }) => (
    <div 
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-400/30 active:bg-indigo-500 z-20 transition-colors"
      onMouseDown={(e) => startResize(e, col)}
    />
  );

  // --- Popover Components ---

  // 1. Tag Editor
  const TagEditor = ({ task }: { task: Task }) => {
    const [input, setInput] = useState('');
    const tags = task.tags || [];

    const handleAdd = () => {
       if (!input.trim()) return;
       if (!tags.includes(input.trim())) {
          onUpdateTask({ id: task.id, tags: [...tags, input.trim()] });
       }
       setInput('');
    };

    const handleRemove = (tag: string) => {
       onUpdateTask({ id: task.id, tags: tags.filter(t => t !== tag) });
    };

    return (
       <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-3 z-50 w-64 inline-editor-popup animate-in fade-in zoom-in-95 duration-100">
          <div className="flex flex-wrap gap-2 mb-3">
             {tags.map(tag => (
                <span key={tag} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                   {tag}
                   <button onClick={() => handleRemove(tag)} className="hover:text-indigo-900 dark:hover:text-white"><X size={12} /></button>
                </span>
             ))}
             {tags.length === 0 && <span className="text-gray-400 text-xs italic">暂无标签</span>}
          </div>
          <div className="flex gap-2">
             <input 
               autoFocus
               type="text" 
               value={input}
               onChange={e => setInput(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleAdd()}
               placeholder="新标签..."
               className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 text-xs outline-none focus:border-indigo-500"
             />
             <button onClick={handleAdd} className="bg-indigo-600 text-white rounded p-1 hover:bg-indigo-700"><Plus size={14} /></button>
          </div>
       </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table 
          className="text-left border-collapse table-fixed"
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {/* Table Head */}
          <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-20 border-b border-gray-200 dark:border-zinc-800 shadow-sm">
            <tr>
              {/* Status */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.status }}>
                 <div className="flex flex-col gap-2">
                   <span>状态</span>
                   <select 
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-7 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value="active">进行中</option>
                     <option value="completed">已完成</option>
                   </select>
                </div>
                <ResizeHandle col="status" />
              </th>

              {/* Title */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.title }}>
                <div className="flex flex-col gap-2">
                   <span>任务标题</span>
                   <div className="relative w-full h-7">
                     <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="搜索..." 
                       value={filterTitle}
                       onChange={(e) => setFilterTitle(e.target.value)}
                       className="w-full h-full text-xs pl-6 pr-2 border border-gray-200 dark:border-zinc-700 rounded outline-none font-normal bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 focus:border-indigo-500 transition-colors"
                     />
                     {filterTitle && (
                       <button onClick={() => setFilterTitle('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                         <X size={10} />
                       </button>
                     )}
                   </div>
                </div>
                <ResizeHandle col="title" />
              </th>

              {/* Project */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.project }}>
                <div className="flex flex-col gap-2">
                   <span>项目</span>
                   <select 
                     value={filterProject}
                     onChange={(e) => setFilterProject(e.target.value)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-7 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value="none">无项目</option>
                     {projects.map(p => (
                       <option key={p.id} value={p.id}>{p.title}</option>
                     ))}
                   </select>
                </div>
                <ResizeHandle col="project" />
              </th>

              {/* Priority */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.priority }}>
                <div className="flex flex-col gap-2">
                   <span>优先级</span>
                   <select 
                     value={filterPriority}
                     onChange={(e) => setFilterPriority(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-7 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value={Priority.HIGH}>高</option>
                     <option value={Priority.MEDIUM}>中</option>
                     <option value={Priority.LOW}>低</option>
                   </select>
                </div>
                <ResizeHandle col="priority" />
              </th>

              {/* Quadrant */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.quadrant }}>
                <div className="flex flex-col gap-2">
                   <span>四象限</span>
                   <select 
                     value={filterQuadrant}
                     onChange={(e) => setFilterQuadrant(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-7 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value={EisenhowerQuadrant.Q1}>⚡️ 重要紧急</option>
                     <option value={EisenhowerQuadrant.Q2}>🌟 重要不急</option>
                     <option value={EisenhowerQuadrant.Q3}>🔔 紧急不重</option>
                     <option value={EisenhowerQuadrant.Q4}>☕️ 不重不急</option>
                   </select>
                </div>
                <ResizeHandle col="quadrant" />
              </th>

              {/* Date */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.date }}>
                <div className="flex flex-col gap-2">
                   <span>日期</span>
                   <div className="relative h-7 w-full">
                      <input 
                        type="date" 
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="w-full h-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal text-gray-500 dark:text-gray-400"
                      />
                      {filterDate && (
                       <button onClick={() => setFilterDate('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-white dark:bg-zinc-800">
                         <X size={12} />
                       </button>
                     )}
                   </div>
                </div>
                <ResizeHandle col="date" />
              </th>

              {/* Tags Column (New) */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.tags }}>
                 <div className="flex flex-col gap-2 h-full">
                    <span>标签</span>
                    <div className="h-7 text-xs flex items-center text-gray-400 italic font-normal">
                       支持多标签
                    </div>
                 </div>
                 <ResizeHandle col="tags" />
              </th>

              {/* Subtasks */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top text-center relative" style={{ width: colWidths.subtasks }}>
                 <div className="flex flex-col gap-2 h-full">
                    <span>子任务</span>
                    <div className="h-7"></div>
                 </div>
                 <ResizeHandle col="subtasks" />
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {sortedTasks.length === 0 ? (
               <tr>
                 <td colSpan={8} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Filter size={32} className="mb-2 opacity-20" />
                      <p>没有找到匹配的任务</p>
                      <button 
                        onClick={() => {
                          setFilterStatus('all'); setFilterTitle(''); setFilterPriority('all');
                          setFilterQuadrant('all'); setFilterProject('all'); setFilterDate('');
                        }}
                        className="mt-2 text-indigo-500 text-xs hover:underline"
                      >
                        清除所有筛选
                      </button>
                    </div>
                 </td>
               </tr>
            ) : (
              sortedTasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group">
                  
                  {/* 1. Status Checkbox */}
                  <td className="py-3 px-2 text-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                      className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
                    >
                      {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                  </td>

                  {/* 2. Title (Click to Open Detail Modal) */}
                  <td 
                    className="py-3 px-2 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <div className={`font-medium text-sm truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}`}>
                      {task.title}
                    </div>
                  </td>

                  {/* 3. Project (Inline Edit) */}
                  <td className="py-3 px-2 relative inline-editor-trigger">
                    <div 
                       onClick={() => setActivePopup({ taskId: task.id, field: 'project' })}
                       className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 truncate cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 p-1 rounded transition-colors"
                    >
                      {task.projectId ? <Briefcase size={12} className="text-gray-400 dark:text-gray-500 shrink-0" /> : null}
                      <span className="truncate">{getProjectTitle(task.projectId) || <span className="text-gray-300 italic">无项目</span>}</span>
                    </div>
                    {/* Project Popup */}
                    {activePopup?.taskId === task.id && activePopup?.field === 'project' && (
                       <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 z-50 w-48 inline-editor-popup animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                          <button 
                            onClick={() => { onUpdateTask({ id: task.id, projectId: undefined }); setActivePopup(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-700"
                          >
                             无项目
                          </button>
                          {projects.map(p => (
                             <button
                               key={p.id}
                               onClick={() => { onUpdateTask({ id: task.id, projectId: p.id }); setActivePopup(null); }}
                               className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 truncate ${task.projectId === p.id ? 'text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-800 dark:text-gray-200'}`}
                             >
                                {p.title}
                             </button>
                          ))}
                       </div>
                    )}
                  </td>

                  {/* 4. Priority (Inline Edit) */}
                  <td className="py-3 px-2 relative inline-editor-trigger">
                    <div 
                      onClick={() => setActivePopup({ taskId: task.id, field: 'priority' })}
                      className="cursor-pointer hover:opacity-80 transition-opacity w-fit"
                    >
                        {(() => {
                           const styles = {
                              [Priority.HIGH]: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
                              [Priority.MEDIUM]: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
                              [Priority.LOW]: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
                           };
                           const labels = { [Priority.HIGH]: '高', [Priority.MEDIUM]: '中', [Priority.LOW]: '低' };
                           return (
                              <span className={`px-2 py-0.5 rounded text-xs border font-medium ${styles[task.priority]}`}>
                                 {labels[task.priority]}
                              </span>
                           );
                        })()}
                    </div>
                    {/* Priority Popup */}
                    {activePopup?.taskId === task.id && activePopup?.field === 'priority' && (
                       <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 z-50 w-24 inline-editor-popup animate-in fade-in zoom-in-95 duration-100">
                          {[Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(p => (
                             <button
                               key={p}
                               onClick={() => { onUpdateTask({ id: task.id, priority: p }); setActivePopup(null); }}
                               className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 
                                  ${p === Priority.HIGH ? 'text-red-600' : p === Priority.MEDIUM ? 'text-orange-600' : 'text-blue-600'}
                                  ${task.priority === p ? 'bg-gray-50 dark:bg-zinc-700' : ''}
                               `}
                             >
                                {p === Priority.HIGH ? '高' : p === Priority.MEDIUM ? '中' : '低'}
                             </button>
                          ))}
                       </div>
                    )}
                  </td>

                  {/* 5. Quadrant (Inline Edit) */}
                  <td className="py-3 px-2 relative inline-editor-trigger">
                    <div 
                       onClick={() => setActivePopup({ taskId: task.id, field: 'quadrant' })}
                       className="cursor-pointer hover:opacity-80 transition-opacity w-fit"
                    >
                        {(() => {
                           const q = task.quadrant || EisenhowerQuadrant.Q2;
                           const configs = {
                              [EisenhowerQuadrant.Q1]: { icon: Zap, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-900', label: '重要紧急' },
                              [EisenhowerQuadrant.Q2]: { icon: Star, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-900', label: '重要不急' },
                              [EisenhowerQuadrant.Q3]: { icon: Bell, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-900', label: '紧急不重' },
                              [EisenhowerQuadrant.Q4]: { icon: Coffee, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-zinc-800', border: 'border-gray-200 dark:border-zinc-700', label: '不重不急' },
                           };
                           const cfg = configs[q];
                           return (
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded border ${cfg.bg} ${cfg.border} ${cfg.color} w-fit`}>
                                 <cfg.icon size={10} className="fill-current" />
                                 <span className="text-[10px] font-bold">{cfg.label}</span>
                              </div>
                           );
                        })()}
                    </div>
                    {/* Quadrant Popup */}
                    {activePopup?.taskId === task.id && activePopup?.field === 'quadrant' && (
                       <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-2 z-50 w-64 inline-editor-popup animate-in fade-in zoom-in-95 duration-100 grid grid-cols-2 gap-2">
                           {[EisenhowerQuadrant.Q1, EisenhowerQuadrant.Q2, EisenhowerQuadrant.Q3, EisenhowerQuadrant.Q4].map(q => {
                               // Reuse logic for simplicity
                               const labels = { [EisenhowerQuadrant.Q1]: '重要紧急', [EisenhowerQuadrant.Q2]: '重要不急', [EisenhowerQuadrant.Q3]: '紧急不重', [EisenhowerQuadrant.Q4]: '不重不急' };
                               return (
                                  <button
                                     key={q}
                                     onClick={() => { onUpdateTask({ id: task.id, quadrant: q }); setActivePopup(null); }}
                                     className={`flex flex-col items-center justify-center p-2 rounded border text-xs font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 ${task.quadrant === q ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700' : 'border-gray-100 dark:border-zinc-700 text-gray-600 dark:text-gray-300'}`}
                                  >
                                     {labels[q]}
                                  </button>
                               )
                           })}
                       </div>
                    )}
                  </td>

                  {/* 6. Date (Inline Edit) */}
                  <td className="py-3 px-2 relative inline-editor-trigger">
                    <div 
                       onClick={() => setActivePopup({ taskId: task.id, field: 'date' })}
                       className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700 p-1 rounded transition-colors w-fit"
                    >
                      <Calendar size={14} />
                      {task.date}
                    </div>
                    {/* Date Popup */}
                    {activePopup?.taskId === task.id && activePopup?.field === 'date' && (
                       <div className="absolute left-0 top-full mt-1 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-2 z-50 inline-editor-popup animate-in fade-in zoom-in-95 duration-100">
                          <input 
                             type="date" 
                             defaultValue={task.date}
                             onChange={(e) => { 
                                if(e.target.value) {
                                   onUpdateTask({ id: task.id, date: e.target.value });
                                   setActivePopup(null);
                                }
                             }}
                             className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 text-sm outline-none focus:border-indigo-500 dark:text-white dark:color-scheme-dark"
                             autoFocus
                          />
                       </div>
                    )}
                  </td>

                  {/* 7. Tags (Inline Edit - New Column) */}
                  <td className="py-3 px-2 relative inline-editor-trigger">
                     <div 
                        onClick={() => setActivePopup({ taskId: task.id, field: 'tags' })}
                        className="flex flex-wrap gap-1 cursor-pointer min-h-[24px] items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-1 rounded -ml-1 transition-colors"
                     >
                        {(task.tags && task.tags.length > 0) ? (
                           task.tags.map(tag => (
                              <span key={tag} className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 whitespace-nowrap">
                                 {tag}
                              </span>
                           ))
                        ) : (
                           <span className="text-gray-300 dark:text-zinc-600 hover:text-indigo-400 transition-colors">
                              <Plus size={14} />
                           </span>
                        )}
                     </div>
                     {/* Tags Popup */}
                     {activePopup?.taskId === task.id && activePopup?.field === 'tags' && (
                        <TagEditor task={task} />
                     )}
                  </td>

                  {/* 8. Subtasks */}
                  <td className="py-3 px-2 text-center">
                    {task.subTasks.length > 0 ? (
                      <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <AlignLeft size={14} />
                        <span className="text-xs">
                          {task.subTasks.filter(s => s.completed).length}/{task.subTasks.length}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300 dark:text-gray-600">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 p-2 text-xs text-gray-500 dark:text-gray-400 flex justify-end px-4">
        共 {sortedTasks.length} 个任务
      </div>
    </div>
  );
};