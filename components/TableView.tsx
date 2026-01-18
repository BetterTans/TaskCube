import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Task, Priority, EisenhowerQuadrant, Project } from '../types';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  CheckCircle2, 
  Circle, 
  Filter as FilterIcon,
  Search,
  Briefcase,
  AlignLeft,
  Lock
} from 'lucide-react';

// Props for the TableView component
interface TableViewProps {
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

// FIX: Define type for filters and restore getInitialFilters function
interface TableFilters {
    search: string;
    status: 'all' | 'completed' | 'pending';
    priority: 'all' | Priority;
    project: 'all' | string;
}

const getInitialFilters = (): TableFilters => {
    const saved = localStorage.getItem('taskcube-table-filters');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Ensure all keys are present
            return {
                search: parsed.search || '',
                status: parsed.status || 'all',
                priority: parsed.priority || 'all',
                project: parsed.project || 'all',
            };
        } catch (e) { /* ignore parse error */ }
    }
    return {
        search: '',
        status: 'all',
        priority: 'all',
        project: 'all',
    };
};

export const TableView: React.FC<TableViewProps> = ({ tasks, projects, blockedTaskIds, onTaskClick, onToggleTask, onUpdateTask }) => {
  // --- STATE MANAGEMENT ---
  const [colWidths, setColWidths] = useState<Record<string, number>>({
    status: 80, title: 300, project: 140, priority: 100, quadrant: 130, date: 120, tags: 160, subtasks: 100
  });
  const [activeInlineEditor, setActiveInlineEditor] = useState<{ taskId: string, field: string } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<TableFilters>(getInitialFilters);
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---
  useEffect(() => { localStorage.setItem('taskcube-table-filters', JSON.stringify(filters)); }, [filters]);

  useEffect(() => {
    // FIX: Add missing mouse and click handlers
    const handleMouseMove = (e: MouseEvent) => {
        if (resizingRef.current) {
            const { col, startX, startWidth } = resizingRef.current;
            const newWidth = startWidth + (e.clientX - startX);
            setColWidths(prev => ({ ...prev, [col]: Math.max(newWidth, 60) }));
        }
    };
    const handleMouseUp = () => {
        resizingRef.current = null;
        document.body.style.cursor = '';
    };
    const handleClickOutside = (e: MouseEvent) => {
        if (activeInlineEditor) setActiveInlineEditor(null);
        if (activeFilter) setActiveFilter(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('click', handleClickOutside);
    };
  }, [activeInlineEditor, activeFilter]);

  // --- HANDLERS ---
  const handleFilterChange = (key: keyof TableFilters, value: any) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(getInitialFilters());
  const toggleFilter = (filterName: string) => setActiveFilter(prev => prev === filterName ? null : filterName);

  const startResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { col, startX: e.clientX, startWidth: colWidths[col] };
    document.body.style.cursor = 'col-resize';
  };

  // --- DATA PROCESSING (MEMOIZED) ---
  // FIX: Implement filtering logic
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return tasks.filter(task => {
        if (filters.status !== 'all' && (filters.status === 'completed') !== task.completed) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.project !== 'all' && task.projectId !== filters.project) return false;
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });
  }, [tasks, filters]);
  
  // FIX: Implement sorting logic
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredTasks]);
  
  // --- VIRTUALIZATION SETUP ---
  const rowVirtualizer = useVirtualizer({
    count: sortedTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53, // Estimated row height in pixels
    overscan: 5,
  });

  // --- RENDER HELPERS ---
  const totalWidth = Object.values(colWidths).reduce((acc, w) => acc + w, 0);
  const headers: Record<string, string> = { status: '状态', title: '任务标题', project: '项目', priority: '优先级', quadrant: '四象限', date: '日期', tags: '标签', subtasks: '子任务'};

  const getProjectTitle = (projectId?: string) => projects.find(p => p.id === projectId)?.title || null;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900">
      <div className="p-2 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <div className="relative">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
             <input
                type="text"
                placeholder="搜索任务..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
             />
          </div>
      </div>
      <div ref={parentRef} className="flex-1 overflow-auto custom-scrollbar">
        <div style={{ width: totalWidth, minWidth: '100%' }}>
          {/* Sticky Header */}
          <div className="bg-gray-50 dark:bg-zinc-900 sticky top-0 z-20 border-b border-gray-200 dark:border-zinc-800 shadow-sm flex">
            {Object.keys(colWidths).map(key => (
                 <div key={key} style={{ width: colWidths[key] }} className="py-2 px-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider select-none flex items-center justify-between group relative flex-shrink-0">
                    <span>{headers[key]}</span>
                    <div onMouseDown={(e) => startResize(e, key)} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize opacity-0 group-hover:opacity-100" />
                 </div>
            ))}
          </div>

          {/* Virtualized Body */}
          {sortedTasks.length === 0 ? (
            <div className="py-20 text-center text-gray-400"><p>没有匹配的任务</p></div>
          ) : (
            <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const task = sortedTasks[virtualRow.index];
                const isBlocked = blockedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    className="absolute top-0 left-0 w-full flex border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors group"
                    style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                  >
                    {Object.keys(colWidths).map(key => (
                      <div key={key} style={{ width: colWidths[key] }} className="py-3 px-3 flex items-center flex-shrink-0">
                        {key === 'status' && <div className="w-full text-center"><button disabled={isBlocked} onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }} className={`transition-colors disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-zinc-600 ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}>{task.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button></div>}
                        {key === 'title' && <div onClick={() => onTaskClick(task)} className={`flex items-center font-medium text-sm truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-200'}`}>
                            {/* FIX: Wrap Lock icon to provide a title */}
                            {isBlocked && <span title="被前置任务阻塞"><Lock size={12} className="mr-1.5 text-gray-400 shrink-0" /></span>}
                            <span className="truncate">{task.title}</span>
                          </div>}
                        {key === 'project' && <div className="relative inline-editor-trigger w-full text-sm text-gray-600 dark:text-gray-300">{getProjectTitle(task.projectId)}</div>}
                        {key === 'priority' && <div className="relative inline-editor-trigger w-full text-sm text-gray-600 dark:text-gray-300">{task.priority}</div>}
                        {key === 'quadrant' && <div className="relative inline-editor-trigger w-full text-sm text-gray-600 dark:text-gray-300">{task.quadrant}</div>}
                        {key === 'date' && <div className="relative inline-editor-trigger w-full text-sm text-gray-600 dark:text-gray-300">{task.date}</div>}
                        {key === 'tags' && <div className="relative inline-editor-trigger w-full flex flex-wrap gap-1">{task.tags?.map(tag => <span key={tag} className="text-xs bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">{tag}</span>)}</div>}
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
        <button onClick={clearFilters} className="text-indigo-500 hover:underline disabled:opacity-50 disabled:no-underline" disabled={!Object.values(filters).some(v => v && v !== 'all')}>清除所有筛选</button>
        <span>共 {sortedTasks.length} 个任务</span>
      </div>
    </div>
  );
};
