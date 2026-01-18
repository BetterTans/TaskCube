import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Task, Priority, EisenhowerQuadrant } from '../types';
import { Plus, Zap, Star, Bell, Coffee, Lock } from 'lucide-react';

interface DayTimeViewProps {
  currentDate: Date;
  tasks: Task[];
  blockedTaskIds: Set<string>;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onTimeSlotClick: (time: string) => void;
  onToggleTask: (id: string) => void;
  onDateChange: (date: Date) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

// FIX: Add helper components and functions
const QuadrantIcon = ({ quadrant, size = 12 }: { quadrant?: EisenhowerQuadrant, size?: number }) => {
  const props = { size, className: "text-current opacity-70 flex-shrink-0" };
  switch (quadrant) {
    case EisenhowerQuadrant.Q1: return <Zap {...props} />;
    case EisenhowerQuadrant.Q2: return <Star {...props} />;
    case EisenhowerQuadrant.Q3: return <Bell {...props} />;
    case EisenhowerQuadrant.Q4: return <Coffee {...props} />;
    default: return <Star {...props} />;
  }
};

const CurrentTimeIndicator = () => {
  const [top, setTop] = useState(0);
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setTop(minutes);
    };
    update();
    const interval = setInterval(update, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute left-14 right-0 pointer-events-none z-10" style={{ top: `${top}px` }}>
      <div className="h-[2px] bg-red-500 relative">
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full"></div>
      </div>
    </div>
  );
};

const formatDate = (date: Date): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

interface DragInfo {
  task: Task;
  type: 'move' | 'resize';
  startY: number;
  initialTop: number;
  initialHeight: number;
  previewTop: number;
  previewHeight: number;
}

