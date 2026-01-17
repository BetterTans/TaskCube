
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
  Coffee
} from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({ tasks, projects, onTaskClick, onToggleTask }) => {
  // --- 列宽调整状态 ---
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    status: 80,
    title: 300,
    project: 140,
    priority: 90,
    quadrant: 130,
    date: 120,
    subtasks: 80
  });

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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

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

  // --- UI 渲染辅助函数 ---
  const getPriorityBadge = (priority: Priority) => {
    const styles = {
      [Priority.HIGH]: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
      [Priority.MEDIUM]: "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900",
      [Priority.LOW]: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs border font-medium ${styles[priority]}`}>
        {priority === Priority.HIGH ? '高' : priority === Priority.MEDIUM ? '中' : '低'}
      </span>
    );
  };

  const getQuadrantBadge = (q?: EisenhowerQuadrant) => {
    const quadrant = q || EisenhowerQuadrant.Q2;
    switch(quadrant) {
      case EisenhowerQuadrant.Q1:
        return <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 w-fit"><Zap size={10} className="fill-red-700 dark:fill-red-400" /><span className="text-[10px] font-bold">重要紧急</span></div>;
      case EisenhowerQuadrant.Q2:
        return <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 w-fit"><Star size={10} className="fill-blue-700 dark:fill-blue-400" /><span className="text-[10px] font-bold">重要不急</span></div>;
      case EisenhowerQuadrant.Q3:
        return <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 w-fit"><Bell size={10} className="fill-orange-700 dark:fill-orange-400" /><span className="text-[10px] font-bold">紧急不重</span></div>;
      case EisenhowerQuadrant.Q4:
        return <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 w-fit"><Coffee size={10} className="fill-gray-600 dark:fill-gray-400" /><span className="text-[10px] font-bold">不重不急</span></div>;
    }
  };

  const getProjectTitle = (projectId?: string) => {
    if (!projectId) return '-';
    const p = projects.find(p => p.id === projectId);
    return p ? p.title : '-';
  };

  const totalWidth = Object.values(colWidths).reduce((acc, w) => acc + w, 0);

  // 列调整手柄组件
  const ResizeHandle = ({ col }: { col: string }) => (
    <div 
      className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-indigo-400/30 active:bg-indigo-500 z-20 transition-colors"
      onMouseDown={(e) => startResize(e, col)}
    />
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      {/* 表格容器，支持水平滚动 */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table 
          className="text-left border-collapse table-fixed"
          style={{ width: totalWidth, minWidth: '100%' }}
        >
          {/* 表头：包含筛选器和列宽调整手柄 */}
          <thead className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-20 border-b border-gray-200 dark:border-zinc-800 shadow-sm">
            <tr>
              {/* 状态列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.status }}>
                <div className="flex flex-col gap-2">
                   <span className="text-center">状态</span>
                   <select 
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-8 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value="active">未完成</option>
                     <option value="completed">已完成</option>
                   </select>
                </div>
                <ResizeHandle col="status" />
              </th>

              {/* 标题列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.title }}>
                <div className="flex flex-col gap-2">
                   <span>任务标题</span>
                   <div className="relative w-full h-8">
                     <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                     <input 
                       type="text" 
                       placeholder="搜索..." 
                       value={filterTitle}
                       onChange={(e) => setFilterTitle(e.target.value)}
                       className="w-full h-full text-xs pl-6 pr-2 border border-gray-200 dark:border-zinc-700 rounded outline-none font-normal bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300"
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

              {/* 项目列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.project }}>
                <div className="flex flex-col gap-2">
                   <span>项目</span>
                   <select 
                     value={filterProject}
                     onChange={(e) => setFilterProject(e.target.value)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-8 text-gray-700 dark:text-gray-300"
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

              {/* 优先级列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.priority }}>
                <div className="flex flex-col gap-2">
                   <span>优先级</span>
                   <select 
                     value={filterPriority}
                     onChange={(e) => setFilterPriority(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-8 text-gray-700 dark:text-gray-300"
                   >
                     <option value="all">全部</option>
                     <option value={Priority.HIGH}>高</option>
                     <option value={Priority.MEDIUM}>中</option>
                     <option value={Priority.LOW}>低</option>
                   </select>
                </div>
                <ResizeHandle col="priority" />
              </th>

              {/* 四象限列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.quadrant }}>
                <div className="flex flex-col gap-2">
                   <span>四象限</span>
                   <select 
                     value={filterQuadrant}
                     onChange={(e) => setFilterQuadrant(e.target.value as any)}
                     className="w-full text-xs px-1 border border-gray-200 dark:border-zinc-700 rounded outline-none bg-white dark:bg-zinc-800 font-normal h-8 text-gray-700 dark:text-gray-300"
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

              {/* 日期列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top relative" style={{ width: colWidths.date }}>
                <div className="flex flex-col gap-2">
                   <span>日期</span>
                   <div className="relative h-8 w-full">
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

              {/* 子任务统计列 */}
              <th className="py-3 px-2 font-semibold text-sm text-gray-600 dark:text-gray-400 align-top text-center relative" style={{ width: colWidths.subtasks }}>
                 <div className="flex flex-col gap-2 h-full">
                    <span>子任务</span>
                    <div className="h-8"></div>
                 </div>
                 <ResizeHandle col="subtasks" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {sortedTasks.length === 0 ? (
               <tr>
                 <td colSpan={7} className="py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Filter size={32} className="mb-2 opacity-20" />
                      <p>没有找到匹配的任务</p>
                      <button 
                        onClick={() => {
                          setFilterStatus('all');
                          setFilterTitle('');
                          setFilterPriority('all');
                          setFilterQuadrant('all');
                          setFilterProject('all');
                          setFilterDate('');
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
                <tr 
                  key={task.id} 
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => onToggleTask(task.id)}
                      className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
                    >
                      {task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <div className={`font-medium text-sm truncate ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}`}>
                      {task.title}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {task.projectId ? <Briefcase size={12} className="text-gray-400 dark:text-gray-500 shrink-0" /> : null}
                      <span className="truncate">{getProjectTitle(task.projectId)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    {getPriorityBadge(task.priority)}
                  </td>
                  <td className="py-3 px-2">
                    {getQuadrantBadge(task.quadrant)}
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {task.date}
                    </div>
                  </td>
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
