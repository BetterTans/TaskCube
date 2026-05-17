
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant, TaskProgress } from '../types.ts';
import { Zap, Star, Bell, Coffee, Lock, ChevronDown } from 'lucide-react';
import { parseDate } from '../services/recurringService.ts';
import { formatDate } from '../utils/dateUtils.ts';
import { getProgressDisplay } from '../utils/taskDisplay.ts';
import { priorityHexColors, quadrantStyles } from '../config/taskColors.ts';

const getTaskColor = (task: Task, project?: Project) => {
    if (project) return project.color;
    const hex = priorityHexColors[task.priority];
    return hex || '#6B7280';
};

interface WeekEvent {
  task: Task;
  laneIndex: number;
  startDayIndex: number;
  span: number;
  isStart: boolean;
  isEnd: boolean;
  color: string;
}

const QuadrantIcon = ({ quadrant, size = 12 }: { quadrant?: EisenhowerQuadrant; size?: number }) => {
  switch (quadrant) {
    case EisenhowerQuadrant.Q1: return <Zap size={size} className="text-white/80" />;
    case EisenhowerQuadrant.Q2: return <Star size={size} className="text-white/80" />;
    case EisenhowerQuadrant.Q3: return <Bell size={size} className="text-white/80" />;
    case EisenhowerQuadrant.Q4: return <Coffee size={size} className="text-white/80" />;
    default: return <Star size={size} className="text-white/80" />;
  }
};

