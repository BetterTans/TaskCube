import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant } from '../types.ts';
import { Zap, Star, Bell, Coffee, Lock, ChevronDown } from 'lucide-react';

// 补全 parseDate 工具函数
const parseDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

const formatDate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const getTaskColor = (task: Task, project?: Project) => {
    if (project) return project.color;
    switch (task.priority) {
      case Priority.HIGH: return '#EF4444'; // red-500
      case Priority.MEDIUM: return '#F97316'; // orange-500
      case Priority.LOW: return '#3B82F6'; // blue-500
      default: return '#6B7280'; // gray-500
    }
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

const MonthBlock = React.memo(({ date, tasks, projects, blockedTaskIds, onDateClick, onTaskClick, onUpdateTask, onVisible }: {
  date: Date;
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onVisible?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  
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
        onUpdateTask({ id: droppedTaskId, date: dateStr });
    }
    setDraggedTask(null);
  };

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-white dark:bg-zinc-925 rounded-2xl border border-gray-100 dark:border-zinc-800/50 shadow-sm">
      <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-100">{date.getFullYear()}年 {monthNames[date.getMonth()]}</h2>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-2 border-b border-gray-100 dark:border-zinc-800">
        {weekDayNames.map(day => <div key={day}>{day}</div>)}
      </div>
      <div className="flex-1 grid grid-rows-6">
        {calendarData.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 relative">
            {week.map((day, dayIndex) => {
              if (!day) return <div key={dayIndex} className="border-l border-gray-100 dark:border-zinc-800" />;
              
              const dateStr = formatDate(day);
              const isToday = dateStr === formatDate(new Date());

              return (
                <div 
                  key={dayIndex}
                  className="p-1.5 border-l border-gray-100 dark:border-zinc-800 flex flex-col h-full overflow-hidden"
                  onDragOver={(e) => handleDragOver(e, dateStr)}
                  onDrop={(e) => handleDrop(e, dateStr)}
                >
                  <button 
                    onClick={() => onDateClick(dateStr)}
                    className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday ? 'bg-indigo-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-7">
              {layoutWeekEvents(week, tasks, projects).map(event => {
                const isBlocked = blockedTaskIds.has(event.task.id);
                return (
                  <div
                    key={event.task.id}
                    draggable={!event.task.completed && !isBlocked}
                    onDragStart={e => handleDragStart(e, event.task)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(event.task, e); }}
                    className={`
                      pointer-events-auto mt-1 mx-px p-1 text-white text-xs rounded-md shadow-sm leading-tight flex items-start gap-1.5
                      ${event.task.completed ? 'opacity-60' : ''}
                      ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}
                      ${draggedTask?.id === event.task.id ? 'opacity-30' : ''}
                    `}
                    style={{
                      gridColumn: `${event.startDayIndex + 1} / span ${event.span}`,
                      marginTop: `${event.laneIndex * 24 + 32}px`,
                      backgroundColor: event.color,
                      height: '22px'
                    }}
                  >
                    <div className="flex-shrink-0 mt-px">{isBlocked ? <Lock size={10} className="text-white/80" /> : <QuadrantIcon quadrant={event.task.quadrant} size={10} />}</div>
                    <span className="truncate flex-1">{event.task.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export const FullCalendar: React.FC<{
  currentDate: Date;
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onDateChange: (date: Date) => void;
  onDateClick: (dateStr: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}> = ({ currentDate, tasks, projects, blockedTaskIds, onDateChange, onDateClick, onTaskClick, onUpdateTask }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  
  const [months, setMonths] = useState<Date[]>(() => {
    const today = new Date(currentDate);
    today.setDate(1);
    return Array.from({ length: 5 }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i - 2, 1));
  });

  useLayoutEffect(() => {
    if (isInitialLoad.current && scrollRef.current && months.length > 0) {
      const todayEl = scrollRef.current.children[2];
      if (todayEl) {
        scrollRef.current.scrollTop = (todayEl as HTMLElement).offsetTop;
        isInitialLoad.current = false;
      }
    }
  }, [months]);
  
  useEffect(() => {
    const today = new Date(currentDate);
    today.setDate(1);
    const initialMonths = Array.from({ length: 5 }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i - 2, 1));
    setMonths(initialMonths);
    isInitialLoad.current = true;
  }, [currentDate]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop < 200) {
      const firstMonth = months[0];
      setMonths(prev => [new Date(firstMonth.getFullYear(), firstMonth.getMonth() - 1, 1), ...prev]);
    }
    if (scrollHeight - scrollTop - clientHeight < 200) {
      const lastMonth = months[months.length - 1];
      setMonths(prev => [...prev, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1)]);
    }
  };
  
  const handleMonthVisible = (month: Date) => {
    onDateChange(month);
  };
  
  return (
    <div ref={scrollRef} onScroll={handleScroll} className="h-full overflow-y-auto custom-scrollbar">
      {months.map(month => (
        <div key={month.toISOString()} className="h-full">
          <MonthBlock 
            date={month} 
            tasks={tasks}
            projects={projects}
            blockedTaskIds={blockedTaskIds}
            onDateClick={onDateClick}
            onTaskClick={onTaskClick}
            onUpdateTask={onUpdateTask}
            onVisible={() => handleMonthVisible(month)}
          />
        </div>
      ))}
    </div>
  );
};
