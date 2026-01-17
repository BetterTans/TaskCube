
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Task, Priority } from '../types';
import { Plus } from 'lucide-react';

interface DayTimeViewProps {
  currentDate: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTimeSlotClick: (time: string) => void;
  onToggleTask: (id: string) => void;
  onDateChange: (date: Date) => void;
}

// 当前时间指示线组件
// 每分钟更新一次位置
const CurrentTimeIndicator = () => {
    const [minutes, setMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setMinutes(now.getHours() * 60 + now.getMinutes());
        }, 60000); // 每分钟更新
        return () => clearInterval(interval);
    }, []);

    // 渲染一条红线，位置根据分钟数绝对定位
    // 注意：之前请求中去掉了红点，这里只保留红线
    return (
        <div 
            className="absolute left-14 right-0 border-t-2 border-red-500 z-20 pointer-events-none transition-[top] duration-500"
            style={{ top: `${minutes}px` }}
        />
    );
};

// 单日区块组件：包含全天任务区和时间轴区
const DayBlock = React.memo(({ 
  date, 
  tasks, 
  onTaskClick, 
  onTimeSlotClick, 
  onVisible 
}: {
  date: Date;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTimeSlotClick: (time: string) => void;
  onVisible?: () => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 筛选当天的任务
  const offset = date.getTimezoneOffset() * 60000;
  const dateStr = new Date(date.getTime() - offset).toISOString().split('T')[0];

  const dayTasks = useMemo(() => tasks.filter(t => t.date === dateStr), [tasks, dateStr]);
  const allDayTasks = dayTasks.filter(t => !t.startTime);
  const timedTasks = dayTasks.filter(t => !!t.startTime);

  // 生成相对日期标签 (今天/明天/昨天等)
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

  // 计算时间轴任务的位置和样式
  const getTaskStyle = (task: Task) => {
    if (!task.startTime) return {};
    const [h, m] = task.startTime.split(':').map(Number);
    const startMinutes = h * 60 + m;
    const duration = task.duration || 60;
    
    let bgColor = 'bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-700 text-blue-800 dark:text-blue-100';
    if (task.completed) bgColor = 'bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600 text-gray-400 dark:text-gray-500';
    else if (task.priority === Priority.HIGH) bgColor = 'bg-red-100 dark:bg-red-900/50 border-red-500 dark:border-red-700 text-red-800 dark:text-red-100';
    else if (task.priority === Priority.MEDIUM) bgColor = 'bg-orange-100 dark:bg-orange-900/50 border-orange-500 dark:border-orange-700 text-orange-800 dark:text-orange-100';

    return {
      top: `${startMinutes}px`, // 1分钟 = 1像素
      height: `${duration}px`,
      className: `absolute left-2 right-2 rounded-md border-l-4 pl-2 py-1 text-xs shadow-sm overflow-hidden cursor-pointer transition-all hover:brightness-95 z-10 ${bgColor}`
    };
  };

  const hours = Array.from({ length: 25 }, (_, i) => i); // 0 到 24 点

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
      {/* 粘性头部 */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 dark:border-zinc-800 shadow-sm flex items-center gap-2">
        <span className={`text-lg font-bold ${getLabel().includes('今天') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
           {getLabel()}
        </span>
      </div>

      {/* 全天任务区域 */}
      {allDayTasks.length > 0 && (
        <div className="border-b border-gray-100 dark:border-zinc-800 p-2 bg-gray-50/30 dark:bg-zinc-800/30">
          <div className="text-xs text-gray-400 font-semibold mb-1 px-2 uppercase tracking-wide">全天</div>
          <div className="space-y-1">
            {allDayTasks.map(task => (
              <div 
                key={task.id}
                onClick={() => onTaskClick(task)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer ${task.completed ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400 border-transparent' : 'bg-white dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 shadow-sm text-gray-800 dark:text-gray-200'}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${task.completed ? 'border-gray-400 bg-gray-400' : (task.priority === Priority.HIGH ? 'border-red-500' : 'border-indigo-500')}`} />
                <span className={task.completed ? 'line-through' : ''}>{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 24小时时间轴网格 */}
      <div className="relative" style={{ height: '1500px' }}> 
         {/* 渲染每一个小时的刻度线 */}
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

         {/* 如果是今天，渲染红线 */}
         {getLabel().startsWith('今天') && <CurrentTimeIndicator />}

         {/* 渲染时间段任务 */}
         <div className="absolute top-0 left-14 right-0 bottom-0 pointer-events-none">
            {timedTasks.map(task => {
               const style = getTaskStyle(task);
               return (
                 <div
                   key={task.id}
                   className={`${style.className} pointer-events-auto`}
                   style={{ top: style.top, height: style.height }}
                   onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                 >
                   <div className="font-semibold leading-tight truncate">{task.title}</div>
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
  onDateChange
}) => {
  const [days, setDays] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const lastReportedDateRef = useRef<Date | null>(null);

  // 初始化加载：前一天、今天、后一天
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
    
    // 自动滚动到当前时间（早上8点或现在）
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

  // 处理外部日期跳转
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
           // 如果是今天跳到当前时间，否则跳到早上8点
           const offset = target.toDateString() === new Date().toDateString() ? Math.max(0, (hour - 1) * 60) : 480; 
           el.scrollIntoView({ behavior: 'auto', block: 'start' });
           if (target.toDateString() === new Date().toDateString()) {
              scrollRef.current.scrollTop = el.offsetTop + offset;
           } else {
               scrollRef.current.scrollTop = el.offsetTop + 480;
           }
        }
    } else {
        // 重置列表
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
  }, [currentDate]);

  // 无限滚动逻辑（垂直方向的日视图）
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // 加载下一天
    if (scrollTop + clientHeight > scrollHeight - 500) {
       setDays(prev => {
          const last = prev[prev.length - 1];
          const next = new Date(last);
          next.setDate(next.getDate() + 1);
          return [...prev, next];
       });
    }

    // 加载前一天
    if (scrollTop < 200) {
       setDays(prev => {
          const first = prev[0];
          const newPrev = new Date(first);
          newPrev.setDate(newPrev.getDate() - 1);
          return [newPrev, ...prev];
       });
    }
  }, []);

  // 维持滚动位置
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
            onVisible={() => handleDayVisible(day)}
         />
      ))}
    </div>
  );
};
