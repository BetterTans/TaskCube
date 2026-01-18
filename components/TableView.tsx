

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Task, Priority, EisenhowerQuadrant, Project } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  CheckCircle2, 
  Circle, 
  Filter as FilterIcon,
  Search,
  AlignLeft,
  Lock,
  X,
  ChevronDown,
  Zap,
  Star,
  Bell,
  Coffee
} from 'lucide-react';

interface TableViewProps {
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

interface TableFilters {
    search: string;
    status: 'all' | 'completed' | 'pending';
    priority: 'all' | Priority;
    project: 'all' | string;
    quadrant: 'all' | EisenhowerQuadrant;
    date: string; // YYYY-MM-DD, empty for all
    tags: string; // a single tag, empty for all
}

const quadrantInfo: Record<EisenhowerQuadrant, { title: string; icon: React.ReactNode }> = {
  [EisenhowerQuadrant.Q1]: { title: '重要 & 緊急', icon: <Zap size={14} className="text-red-500"/> },
  [EisenhowerQuadrant.Q2]: { title: '重要 & 不緊急', icon: <Star size={14} className="text-green-600"/> },
  [EisenhowerQuadrant.Q3]: { title: '緊急 & 不重要', icon: <Bell size={14} className="text-orange-500"/> },
  [EisenhowerQuadrant.Q4]: { title: '不重要 & 不緊急', icon: <Coffee size={14} className="text-blue-500"/> },
};

const getInitialFilters = (): TableFilters => {
    const saved = localStorage.getItem('taskcube-table-filters');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return {
                search: parsed.search || '',
                status: parsed.status || 'all',
                priority: parsed.priority || 'all',
                project: parsed.project || 'all',
                quadrant: parsed.quadrant || 'all',
                date: parsed.date || '',
                tags: parsed.tags || '',
            };
        } catch (e) { /* ignore parse error */ }
    }
    return {
        search: '',
        status: 'all',
        priority: 'all',
        project: 'all',
        quadrant: 'all',
        date: '',
        tags: '',
    };
};

