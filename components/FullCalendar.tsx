import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { Task, Project, Priority, EisenhowerQuadrant } from '../types.ts';
import { Zap, Star, Bell, Coffee, Lock } from 'lucide-react';

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

const layoutWeekEvents = (week: Date[], tasks: Task[], projects: Project[]): WeekEvent[] => {
  const weekStart = formatDate(week[0]);
  const weekEnd = formatDate(week[6]);
  
  const weekTasks = tasks.filter(task => {
    const taskStart = task.date;
    const taskEnd = task.endDate || task.date;
    return taskStart <= weekEnd && taskEnd >= weekStart;
  });

  const events: Omit<WeekEvent, 'laneIndex'>[] = [];
  const projectMap = new Map(projects.map(p => [p.id, p]));

  for (const task of weekTasks) {
    const taskStartDate = parseDate(task.date);
    const taskEndDate = parseDate(task.endDate || task.date);
    
    let startDayIndex = 0;
    if (formatDate(taskStartDate) > weekStart) {
        startDayIndex = taskStartDate.getDay();
    }

    let endDayIndex = 6;
    if (formatDate(taskEndDate) < weekEnd) {
        endDayIndex = taskEndDate.getDay();
    }
    
    const span = endDayIndex - startDayIndex + 1;
    if (span <= 0) continue;

    events.push({
      task,
      startDayIndex,
      span,
      isStart: formatDate(taskStartDate) >= weekStart,
      isEnd: formatDate(taskEndDate) <= weekEnd,
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

const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
const weekDayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const areDatesSame = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const getWeekForDate = (date: Date): Date[] => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const dayOfWeek = d.getDay(); // 0 for Sunday
    const firstDayOfWeek = new Date(d);
    firstDayOfWeek.setDate(d.getDate() - dayOfWeek);
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDayOfWeek);
        day.setDate(day.getDate() + i);
        week.push(day);
    }
    return week;
};

export const FullCalendar: React.FC<{
  currentDate: Date;
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  onDateClick: (dateStr: string) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}> = ({ currentDate, tasks, projects, blockedTaskIds, onDateClick, onTaskClick, onUpdateTask }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [weeks, setWeeks] = useState<Date[][]>([]);
    const isInitialLoad = useRef(true);

    useEffect(() => {
        const centerDate = new Date(currentDate);
        centerDate.setHours(0, 0, 0, 0);
        const centerWeek = getWeekForDate(centerDate);
        
        const initialWeeks: Date[][] = [];
        const windowSize = 10;

        for (let i = windowSize; i > 0; i--) {
            const pastWeekStart = new Date(centerWeek[0]);
            pastWeekStart.setDate(pastWeekStart.getDate() - (i * 7));
            initialWeeks.push(getWeekForDate(pastWeekStart));
        }
        
        initialWeeks.push(centerWeek);
        
        for (let i = 1; i <= windowSize; i++) {
            const futureWeekStart = new Date(centerWeek[0]);
            futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
            initialWeeks.push(getWeekForDate(futureWeekStart));
        }

        setWeeks(initialWeeks);
        isInitialLoad.current = true;
    }, [currentDate]);

    useLayoutEffect(() => {
        if (isInitialLoad.current && scrollRef.current && weeks.length > 0) {
            const weekHeight = 120;
            const approxOffset = 10 * weekHeight;
            scrollRef.current.scrollTop = approxOffset - (scrollRef.current.clientHeight / 2) + (weekHeight / 2);
            isInitialLoad.current = false;
        }
    }, [weeks]);
    
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const loadThreshold = 400;

        if (scrollTop < loadThreshold) {
            const firstWeek = weeks[0];
            const oldScrollHeight = scrollHeight;
            const newWeeks: Date[][] = [];
            for (let i = 5; i > 0; i--) {
                const pastWeekStart = new Date(firstWeek[0]);
                pastWeekStart.setDate(pastWeekStart.getDate() - (i * 7));
                newWeeks.push(getWeekForDate(pastWeekStart));
            }
             setWeeks(prev => {
                const combined = [...newWeeks, ...prev];
                // Use a timeout to allow React to render and then adjust scroll to prevent jarring jumps
                setTimeout(() => {
                    if (scrollRef.current) {
                        scrollRef.current.scrollTop = scrollTop + (scrollRef.current.scrollHeight - oldScrollHeight);
                    }
                }, 0);
                return combined;
            });
        }

        if (scrollHeight - scrollTop - clientHeight < loadThreshold) {
            const lastWeek = weeks[weeks.length - 1];
            const newWeeks: Date[][] = [];
            for (let i = 1; i <= 5; i++) {
                const futureWeekStart = new Date(lastWeek[0]);
                futureWeekStart.setDate(futureWeekStart.getDate() + (i * 7));
                newWeeks.push(getWeekForDate(futureWeekStart));
            }
            setWeeks(prev => [...prev, ...newWeeks]);
        }
    }, [weeks]);

    const handleDragStart = (e: React.DragEvent, task: Task) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', task.id); setDraggedTask(task); };
    const handleDragEnd = () => setDraggedTask(null);
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDrop = (e: React.DragEvent, dateStr: string) => { e.preventDefault(); if (!dateStr || !draggedTask) return; const droppedTaskId = e.dataTransfer.getData('text/plain'); if (droppedTaskId === draggedTask.id) { onUpdateTask({ id: droppedTaskId, date: dateStr }); } setDraggedTask(null); };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/50 dark:border-zinc-800/50 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 py-2 border-b border-gray-100 dark:border-zinc-800 shrink-0 bg-gray-50/50 dark:bg-zinc-900 z-20">
                {weekDayNames.map(day => <div key={day}>{day}</div>)}
            </div>
            <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto custom-scrollbar">
                {weeks.map((week, index) => {
                    const prevWeek = index > 0 ? weeks[index - 1] : null;
                    const representativeDay = week[4]; // Thursday represents the week's month

                    let isNewMonth = false;
                    if (!prevWeek) {
                        isNewMonth = true;
                    } else {
                        const prevRepresentativeDay = prevWeek[4];
                        if (representativeDay.getFullYear() !== prevRepresentativeDay.getFullYear() || representativeDay.getMonth() !== prevRepresentativeDay.getMonth()) {
                            isNewMonth = true;
                        }
                    }
                    
                    const monthDate = representativeDay;
                    const weekEvents = layoutWeekEvents(week, tasks, projects);
                    const currentMonthForDimming = currentDate.getMonth();
                    
                    return (
                        <React.Fragment key={week[0].toISOString()}>
                            {isNewMonth && (
                                <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
                                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                    {monthDate.getFullYear()}年 {monthNames[monthDate.getMonth()]}
                                  </h2>
                                </div>
                            )}
                            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 min-h-[120px] relative">
                                {week.map((day) => {
                                    const dateStr = formatDate(day);
                                    const isToday = areDatesSame(day, new Date());
                                    const isCurrentMonth = day.getMonth() === currentMonthForDimming;
                                    return (
                                        <div key={dateStr} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, dateStr)} className={`p-1.5 border-l border-gray-100 dark:border-zinc-800 flex flex-col relative ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-zinc-900/50' : ''}`}>
                                            <button onClick={() => onDateClick(dateStr)} className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday ? 'bg-indigo-600 text-white' : (isCurrentMonth ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800' : 'text-gray-400 dark:text-gray-600')}`}>
                                                {day.getDate()}
                                            </button>
                                        </div>
                                    );
                                })}
                                <div className="absolute inset-0 pointer-events-none grid grid-cols-7">
                                  {weekEvents.map(event => {
                                    const isBlocked = blockedTaskIds.has(event.task.id);
                                    return (
                                      <div
                                        key={event.task.id}
                                        draggable={!event.task.completed && !isBlocked}
                                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, event.task); }}
                                        onDragEnd={(e) => { e.stopPropagation(); handleDragEnd(); }}
                                        onClick={(e) => { e.stopPropagation(); onTaskClick(event.task, e); }}
                                        className={`pointer-events-auto mt-1 mx-px p-1 text-white text-xs rounded-md shadow-sm leading-tight flex items-start gap-1.5 ${event.task.completed ? 'opacity-60' : ''} ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:opacity-80'} ${draggedTask?.id === event.task.id ? 'opacity-30' : ''}`}
                                        style={{ gridColumn: `${event.startDayIndex + 1} / span ${event.span}`, marginTop: `${event.laneIndex * 24 + 32}px`, backgroundColor: event.color, height: '22px' }}
                                      >
                                        <div className="flex-shrink-0 mt-px">{isBlocked ? <Lock size={10} className="text-white/80" /> : <QuadrantIcon quadrant={event.task.quadrant} size={10} />}</div>
                                        <span className="truncate flex-1">{event.task.title}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};