// 单日区块组件
const DayBlock = React.memo(({ 
  date, 
  tasks, 
  blockedTaskIds,
  onTaskClick, 
  onTimeSlotClick, 
  onUpdateTask,
  onVisible 
}: {
  date: Date;
  tasks: Task[];
  blockedTaskIds: Set<string>;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onTimeSlotClick: (time: string) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onVisible?: () => void;
}) => {
  // FIX: Define refs, state, and derived values
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const dateStr = useMemo(() => formatDate(date), [date]);
  
  const dayTasks = useMemo(() => tasks.filter(t => t.date === dateStr || (t.endDate && t.date <= dateStr && t.endDate >= dateStr)), [tasks, dateStr]);

  const allDayTasks = dayTasks.filter(t => !t.startTime);
  const timedTasks = dayTasks.filter(t => !!t.startTime && t.date === dateStr);
  
  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize') => {
    if (task.completed || blockedTaskIds.has(task.id)) return;
    const [h, m] = (task.startTime || '00:00').split(':').map(Number);
    const initialTop = h * 60 + m;
    setDragInfo({
      task, type, startY: e.clientY,
      initialTop, initialHeight: task.duration || 60,
      previewTop: initialTop, previewHeight: task.duration || 60
    });
  };

  // FIX: Add useEffect for drag/drop handling
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragInfo || !timelineRef.current) return;
      
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const deltaY = e.clientY - dragInfo.startY;
      
      if (dragInfo.type === 'move') {
        const newTop = dragInfo.initialTop + deltaY;
        const snappedTop = Math.round(newTop / 15) * 15; // Snap to 15-minute intervals
        setDragInfo(prev => prev ? { ...prev, previewTop: Math.max(0, snappedTop) } : null);
      } else { // resize
        const newHeight = dragInfo.initialHeight + deltaY;
        const snappedHeight = Math.round(newHeight / 15) * 15;
        setDragInfo(prev => prev ? { ...prev, previewHeight: Math.max(15, snappedHeight) } : null);
      }
    };
    
    const handleMouseUp = () => {
      if (!dragInfo) return;
      
      const newStartMinutes = dragInfo.previewTop;
      const newHours = Math.floor(newStartMinutes / 60).toString().padStart(2, '0');
      const newMinutes = (newStartMinutes % 60).toString().padStart(2, '0');
      
      const updates: Partial<Task> = { id: dragInfo.task.id };
      if (dragInfo.type === 'move') {
        updates.startTime = `${newHours}:${newMinutes}`;
      } else {
        updates.duration = dragInfo.previewHeight;
      }
      onUpdateTask(updates);
      setDragInfo(null);
    };

    if (dragInfo) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, onUpdateTask]);

  // FIX: Define getLabel function
  const getLabel = useCallback(() => {
    const today = formatDate(new Date());
    const tomorrow = formatDate(new Date(Date.now() + 86400000));
    if (dateStr === today) return `今天, ${date.getMonth() + 1}月${date.getDate()}日`;
    if (dateStr === tomorrow) return `明天, ${date.getMonth() + 1}月${date.getDate()}日`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }, [date, dateStr]);

  const getTaskStyle = (task: Task) => {
    if (!task.startTime) return {};
    const isBlocked = blockedTaskIds.has(task.id);
    const isDraggingThis = dragInfo?.task.id === task.id;
    let startMinutes: number, duration: number;

    if (isDraggingThis) {
        startMinutes = dragInfo.previewTop;
        duration = dragInfo.previewHeight;
    } else {
        const [h, m] = task.startTime.split(':').map(Number);
        startMinutes = h * 60 + m;
        duration = task.duration || 60;
    }
    
    let bgColor = 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-700 text-blue-800 dark:text-blue-100';
    if (task.completed) bgColor = 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-gray-500';
    else if (task.priority === Priority.HIGH) bgColor = 'bg-red-100 dark:bg-red-900/50 border-red-500 dark:border-red-700 text-red-800 dark:text-red-100';
    else if (task.priority === Priority.MEDIUM) bgColor = 'bg-orange-100 dark:bg-orange-900/50 border-orange-500 dark:border-orange-700 text-orange-800 dark:text-orange-100';

    const cursorClass = isBlocked ? 'cursor-not-allowed' : (isDraggingThis ? 'cursor-grabbing' : 'cursor-grab');

    return {
      top: `${startMinutes}px`,
      height: `${duration}px`,
      className: `absolute left-16 right-2 rounded-md border-l-4 p-1 text-xs shadow-sm overflow-hidden transition-all duration-100 ${bgColor} ${isDraggingThis ? 'opacity-80 scale-105 z-20 shadow-lg' : ''} ${cursorClass}`
    };
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && onVisible) {
          onVisible();
        }
      }, { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);


  return (
    <div ref={containerRef} className="pb-4 relative bg-white dark:bg-zinc-900 border-b-8 border-gray-100/50 dark:border-zinc-800">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">{getLabel()}</h2>
      </div>
      
      {allDayTasks.length > 0 && (
        <div className="border-b border-gray-100 dark:border-zinc-800 p-2 bg-gray-50/30 dark:bg-zinc-800/30">
          <div className="text-xs text-gray-400 font-semibold mb-1 px-2 uppercase tracking-wide">全天</div>
          <div className="space-y-1">
            {allDayTasks.map(task => {
              const isBlocked = blockedTaskIds.has(task.id);
              return (
              <div 
                key={task.id}
                onClick={(e) => onTaskClick(task, e)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border cursor-pointer ${task.completed ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-transparent' : 'bg-white dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 shadow-sm text-gray-800 dark:text-gray-200'}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${task.completed ? 'border-gray-400 bg-gray-400' : (task.priority === Priority.HIGH ? 'border-red-500' : 'border-indigo-500')}`} />
                {isBlocked ? <Lock size={14} className="text-gray-400"/> : <QuadrantIcon quadrant={task.quadrant} size={14} />}
                <span className={`truncate ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
              </div>
            )})}
          </div>
        </div>
      )}

      <div ref={timelineRef} className="relative" style={{ height: '1440px' }}> 
         {hours.map(hour => (
            <div key={hour} className="h-[60px] border-b border-gray-100 dark:border-zinc-800 flex items-start" onClick={() => onTimeSlotClick(`${hour.toString().padStart(2, '0')}:00`)}>
              <div className="w-14 text-right pr-2 text-xs text-gray-400 -mt-2">{hour.toString().padStart(2, '0')}:00</div>
            </div>
         ))}

         {getLabel().startsWith('今天') && <CurrentTimeIndicator />}

         <div className="absolute top-0 left-0 right-0 bottom-0">
            {timedTasks.map(task => {
               const style = getTaskStyle(task);
               const isDraggingThis = dragInfo?.task.id === task.id;
               const isBlocked = blockedTaskIds.has(task.id);

               let timePreview = null;
               if (isDraggingThis) {
                  const newStartMinutes = dragInfo.previewTop;
                  const newEndMinutes = newStartMinutes + dragInfo.previewHeight;
                  const formatTime = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
                  timePreview = <div className="absolute -top-5 text-xs bg-black text-white px-1.5 py-0.5 rounded-md">{formatTime(newStartMinutes)} - {formatTime(newEndMinutes)}</div>;
               }

               return (
                 <div
                   key={task.id}
                   className={`${style.className} flex items-start gap-1.5 relative pb-3`}
                   style={{ top: style.top, height: style.height }}
                   onMouseDown={(e) => handleDragStart(e, task, 'move')}
                 >
                   {timePreview}
                   <div 
                     className="flex-1 h-full cursor-pointer"
                     onClick={(e) => { e.stopPropagation(); onTaskClick(task, e); }}
                   >
                     {isBlocked ? <Lock size={10} className="text-current opacity-70"/> : <QuadrantIcon quadrant={task.quadrant} size={10} />}
                     <div className="font-semibold leading-tight truncate">{task.title}</div>
                   </div>
                   {!task.completed && !isBlocked && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize"
                        onMouseDown={(e) => { e.stopPropagation(); handleDragStart(e, task, 'resize'); }}
                      />
                   )}
                 </div>
               );
            })}
         </div>
      </div>
    </div>
  );
});

export const DayTimeView: React.FC<DayTimeViewProps> = ({
  currentDate,
  tasks,
  blockedTaskIds,
  onTaskClick,
  onTimeSlotClick,
  onDateChange,
  onUpdateTask
}) => {
  // FIX: Define state, refs, and effects
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const [days, setDays] = useState<Date[]>([]);
  
  useEffect(() => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);
    const initialDays = Array.from({ length: 5 }, (_, i) => new Date(today.getTime() + (i - 2) * 86400000));
    setDays(initialDays);
    isInitialLoad.current = true;
  }, [currentDate]);

  useLayoutEffect(() => {
    if (isInitialLoad.current && scrollRef.current && days.length > 0) {
      const todayEl = scrollRef.current.children[2];
      if (todayEl) {
        scrollRef.current.scrollTop = (todayEl as HTMLElement).offsetTop;
        isInitialLoad.current = false;
      }
    }
  }, [days]);

  // FIX: Define scroll handlers
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop < 200) {
      const firstDay = days[0];
      setDays(prev => [new Date(firstDay.getTime() - 86400000), ...prev]);
    }
    if (scrollHeight - scrollTop - clientHeight < 200) {
      const lastDay = days[days.length - 1];
      setDays(prev => [...prev, new Date(lastDay.getTime() + 86400000)]);
    }
  };
  
  const handleDayVisible = (day: Date) => {
    onDateChange(day);
  };

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-full overflow-y-auto bg-white dark:bg-zinc-900 relative custom-scrollbar"
    >
      {days.map(day => (
         <DayBlock 
            key={day.toISOString()}
            date={day}
            tasks={tasks}
            blockedTaskIds={blockedTaskIds}
            onTaskClick={onTaskClick}
            onTimeSlotClick={onTimeSlotClick}
            onUpdateTask={onUpdateTask}
            onVisible={() => { /* onDateChange is implicitly handled by App's state */ }}
         />
      ))}
    </div>
  );
};