const FilterPopover: React.FC<{
    column: keyof TableFilters,
    anchorRect: DOMRect | null,
    onClose: () => void,
    filters: TableFilters,
    onFilterChange: (key: keyof TableFilters, value: any) => void,
    projects: Project[],
    allTags: string[],
}> = ({ column, anchorRect, onClose, filters, onFilterChange, projects, allTags }) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    // 同步计算位置，确保首次渲染时位置正确，避免动画从 0,0 飞入
    const position = useMemo(() => {
        if (!anchorRect) return { top: 0, left: 0 };
        const rect = anchorRect;
        const popoverWidth = 224; // w-56
        const viewWidth = window.innerWidth;
        
        let left = rect.left;
        // 确保不超出右边界
        if (left + popoverWidth > viewWidth - 10) {
            left = rect.right - popoverWidth;
        }
        // 确保不超出左边界
        if (left < 10) { left = 10; }

        return { top: rect.bottom + 4, left };
    }, [anchorRect]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const renderContent = () => {
        const baseBtnClass = 'w-full text-left text-sm px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-700';
        const activeBtnClass = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
        
        switch (column) {
            case 'search': return (<div className="p-2"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/><input type="text" autoFocus placeholder="搜索标题..." value={filters.search} onChange={e => onFilterChange('search', e.target.value)} className="w-full bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/></div></div>);
            case 'status': return (<div className="p-2 space-y-1">{[{id: 'all', label: '全部'}, {id: 'pending', label: '未完成'}, {id: 'completed', label: '已完成'}].map(opt => (<button key={opt.id} onClick={() => { onFilterChange('status', opt.id); onClose(); }} className={`${baseBtnClass} ${filters.status === opt.id ? activeBtnClass : ''}`}>{opt.label}</button>))}</div>);
            case 'priority': return (<div className="p-2 space-y-1">{(['all', ...Object.values(Priority)]).map(p => (<button key={p} onClick={() => { onFilterChange('priority', p); onClose(); }} className={`${baseBtnClass} ${filters.priority === p ? activeBtnClass : ''}`}>{p === 'all' ? '全部' : p}</button>))}</div>);
            case 'project': return (<div className="p-2 space-y-1"><button onClick={() => { onFilterChange('project', 'all'); onClose(); }} className={`${baseBtnClass} ${filters.project === 'all' ? activeBtnClass : ''}`}>全部项目</button>{projects.map(p => (<button key={p.id} onClick={() => { onFilterChange('project', p.id); onClose(); }} className={`${baseBtnClass} ${filters.project === p.id ? activeBtnClass : ''}`}>{p.title}</button>))}</div>);
            case 'quadrant': return (<div className="p-2 space-y-1"><button onClick={() => { onFilterChange('quadrant', 'all'); onClose(); }} className={`${baseBtnClass} ${filters.quadrant === 'all' ? activeBtnClass : ''}`}>全部</button>{Object.values(EisenhowerQuadrant).map(q => { const info = quadrantInfo[q]; return (<button key={q} onClick={() => { onFilterChange('quadrant', q); onClose(); }} className={`${baseBtnClass} ${filters.quadrant === q ? activeBtnClass : ''} flex items-center gap-2`}>{info.icon} {info.title}</button>); })}</div>);
            case 'date': return (<div className="p-2"><input type="date" value={filters.date} onChange={e => { onFilterChange('date', e.target.value); onClose(); }} className="w-full bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 dark:color-scheme-dark"/></div>);
            case 'tags': return (<div className="p-2 space-y-1 max-h-48 overflow-y-auto custom-scrollbar"><button onClick={() => { onFilterChange('tags', ''); onClose(); }} className={`${baseBtnClass} ${!filters.tags ? activeBtnClass : ''}`}>全部标签</button>{allTags.map(tag => (<button key={tag} onClick={() => { onFilterChange('tags', tag); onClose(); }} className={`${baseBtnClass} ${filters.tags === tag ? activeBtnClass : ''}`}>{tag}</button>))}</div>);
            default: return null;
        }
    };
    
    const handleClear = () => {
        const clearVal = column === 'date' || column === 'search' || column === 'tags' ? '' : 'all';
        onFilterChange(column, clearVal);
        onClose();
    };

    return (
        <div
            ref={popoverRef}
            style={{ 
                top: position.top, 
                left: position.left,
            }}
            className="fixed z-30 w-56 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200 ease-out origin-top"
        >
          {renderContent()}
          <div className="border-t border-gray-100 dark:border-zinc-700 p-2">
            <button onClick={handleClear} className="w-full text-center text-sm py-1 text-indigo-600 dark:text-indigo-400 font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-md">清除筛选</button>
          </div>
        </div>
    );
};


export const TableView: React.FC<TableViewProps> = ({ tasks, projects, blockedTaskIds, onTaskClick, onToggleTask, onUpdateTask }) => {
  const [colWidths, setColWidths] = useState<Record<string, number>>({ status: 80, title: 300, project: 140, priority: 100, quadrant: 160, date: 120, tags: 160, subtasks: 100 });
  const [filters, setFilters] = useState<TableFilters>(getInitialFilters);
  
  interface PopoverState {
    column: keyof TableFilters | null;
    rect: DOMRect | null;
  }
  const [popoverState, setPopoverState] = useState<PopoverState>({ column: null, rect: null });

  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('taskcube-table-filters', JSON.stringify(filters)); }, [filters]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (resizingRef.current) { const { col, startX, startWidth } = resizingRef.current; const newWidth = startWidth + (e.clientX - startX); setColWidths(prev => ({ ...prev, [col]: Math.max(newWidth, 60) })); } };
    const handleMouseUp = () => { resizingRef.current = null; document.body.style.cursor = ''; };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, []);

  const closePopover = useCallback(() => {
    setPopoverState({ column: null, rect: null });
  }, []);

  const handleFilterChange = useCallback((key: keyof TableFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const clearFilters = () => setFilters(getInitialFilters());

  const openFilterPopover = useCallback((column: keyof TableFilters, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect();
    setPopoverState(current => {
      if (current.column === column) {
        return { column: null, rect: null };
      } else {
        return { column, rect };
      }
    });
  }, []);
  
  const startResize = (e: React.MouseEvent, col: string) => { e.preventDefault(); e.stopPropagation(); resizingRef.current = { col, startX: e.clientX, startWidth: colWidths[col] }; document.body.style.cursor = 'col-resize'; };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => { task.tags?.forEach(tag => tagSet.add(tag)); });
    return Array.from(tagSet).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
        if (filters.status !== 'all' && (filters.status === 'completed') !== task.completed) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.project !== 'all' && task.projectId !== filters.project) return false;
        if (filters.search && !(task.title || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.quadrant !== 'all' && (task.quadrant || 'Q2') !== filters.quadrant) return false;
        if (filters.date && task.date !== filters.date) return false;
        if (filters.tags && (!task.tags || !task.tags.includes(filters.tags))) return false;
        return true;
    });
  }, [tasks, filters]);
  
  const sortedTasks = useMemo(() => [...filteredTasks].sort((a, b) => (a.completed !== b.completed) ? (a.completed ? 1 : -1) : (new Date(a.date).getTime() - new Date(b.date).getTime())), [filteredTasks]);
  
  const rowVirtualizer = useVirtualizer({ count: sortedTasks.length, getScrollElement: () => parentRef.current, estimateSize: () => 53, overscan: 5 });

  // FIX: Cast Object.values result to number[] to ensure correct type inference in reduce.
  const totalWidth = (Object.values(colWidths) as number[]).reduce((acc, w) => acc + w, 0);
  const headers: Record<string, string> = { status: '状态', title: '任务标题', project: '项目', priority: '优先级', quadrant: '四象限', date: '日期', tags: '标签', subtasks: '子任务'};

  const getProjectTitle = (projectId?: string) => projects.find(p => p.id === projectId)?.title || null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar">
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          <div className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-20 border-b border-gray-200 dark:border-zinc-800 shadow-sm flex">
            {Object.keys(colWidths).map(key => {
                 const filterKey = key === 'title' ? 'search' : key;
                 const hasFilter = ['search', 'status', 'priority', 'project', 'quadrant', 'date', 'tags'].includes(filterKey);
                 const isFilterActive = (filters as any)[filterKey] && (filters as any)[filterKey] !== 'all';
                 
                 return (
                 <div key={key} style={{ width: colWidths[key] }} className="py-2 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none flex items-center justify-between group relative flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                        <span>{headers[key]}</span>
                        {hasFilter && ( <button onMouseDown={e => e.stopPropagation()} onClick={(e) => openFilterPopover(filterKey as keyof TableFilters, e.currentTarget)}><FilterIcon size={12} className={`transition-colors ${isFilterActive ? 'text-indigo-600' : 'text-gray-300 dark:text-zinc-600 group-hover:text-gray-500'}`} /></button> )}
                    </div>
                    <div onMouseDown={(e) => startResize(e, key)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100" />
                 </div>
            )})}
          </div>

          {sortedTasks.length === 0 ? ( <div className="py-20 text-center text-gray-400"><p>没有匹配的任务</p></div> ) : (
            <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const task = sortedTasks[virtualRow.index];
                const isBlocked = blockedTaskIds.has(task.id);
                return (
                  <div key={task.id} className="absolute top-0 left-0 w-full flex border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group" style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}>
                    {Object.keys(colWidths).map(key => (
                      <div key={key} style={{ width: colWidths[key] }} className="py-3 px-3 flex items-center flex-shrink-0 overflow-hidden">
                        {key === 'status' && <div className="w-full text-center"><button disabled={isBlocked} onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }} className={`transition-colors disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-zinc-600 ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}>{task.completed ? <CheckCircle2 size={18} className="animate-pop-in" /> : <Circle size={18} />}</button></div>}
                        {key === 'title' && <div onClick={() => onTaskClick(task)} className={`flex items-center font-medium text-sm truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}`}>{isBlocked && <span title="被前置任务阻塞"><Lock size={12} className="mr-1.5 text-gray-400 shrink-0" /></span>}<span className="truncate">{task.title}</span></div>}
                        {key === 'project' && <div className="text-sm text-gray-600 dark:text-gray-300 truncate">{getProjectTitle(task.projectId)}</div>}
                        {key === 'priority' && <div className="text-sm text-gray-600 dark:text-gray-300">{task.priority}</div>}
                        {key === 'quadrant' && (() => { const info = task.quadrant && quadrantInfo[task.quadrant]; return info ? (<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">{info.icon}<span>{info.title}</span></div>) : null; })()}
                        {key === 'date' && <div className="text-sm text-gray-600 dark:text-gray-300">{task.date}</div>}
                        {key === 'tags' && <div className="flex flex-wrap gap-1">{task.tags?.map(tag => <span key={tag} className="text-xs bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{tag}</span>)}</div>}
                        {key === 'subtasks' && <div className="text-center w-full text-sm text-gray-500 dark:text-gray-400">{task.subTasks?.length > 0 && (<span className="flex items-center justify-center gap-1.5"><AlignLeft size={12} /><span>{task.subTasks.filter(s => s.completed).length}/{task.subTasks.length}</span></span>)}</div>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="bg-gray-50 dark:bg-zinc-800 border-t border-gray-200 dark:border-zinc-700 p-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between px-4">
        <span>共 {sortedTasks.length} 个任务</span>
        <button onClick={clearFilters} className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">清除所有筛选</button>
      </div>
       {popoverState.column && popoverState.rect && ( <FilterPopover 
          column={popoverState.column} 
          anchorRect={popoverState.rect} 
          onClose={closePopover} 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          projects={projects} 
          allTags={allTags} 
        /> )}
    </div>
  );
};