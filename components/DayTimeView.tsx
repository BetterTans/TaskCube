import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Task, Priority, EisenhowerQuadrant } from '../types';
import { Plus, Zap, Star, Bell, Coffee } from 'lucide-react';

interface DayTimeViewProps {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onTimeSlotClick: (time: string) => void;
  onToggleTask: (id: string) => void;
  onDateChange: (date: Date) => void;
  onUpdateTask: (task: Partial<Task>) => void;
}

const QuadrantIcon = ({ quadrant, size = 12 }: { quadrant?: EisenhowerQuadrant, size?: number }) => {
  const q = quadrant || EisenhowerQuadrant.Q2;
  const icons = {
    [EisenhowerQuadrant.Q1]: <Zap size={size} className="fill-red-500 text-red-500" />,
    [EisenhowerQuadrant.Q2]: <Star size={size} className="fill-blue-500 text-blue-500" />,
    [EisenhowerQuadrant.Q3]: <Bell size={size} className="fill-orange-500 text-orange-500" />,
    [EisenhowerQuadrant.Q4]: <Coffee size={size} className="fill-gray-400 text-gray-400" />,
  };
  return <span className="flex-shrink-0">{icons[q]}</span>;
};

// 当前时间指示线组件
const CurrentTimeIndicator = () => {
    const [minutes, setMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setMinutes(now.getHours() * 60 + now.getMinutes());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div 
            className="absolute left-14 right-0 border-t-2 border-red-500 z-20 pointer-events-none transition-[top] duration-500"
            style={{ top: `${minutes}px` }}
        />
    );
};

