import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant } from '../types';
import { Zap, Star, Bell, Coffee } from 'lucide-react';

interface FullCalendarProps {
  currentDate: Date;
  tasks: Task[];
  projects: Project[];
  onDateChange: (date: Date) => void;
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

// 辅助函数：将 YYYY-MM-DD 字符串转为 Date 对象 (UTC午夜)
const parseDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const QuadrantIcon = ({ quadrant, size = 12 }: { quadrant?: EisenhowerQuadrant, size?: number }) => {
  const q = quadrant || EisenhowerQuadrant.Q2;
  const icons = {
    [EisenhowerQuadrant.Q1]: <Zap size={size} className="text-white/80" />,
    [EisenhowerQuadrant.Q2]: <Star size={size} className="text-white/80" />,
    [EisenhowerQuadrant.Q3]: <Bell size={size} className="text-white/80" />,
    [EisenhowerQuadrant.Q4]: <Coffee size={size} className="text-white/80" />,
  };
  return icons[q];
};

interface RenderedEvent {
  task: Task;
  laneIndex: number;
  startDayIndex: number; // 0-6 in the week
  span: number; // number of days in the week
  isStart: boolean;
  isEnd: boolean;
  color: string;
}

// 核心布局算法：计算一周内所有事件的渲染位置
const layoutWeekEvents = (weekDays: any[], allTasks: Task[], projects: Project[]): RenderedEvent[] => {
  const weekStart = weekDays[0].date;
  const weekEnd = weekDays[6].date;
  weekStart.setUTCHours(0, 0, 0, 0);
  weekEnd.setUTCHours(23, 59, 59, 999);

  const weekTasks = allTasks.filter(task => {
    const taskStart = parseDate(task.date);
    const taskEnd = task.endDate ? parseDate(task.endDate) : taskStart;
    taskEnd.setUTCHours(23, 59, 59, 999);
    return taskStart <= weekEnd && taskEnd >= weekStart;
  });
  
  weekTasks.sort((a, b) => {
    const durationA = (parseDate(a.endDate || a.date).getTime() - parseDate(a.date).getTime());
    const durationB = (parseDate(b.endDate || b.date).getTime() - parseDate(b.date).getTime());
    if (durationA !== durationB) return durationB - durationA;
    return parseDate(a.date).getTime() - parseDate(b.date).getTime();
  });
  
  const lanes: Task[][] = [];
  const renderedTasks: Omit<RenderedEvent, 'startDayIndex' | 'span' | 'isStart' | 'isEnd'>[] = [];

  for (const task of weekTasks) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const overlaps = lanes[i].some(placedTask => {
         const pStart = parseDate(placedTask.date);
         const pEnd = parseDate(placedTask.endDate || placedTask.date);
         const tStart = parseDate(task.date);
         const tEnd = parseDate(task.endDate || task.date);
         return tStart <= pEnd && tEnd >= pStart;
      });
      if (!overlaps) {
        lanes[i].push(task);
        const project = projects.find(p => p.id === task.projectId);
        renderedTasks.push({ task, laneIndex: i, color: project?.color || '#6366F1' });
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([task]);
      const project = projects.find(p => p.id === task.projectId);
      renderedTasks.push({ task, laneIndex: lanes.length - 1, color: project?.color || '#6366F1' });
    }
  }

  return renderedTasks.map(({ task, laneIndex, color }) => {
    const taskStart = parseDate(task.date);
    const taskEnd = parseDate(task.endDate || task.date);
    const dayInMillis = 24 * 60 * 60 * 1000;

    let startDayIndex = 0;
    if (taskStart > weekStart) {
      startDayIndex = Math.round((taskStart.getTime() - weekStart.getTime()) / dayInMillis);
    }
    
    let endDayIndex = 6;
    if (taskEnd < weekEnd) {
      endDayIndex = Math.round((taskEnd.getTime() - weekStart.getTime()) / dayInMillis);
    }
    
    return {
      task,
      laneIndex,
      startDayIndex,
      span: endDayIndex - startDayIndex + 1,
      isStart: taskStart >= weekStart,
      isEnd: taskEnd <= weekEnd,
      color
    };
  });
};