const layoutWeekEvents = (week: (Date | null)[], tasks: Task[], projects: Project[]): WeekEvent[] => {
  const weekStart = week[0] ? formatDate(week[0]) : '';
  const weekEnd = week[6] ? formatDate(week[6]) : '';
  if (!weekStart || !weekEnd) return [];

  const weekTasks = tasks.filter(task => {
    const taskStart = task.date;
    const taskEnd = task.endDate || task.date;
    return taskStart <= weekEnd && taskEnd >= weekStart;
  });

  const events: Omit<WeekEvent, 'laneIndex'>[] = [];
  const projectMap = new Map(projects.map(p => [p.id, p]));

  for (const task of weekTasks) {
    const taskStart = parseDate(task.date);
    const taskEnd = parseDate(task.endDate || task.date);

    let startDayIndex = 0;
    if (formatDate(taskStart) > weekStart) {
        startDayIndex = taskStart.getDay();
    }

    let endDayIndex = 6;
    if (formatDate(taskEnd) < weekEnd) {
        endDayIndex = taskEnd.getDay();
    }

    const span = endDayIndex - startDayIndex + 1;
    if (span <= 0) continue;

    events.push({
      task,
      startDayIndex,
      span,
      isStart: formatDate(taskStart) >= weekStart,
      isEnd: formatDate(taskEnd) <= weekEnd,
      color: getTaskColor(task, task.projectId ? projectMap.get(task.projectId) : undefined),
    });
  }

  events.sort((a, b) => {
    if (a.startDayIndex !== b.startDayIndex) return a.startDayIndex - b.startDayIndex;
    return b.span - a.span;
  });

  const lanes: WeekEvent[][] = [];
  for (const event of events) {
    let placed = false;
    for (let i = 0; i < lanes.length; i++) {
      const lastEventInLane = lanes[i][lanes[i].length - 1];
      if (lastEventInLane && (lastEventInLane.startDayIndex + lastEventInLane.span) <= event.startDayIndex) {
        lanes[i].push({ ...event, laneIndex: i });
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push([{ ...event, laneIndex: lanes.length }]);
    }
  }

  return lanes.flat();
};

const MonthBlock = React.memo(({ date, tasks, projects, blockedTaskIds, onDateClick, onTaskClick, onUpdateTask, onVisible, onInlineCreate }: {
  date: Date;
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onVisible?: () => void;
  onInlineCreate?: (dateStr: string, title: string) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [quickCreateDate, setQuickCreateDate] = useState<string | null>(null);
  const [quickCreateValue, setQuickCreateValue] = useState('');
  const quickCreateRef = useRef<HTMLInputElement>(null);

  const calendarData = useMemo(() => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    let currentDate = new Date(firstDay);
    currentDate.setDate(currentDate.getDate() - firstDay.getDay());

    while (currentDate <= lastDay || currentWeek.length > 0) {
      for (let i = 0; i < 7; i++) {
        if (currentDate.getMonth() === month) {
            currentWeek.push(new Date(currentDate));
        } else {
            currentWeek.push(null);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(currentWeek);
      currentWeek = [];
      if (currentDate.getMonth() !== month && currentDate > lastDay) break;
    }
    return weeks;
  }, [date]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && onVisible) {
          onVisible();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDraggedTask(task);
  };
  const handleDragEnd = () => {
    setDraggedTask(null);
  };
  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (dateStr) {
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };
  const handleDrop = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    if (!dateStr || !draggedTask) return;
    const droppedTaskId = e.dataTransfer.getData('text/plain');
    if (droppedTaskId === draggedTask.id) {
      const updates: Partial<{ id: string; date: string; endDate: string }> = {
        id: droppedTaskId,
        date: dateStr
      };

      if (draggedTask.endDate) {
        const startDate = parseDate(draggedTask.date);
        const endDate = parseDate(draggedTask.endDate);
        const durationDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        const newStartDate = parseDate(dateStr);
        const newEndDate = new Date(newStartDate);
        newEndDate.setDate(newEndDate.getDate() + durationDays);

        const offset = newEndDate.getTimezoneOffset() * 60000;
        const newEndDateStr = new Date(newEndDate.getTime() - offset).toISOString().split('T')[0];

        updates.endDate = newEndDateStr;
      }

      onUpdateTask(updates);
    }
    setDraggedTask(null);
  };

  // Quick-create (floating bar) handlers
  useEffect(() => {
    if (quickCreateDate && quickCreateRef.current) {
      quickCreateRef.current.focus();
    }
  }, [quickCreateDate]);

  useEffect(() => {
    if (!quickCreateDate) return;
    const handler = (e: MouseEvent) => {
      if (quickCreateRef.current && !quickCreateRef.current.contains(e.target as Node)) {
        setQuickCreateDate(null);
        setQuickCreateValue('');
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [quickCreateDate]);

  const handleQuickCreateSubmit = () => {
    const title = quickCreateValue.trim();
    if (title && quickCreateDate && onInlineCreate) {
      onInlineCreate(quickCreateDate, title);
    }
    setQuickCreateDate(null);
    setQuickCreateValue('');
  };

  const handleQuickCreateKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleQuickCreateSubmit();
    } else if (e.key === 'Escape') {
      setQuickCreateDate(null);
      setQuickCreateValue('');
    }
  };

  const handleDateCellClick = (dateStr: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[draggable]')) return;
    if (onInlineCreate) {
      if (quickCreateDate === dateStr) {
        setQuickCreateDate(null);
        setQuickCreateValue('');
      } else {
        setQuickCreateDate(dateStr);
        setQuickCreateValue('');
      }
    }
  };

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const TODAY = formatDate(new Date());

  return (
    <div ref={containerRef} className="pb-8">
      <div className="text-xl font-bold text-gray-800 dark:text-gray-200 p-4 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10">{date.getFullYear()}年 {monthNames[date.getMonth()]}</div>

      {/* Floating quick-create bar */}
      {quickCreateDate && (
        <div className="mx-1 mb-1 flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-indigo-300 dark:border-indigo-600 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{quickCreateDate}</span>
          <input
            ref={quickCreateRef}
            type="text"
            value={quickCreateValue}
            onChange={(e) => setQuickCreateValue(e.target.value)}
            onKeyDown={handleQuickCreateKeyDown}
            className="flex-1 px-2 py-0.5 text-sm rounded bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white outline-none border border-gray-200 dark:border-zinc-700 focus:border-indigo-400 dark:focus:border-indigo-500"
            placeholder="新任务标题，回车创建..."
          />
        </div>
      )}

      <div className="flex flex-col border-b border-r border-gray-200 dark:border-zinc-800">
        {calendarData.map((week, weekIndex) => {
          const weekEvents = layoutWeekEvents(week, tasks, projects);
          const maxLanes = weekEvents.length > 0 ? Math.max(0, ...weekEvents.map(e => e.laneIndex)) : -1;
          const dayHeaderHeight = 32;
          const eventHeight = 22;
          const eventGap = 2;
          const weekContentHeight = (maxLanes + 1) * (eventHeight + eventGap) + 5;

          return (
            <div key={weekIndex} className="grid grid-cols-7 relative border-t border-gray-200 dark:border-zinc-800" style={{ minHeight: `${dayHeaderHeight + weekContentHeight}px` }}>
              {week.map((day, dayIndex) => {
                if (!day) return <div key={dayIndex} className="border-l border-gray-200 dark:border-zinc-800" />;
                const dateStr = formatDate(day);
                const isToday = dateStr === TODAY;
                const isQuickCreateActive = quickCreateDate === dateStr;
                return (
                  <div
                    key={dayIndex}
                    onDragOver={(e) => handleDragOver(e, dateStr)}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    onClick={(e) => handleDateCellClick(dateStr, e)}
                    className={`border-l border-gray-200 dark:border-zinc-800 h-full p-1 cursor-text transition-colors ${isQuickCreateActive ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                  >
                    <button
                        onClick={() => onDateClick(dateStr)}
                        className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {day.getDate()}
                    </button>
                  </div>
                )
              })}

              <div className="absolute top-0 left-0 right-0" style={{ top: `${dayHeaderHeight}px` }}>
                {weekEvents.map(({ task, laneIndex, startDayIndex, span, isStart, isEnd, color }) => {
                  const isBlocked = blockedTaskIds.has(task.id);
                  const progressInfo = getProgressDisplay(task.progress);
                  return (
                  <div
                    key={task.id}
                    draggable={!task.completed && !isBlocked}
                    onDragStart={!task.completed && !isBlocked ? (e) => handleDragStart(e, task) : undefined}
                    onDragEnd={!task.completed && !isBlocked ? handleDragEnd : undefined}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task, e); }}
                    className={`
                      absolute flex items-center h-[22px] px-2 text-xs font-medium text-white transition-all duration-100 shadow-sm gap-1.5
                      ${isStart ? 'rounded-md' : ''} ${isEnd ? 'rounded-md' : ''}
                      ${task.completed ? 'opacity-60 grayscale' : (isBlocked ? 'opacity-70 cursor-not-allowed' : 'hover:brightness-110 cursor-grab')}
                      ${draggedTask?.id === task.id ? 'opacity-30' : ''}
                    `}
                    style={{
                      top: `${laneIndex * (eventHeight + eventGap)}px`,
                      left: `calc(${(startDayIndex / 7) * 100}% + 2px)`,
                      width: `calc(${(span / 7) * 100}% - 4px)`,
                      backgroundColor: color
                    }}
                  >
                    {isBlocked ? <Lock size={12} className="text-white/80 shrink-0" /> : <QuadrantIcon quadrant={task.quadrant} />}
                    <span className="truncate flex-1">{task.title}</span>
                    {span >= 3 && (
                      <span className="text-[10px] text-white/70 shrink-0 hidden sm:inline">{progressInfo.text}</span>
                    )}
                  </div>
                )})}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

interface FullCalendarProps {
  currentDate: Date;
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onDateChange: (date: Date) => void;
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onInlineCreate?: (dateStr: string, title: string) => void;
}

export const FullCalendar: React.FC<FullCalendarProps> = ({
  currentDate,
  tasks,
  projects,
  blockedTaskIds,
  onDateChange,
  onDateClick,
  onTaskClick,
  onUpdateTask,
  onInlineCreate
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const [months, setMonths] = useState<Date[]>([]);

  useEffect(() => {
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    setMonths([
      new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() - 1, 1),
      startOfMonth,
      new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1),
    ]);
    isInitialLoad.current = true;
  }, [currentDate]);

  useLayoutEffect(() => {
    if (isInitialLoad.current && scrollRef.current && months.length > 0) {
      const middleMonthEl = scrollRef.current.children[1];
      if (middleMonthEl) {
        scrollRef.current.scrollTop = (middleMonthEl as HTMLElement).offsetTop;
        isInitialLoad.current = false;
      }
    }
  }, [months]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop < 100) {
      setMonths(prev => [new Date(prev[0].getFullYear(), prev[0].getMonth() - 1, 1), ...prev]);
    }
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setMonths(prev => [...prev, new Date(prev[prev.length-1].getFullYear(), prev[prev.length-1].getMonth() + 1, 1)]);
    }
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="grid grid-cols-7 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm z-20 border-b border-gray-100 dark:border-zinc-800">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-500 dark:text-gray-400 py-2">{d}</div>
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
             blockedTaskIds={blockedTaskIds}
             onDateClick={onDateClick}
             onTaskClick={onTaskClick}
             onUpdateTask={onUpdateTask}
             onInlineCreate={onInlineCreate}
           />
        ))}
      </div>
    </div>
  );
};