// 单日区块组件
const DayBlock = React.memo(({ 
  date, 
  tasks, 
  onTaskClick, 
  onTimeSlotClick, 
  onUpdateTask,
  onVisible 
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
  onTimeSlotClick: (time: string) => void;
  onUpdateTask: (task: Partial<Task>) => void;
  onVisible?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragInfo, setDragInfo] = useState<{
    type: 'move' | 'resize';
    task: Task;
    initialY: number;
    initialTop: number;
    initialHeight: number;
    previewTop: number;
    previewHeight: number;
  } | null>(null);
  
  const offset = date.getTimezoneOffset() * 60000;
  const currentDayStart = new Date(date.getTime() - offset);
  currentDayStart.setUTCHours(0, 0, 0, 0);
  const currentDayEnd = new Date(currentDayStart);
  currentDayEnd.setUTCHours(23, 59, 59, 999);
  
  const dateStr = currentDayStart.toISOString().split('T')[0];

  const dayTasks = useMemo(() => tasks.filter(t => {
      const taskStart = new Date(t.date + 'T00:00:00Z');
      const taskEnd = t.endDate ? new Date(t.endDate + 'T23:59:59Z') : taskStart;
      return currentDayStart <= taskEnd && currentDayEnd >= taskStart;
  }), [tasks, dateStr]);

  const allDayTasks = dayTasks.filter(t => !t.startTime);
  const timedTasks = dayTasks.filter(t => !!t.startTime && t.date === dateStr);
  
  // --- Drag & Drop Logic ---
  const handleDragStart = (e: React.MouseEvent, task: Task, type: 'move' | 'resize') => {
    if (task.completed) return;
    e.preventDefault();
    e.stopPropagation();

    const [h, m] = task.startTime!.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const height = task.duration || 60;
    
    setDragInfo({
        type,
        task,
        initialY: e.clientY,
        initialTop: startMinutes,
        initialHeight: height,
        previewTop: startMinutes,
        previewHeight: height
    });
  };

  useEffect(() => {
    if (!dragInfo) return;
    
    const handleMouseMove = (e: MouseEvent) => {
        setDragInfo(prev => {
           if (!prev) return null;
           const deltaY = e.clientY - prev.initialY;
           if (prev.type === 'move') {
               let newTop = prev.initialTop + deltaY;
               newTop = Math.round(newTop / 15) * 15;
               newTop = Math.max(0, Math.min(newTop, 24 * 60 - prev.initialHeight));
               return { ...prev, previewTop: newTop };
           } else { // resize
               let newHeight = prev.initialHeight + deltaY;
               newHeight = Math.max(15, Math.round(newHeight / 15) * 15);
               newHeight = Math.min(newHeight, 24 * 60 - prev.initialTop);
               return { ...prev, previewHeight: newHeight };
           }
        });
    };
    
    const handleMouseUp = () => {
        if (!dragInfo) return;
        
        if (dragInfo.type === 'move') {
            const newHours = Math.floor(dragInfo.previewTop / 60);
            const newMinutes = dragInfo.previewTop % 60;
            const newStartTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
            if(newStartTime !== dragInfo.task.startTime) {
                onUpdateTask({ id: dragInfo.task.id, startTime: newStartTime });
            }
        } else { // resize
            if (dragInfo.previewHeight !== dragInfo.task.duration) {
                onUpdateTask({ id: dragInfo.task.id, duration: dragInfo.previewHeight });
            }
        }
        setDragInfo(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, onUpdateTask]);

  const getLabel = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const month = target.getMonth() + 1;
    const d = target.getDate();
    const weekDays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    const weekDay = weekDays[target.getDay()];
    
    if (diffDays === -2) return `前天 · ${month}月${d}日`;
    if (diffDays === -1) return `昨天 · ${month}月${d}日`;
    if (diffDays === 0) return `今天 · ${month}月${d}日`;
    if (diffDays === 1) return `明天 · ${month}月${d}日`;
    if (diffDays === 2) return `后天 · ${month}月${d}日`;
    return `${month}月${d}日 ${weekDay}`;
  };

  const getTaskStyle = (task: Task) => {
    if (!task.startTime) return {};
    
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

    return {
      top: `${startMinutes}px`,
      height: `${duration}px`,
      className: `absolute left-2 right-2 rounded-md border-l-4 p-1 text-xs shadow-sm overflow-hidden transition-all duration-100 ${bgColor} ${isDraggingThis ? 'opacity-80 scale-105 z-20 shadow-lg cursor-grabbing' : 'cursor-grab'}`
    };
  };

  const hours = Array.from({ length: 25 }, (_, i) => i);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && onVisible) {
        onVisible();
      }
    }, { threshold: 0.3 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={containerRef} className="pb-4 relative bg-white dark:bg-zinc-900 border-b-8 border-gray-100/50 dark:border-zinc-800">
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-2">
        <span className={`text-lg font-bold ${getLabel().includes('今天') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
           {getLabel()}
        </span>
      </div>

      {allDayTasks.length > 0 && (
        <div className="border-b border-gray-100 dark:border-zinc-800 p-2 bg-gray-50/30 dark:bg-zinc-800/30">
          <div className="text-xs text-gray-400 font-semibold mb-1 px-2 uppercase tracking-wide">全天</div>
          <div className="space-y-1">
            {allDayTasks.map(task => (
              <div 
                key={task.id}
                onClick={(e) => onTaskClick(task, e)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border cursor-pointer ${task.completed ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-transparent' : 'bg-white dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 shadow-sm text-gray-800 dark:text-gray-200'}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${task.completed ? 'border-gray-400 bg-gray-400' : (task.priority === Priority.HIGH ? 'border-red-500' : 'border-indigo-500')}`} />
                <QuadrantIcon quadrant={task.quadrant} size={14} />
                <span className={`truncate ${task.completed ? 'line-through' : ''}`}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={timelineRef} className="relative" style={{ height: '1500px' }}> 
         {hours.map(h => (
            <div 
              key={h} 
              className="absolute w-full border-b border-gray-100 dark:border-zinc-800 flex items-start group"
              style={{ top: `${h * 60}px`, height: '60px' }}
              onClick={() => onTimeSlotClick(`${h.toString().padStart(2, '0')}:00`)}
            >
               <div className="w-14 shrink-0 text-right pr-3 text-xs text-gray-400 dark:text-zinc-600 -mt-2 bg-white dark:bg-zinc-900 relative z-20">
                  {h.toString().padStart(2, '0')}:00
               </div>
               <div className="flex-1 h-full relative group-hover:bg-gray-50/50 dark:group-hover:bg-zinc-800/30 transition-colors">
                  {h < 24 && (
                    <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 text-indigo-400 pointer-events-none">
                        <Plus size={16} />
                    </div>
                  )}
               </div>
            </div>
         ))}

         {getLabel().startsWith('今天') && <CurrentTimeIndicator />}

         <div className="absolute top-0 left-14 right-0 bottom-0">
            {timedTasks.map(task => {
               const style = getTaskStyle(task);
               return (
                 <div
                   key={task.id}
                   className={`${style.className} flex items-start gap-1.5`}
                   style={{ top: style.top, height: style.height }}
                   onMouseDown={(e) => handleDragStart(e, task, 'move')}
                 >
                   <div 
                     className="flex-1 h-full"
                     onClick={(e) => { e.stopPropagation(); onTaskClick(task, e); }}
                   >
                     <QuadrantIcon quadrant={task.quadrant} size={10} />
                     <div className="font-semibold leading-tight truncate">{task.title}</div>
                   </div>
                   {!task.completed && (
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                        onMouseDown={(e) => handleDragStart(e, task, 'resize')}
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
  onTaskClick,
  onTimeSlotClick,
  onDateChange,
  onUpdateTask
}) => {
  const [days, setDays] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastReportedDateRef = useRef<Date | null>(null);

  useEffect(() => {
    const initDays = [];
    const base = new Date(currentDate);
    base.setHours(0,0,0,0);
    
    for (let i = -1; i <= 1; i++) {
       const d = new Date(base);
       d.setDate(d.getDate() + i);
       initDays.push(d);
    }
    setDays(initDays);
    setIsInitialized(true);
    
    setTimeout(() => {
        if (scrollRef.current) {
           const children = scrollRef.current.children;
           if (children[1]) {
              const el = children[1] as HTMLElement;
              const hour = new Date().getHours();
              const offset = Math.max(0, (hour - 1) * 60); 
              scrollRef.current.scrollTop = el.offsetTop + offset;
           }
        }
    }, 100);
  }, []); 

  useEffect(() => {
    if (!isInitialized) return;

    if (lastReportedDateRef.current && 
        currentDate.toDateString() === lastReportedDateRef.current.toDateString()) {
        return;
    }

    const target = new Date(currentDate);
    target.setHours(0,0,0,0);
    
    const idx = days.findIndex(d => d.toDateString() === target.toDateString());
    
    if (idx !== -1 && scrollRef.current) {
        const el = scrollRef.current.children[idx] as HTMLElement;
        if (el) {
           const hour = new Date().getHours();
           const offset = target.toDateString() === new Date().toDateString() ? Math.max(0, (hour - 1) * 60) : 480; 
           el.scrollIntoView({ behavior: 'auto', block: 'start' });
           if (target.toDateString() === new Date().toDateString()) {
              scrollRef.current.scrollTop = el.offsetTop + offset;
           } else {
               scrollRef.current.scrollTop = el.offsetTop + 480;
           }
        }
    } else {
        const initDays = [];
        for (let i = -1; i <= 1; i++) {
           const d = new Date(target);
           d.setDate(d.getDate() + i);
           initDays.push(d);
        }
        setDays(initDays);
        setTimeout(() => {
            if (scrollRef.current && scrollRef.current.children[1]) {
                const el = scrollRef.current.children[1] as HTMLElement;
                const offset = target.toDateString() === new Date().toDateString() ? Math.max(0, (new Date().getHours() - 1) * 60) : 480;
                scrollRef.current.scrollTop = el.offsetTop + offset;
            }
        }, 0);
    }
  }, [currentDate, isInitialized, days]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    if (scrollTop + clientHeight > scrollHeight - 500) {
       setDays(prev => {
          const last = prev[prev.length - 1];
          const next = new Date(last);
          next.setDate(next.getDate() + 1);
          return [...prev, next];
       });
    }

    if (scrollTop < 200) {
       setDays(prev => {
          const first = prev[0];
          const newPrev = new Date(first);
          newPrev.setDate(newPrev.getDate() - 1);
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
  }, [days]);

  const handleDayVisible = useCallback((date: Date) => {
     lastReportedDateRef.current = date;
     onDateChange(date);
  }, [onDateChange]);

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
            onTaskClick={onTaskClick}
            onTimeSlotClick={onTimeSlotClick}
            onUpdateTask={onUpdateTask}
            onVisible={() => handleDayVisible(day)}
         />
      ))}
    </div>
  );
};