const MonthBlock = React.memo(({ date, tasks, projects, onDateClick, onTaskClick, onUpdateTask, onVisible }: {
  date: Date;
  tasks: Task[];
  projects: Project[];
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onVisible?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  
  const calendarData = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    const startDayOfWeek = firstDay.getUTCDay(); 
    
    const allDays = [];
    const prevMonthLastDate = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(year, month - 1, prevMonthLastDate - i));
      allDays.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getUTCDate(); i++) {
      allDays.push({ date: new Date(Date.UTC(year, month, i)), isCurrentMonth: true });
    }

    const totalSoFar = allDays.length;
    const remainingCells = (7 - (totalSoFar % 7)) % 7; 
    for (let i = 1; i <= remainingCells; i++) {
      allDays.push({ date: new Date(Date.UTC(year, month + 1, i)), isCurrentMonth: false });
    }

    // Group into weeks
    const weeks = [];
    for (let i = 0; i < allDays.length; i += 7) {
        weeks.push(allDays.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && onVisible) onVisible();
    }, { threshold: 0.6 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  const priorityBorder = {
    [Priority.HIGH]: 'border-l-red-500',
    [Priority.MEDIUM]: 'border-l-orange-400',
    [Priority.LOW]: 'border-l-blue-400',
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, task: Task) => {
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => setDraggedTask(task), 0);
  };
  
  const handleDragEnd = () => {
      setDraggedTask(null);
      setDragOverDate(null);
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      setDragOverDate(dateStr);
  };

  const handleDrop = (e: React.DragEvent, dateStr: string) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData('taskId');
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const originalStartDate = parseDate(task.date);
      const newStartDate = parseDate(dateStr);
      
      let newEndDateStr: string | undefined = undefined;

      if (task.endDate) {
          const duration = parseDate(task.endDate).getTime() - originalStartDate.getTime();
          const newEndDate = new Date(newStartDate.getTime() + duration);
          const offset = newEndDate.getTimezoneOffset() * 60000;
          newEndDateStr = new Date(newEndDate.getTime() - offset).toISOString().split('T')[0];
      }
      
      onUpdateTask({
          id: task.id,
          date: dateStr,
          endDate: newEndDateStr,
      });
      setDraggedTask(null);
      setDragOverDate(null);
  };

  return (
    <div ref={containerRef} className="pb-8">
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-2 border-b border-gray-100 dark:border-zinc-800 shadow-sm flex items-center text-gray-900 dark:text-white font-bold text-lg">
        {year}年 {month + 1}月
      </div>
      <div className="flex flex-col border-b border-r border-gray-50 dark:border-zinc-800/50">
        {calendarData.map((week, weekIndex) => {
          const weekEvents = layoutWeekEvents(week, tasks, projects);
          const maxLanes = Math.max(0, ...weekEvents.map(e => e.laneIndex));
          const dayHeaderHeight = 32;
          const eventHeight = 22;
          const eventGap = 2;
          const weekContentHeight = (maxLanes + 1) * (eventHeight + eventGap) + 5;

          return (
            <div key={weekIndex} className="grid grid-cols-7 relative" style={{ minHeight: `${dayHeaderHeight + weekContentHeight}px` }}>
              {/* Day numbers */}
              {week.map((day, dayIndex) => {
                  const dateStr = day.date.toISOString().split('T')[0];
                  return (
                    <div 
                      key={dateStr}
                      onClick={() => onDateClick(dateStr)}
                      onDragOver={(e) => handleDragOver(e, dateStr)}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      onDragLeave={() => setDragOverDate(null)}
                      className={`
                        relative h-full border-t border-l border-gray-50 dark:border-zinc-800/50 transition-colors duration-200
                        ${dragOverDate === dateStr ? 'bg-indigo-100 dark:bg-indigo-900/40' : (!day.isCurrentMonth ? 'bg-gray-50/20 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-900 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30')}
                      `}
                    >
                      <div className="flex justify-center p-1">
                        <span className={`
                           text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                           ${dateStr === todayStr ? 'bg-red-500 text-white' : (day.isCurrentMonth ? 'text-gray-900 dark:text-gray-200' : 'text-gray-300 dark:text-zinc-600')}
                         `}>
                           {day.date.getUTCDate()}
                         </span>
                      </div>
                    </div>
                  );
              })}

              {/* Event bars */}
              <div className="absolute top-0 left-0 right-0" style={{ top: `${dayHeaderHeight}px` }}>
                {weekEvents.map(({ task, laneIndex, startDayIndex, span, isStart, isEnd, color }) => (
                  <div
                    key={task.id}
                    draggable={!task.completed}
                    onDragStart={!task.completed ? (e) => handleDragStart(e, task) : undefined}
                    onDragEnd={!task.completed ? handleDragEnd : undefined}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task, e); }}
                    className={`
                      absolute flex items-center h-[22px] px-2 text-xs font-medium text-white transition-all duration-100 shadow-sm border-l-4 gap-1.5
                      ${isStart ? 'rounded-l-md' : ''} ${isEnd ? 'rounded-r-md' : ''}
                      ${priorityBorder[task.priority]}
                      ${task.completed ? 'opacity-60 grayscale' : 'hover:brightness-110 cursor-pointer'}
                      ${draggedTask?.id === task.id ? 'opacity-30' : ''}
                    `}
                    style={{
                      top: `${laneIndex * (eventHeight + eventGap)}px`,
                      left: `calc(${(startDayIndex / 7) * 100}% + 2px)`,
                      width: `calc(${(span / 7) * 100}% - 4px)`,
                      backgroundColor: color
                    }}
                  >
                    <QuadrantIcon quadrant={task.quadrant} />
                    <span className="truncate">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export const FullCalendar: React.FC<FullCalendarProps> = ({
  currentDate,
  tasks,
  projects,
  onDateChange,
  onDateClick,
  onTaskClick,
  onUpdateTask
}) => {
  const [months, setMonths] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastReportedDateRef = useRef<Date | null>(null);

  useEffect(() => {
    const initMonths = [];
    const y = currentDate.getUTCFullYear();
    const m = currentDate.getUTCMonth();
    for (let i = -1; i <= 2; i++) {
       initMonths.push(new Date(Date.UTC(y, m + i, 1)));
    }
    setMonths(initMonths);
    setIsInitialized(true);
  }, []); 

  useEffect(() => {
    if (!isInitialized) return;
    if (lastReportedDateRef.current && 
        currentDate.getUTCFullYear() === lastReportedDateRef.current.getUTCFullYear() && 
        currentDate.getUTCMonth() === lastReportedDateRef.current.getUTCMonth()) {
        return;
    }

    const targetTime = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), 1)).getTime();
    const existingIndex = months.findIndex(d => d.getTime() === targetTime);

    if (existingIndex !== -1 && scrollRef.current) {
       const targetEl = scrollRef.current.children[existingIndex] as HTMLElement;
       if (targetEl) targetEl.scrollIntoView({ behavior: 'auto' });
    } else {
       const initMonths = [];
       const y = currentDate.getUTCFullYear();
       const m = currentDate.getUTCMonth();
       for (let i = -1; i <= 2; i++) {
          initMonths.push(new Date(Date.UTC(y, m + i, 1)));
       }
       setMonths(initMonths);
       
       setTimeout(() => {
          if (scrollRef.current) {
             const targetEl = scrollRef.current.children[1] as HTMLElement;
             if (targetEl) targetEl.scrollIntoView({ behavior: 'auto' });
          }
       }, 0);
    }
  }, [currentDate, isInitialized, months]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (scrollTop + clientHeight > scrollHeight - 200) {
      setMonths(prev => {
        const last = prev[prev.length - 1];
        const next = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1));
        return [...prev, next];
      });
    }

    if (scrollTop < 100) {
      setMonths(prev => {
        const first = prev[0];
        const newPrev = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() - 1, 1));
        return [newPrev, ...prev];
      });
    }
  }, []);

  const prevScrollHeightRef = useRef(0);
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const currentScrollHeight = scrollRef.current.scrollHeight;
    
    if (prevScrollHeightRef.current > 0 && currentScrollHeight > prevScrollHeightRef.current) {
        const diff = currentScrollHeight - prevScrollHeightRef.current;
        if (scrollRef.current.scrollTop < 200) { 
           scrollRef.current.scrollTop += diff;
        }
    }
    prevScrollHeightRef.current = currentScrollHeight;
  }, [months]);

  const handleMonthVisible = useCallback((date: Date) => {
    lastReportedDateRef.current = date;
    onDateChange(date);
  }, [onDateChange]);

  const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 z-30 shadow-sm">
        {weekDays.map((day, index) => (
          <div 
            key={day} 
            className={`
              py-2 text-center text-xs font-semibold
              ${index === 0 || index === 6 ? 'text-gray-400 dark:text-zinc-500' : 'text-gray-900 dark:text-gray-300'}
            `}
          >
            {day.replace('周', '')}
          </div>
        ))}
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar relative"
      >
        {months.map((monthDate) => (
           <MonthBlock
             key={monthDate.toISOString()}
             date={monthDate}
             tasks={tasks}
             projects={projects}
             onDateClick={onDateClick}
             onTaskClick={onTaskClick}
             onUpdateTask={onUpdateTask}
             onVisible={() => handleMonthVisible(monthDate)}
           />
        ))}
      </div>
    </div>
  );
};