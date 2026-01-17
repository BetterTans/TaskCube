
import React, { useState, useEffect, useRef, useLayoutEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Circle, Zap, Star, Bell, Coffee, ChevronDown } from 'lucide-react';
import { Task, Priority, EisenhowerQuadrant } from '../types';

interface FullCalendarProps {
  currentDate: Date;
  tasks: Task[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDateChange: (date: Date) => void;
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onShowMoreClick: (dateStr: string) => void;
}

// 辅助组件：渲染不同象限的小图标
const QuadrantIcon = ({ quadrant }: { quadrant: EisenhowerQuadrant }) => {
  switch (quadrant) {
    case EisenhowerQuadrant.Q1:
      return <Zap size={10} className="text-red-500 fill-red-500" />;
    case EisenhowerQuadrant.Q2:
      return <Star size={10} className="text-blue-500 fill-blue-500" />;
    case EisenhowerQuadrant.Q3:
      return <Bell size={10} className="text-orange-500 fill-orange-500" />;
    case EisenhowerQuadrant.Q4:
      return <Coffee size={10} className="text-gray-400 fill-gray-400" />;
    default:
      return null;
  }
};

interface MonthBlockProps {
  date: Date;
  tasks: Task[];
  onDateClick: (date: string) => void;
  onTaskClick: (task: Task) => void;
  onToggleTask: (id: string) => void;
  onVisible?: () => void;
}

// MonthBlock: 渲染单个月份的网格
// 使用 React.memo 避免不必要的重渲染
const MonthBlock = React.memo(({ date, tasks, onDateClick, onTaskClick, onToggleTask, onVisible }: MonthBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // 计算日历网格数据
  const calendarData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); 
    
    // 填充上个月的剩余天数
    const prevMonthDays = [];
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      const offset = d.getTimezoneOffset() * 60000;
      prevMonthDays.push({
        date: d,
        dateStr: new Date(d.getTime() - offset).toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    // 本月天数
    const currentMonthDays = [];
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const offset = d.getTimezoneOffset() * 60000;
      currentMonthDays.push({
        date: d,
        dateStr: new Date(d.getTime() - offset).toISOString().split('T')[0],
        isCurrentMonth: true
      });
    }

    // 填充下个月的天数以补齐最后一周
    const nextMonthDays = [];
    const totalSoFar = prevMonthDays.length + currentMonthDays.length;
    const remainingCells = (7 - (totalSoFar % 7)) % 7; 
    
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      const offset = d.getTimezoneOffset() * 60000;
      nextMonthDays.push({
        date: d,
        dateStr: new Date(d.getTime() - offset).toISOString().split('T')[0],
        isCurrentMonth: false
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [year, month]);

  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // 根据优先级获取任务样式
  const getTaskStyles = (task: Task) => {
    if (task.completed) return 'bg-gray-100 dark:bg-zinc-800 border-transparent text-gray-400 dark:text-gray-500 opacity-80';
    switch(task.priority) {
      case Priority.HIGH: return 'bg-red-50 dark:bg-red-900/30 text-gray-900 dark:text-gray-100 border-l-2 border-red-500';
      case Priority.MEDIUM: return 'bg-orange-50 dark:bg-orange-900/30 text-gray-900 dark:text-gray-100 border-l-2 border-orange-500';
      case Priority.LOW: return 'bg-blue-50 dark:bg-blue-900/30 text-gray-900 dark:text-gray-100 border-l-2 border-blue-500';
      default: return 'bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 border-l-2 border-gray-300 dark:border-zinc-600';
    }
  };

  // 交叉观察器：当该月份进入视野时通知父组件，以更新顶部标题
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && onVisible) {
        onVisible();
      }
    }, { threshold: 0.6 }); // 60% 可见时视为"当前月份"

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={containerRef} className="pb-8">
      {/* 粘性月标题：滚动时固定在顶部 */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-4 py-2 border-b border-gray-100 dark:border-zinc-800 shadow-sm flex items-center text-gray-900 dark:text-white font-bold text-lg">
        {year}年 {month + 1}月
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
         {calendarData.map((day, idx) => {
            const dayTasks = tasks.filter(t => t.date === day.dateStr);
            const isToday = day.dateStr === todayStr;
            const isCurrentMonth = day.isCurrentMonth;
            
            return (
              <div 
                key={`${day.dateStr}-${idx}`}
                onClick={() => onDateClick(day.dateStr)}
                className={`
                  relative flex flex-col pt-1 min-h-[120px] border-b border-r border-gray-50 dark:border-zinc-800/50 transition-colors
                  ${!isCurrentMonth ? 'bg-gray-50/20 dark:bg-zinc-900/50' : 'bg-white dark:bg-zinc-900 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}
                `}
              >
                <div className="flex justify-center mb-1 shrink-0">
                  <span className={`
                     text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                     ${isToday 
                       ? 'bg-red-500 text-white' 
                       : (isCurrentMonth ? 'text-gray-900 dark:text-gray-200' : 'text-gray-300 dark:text-zinc-600')
                     }
                   `}>
                     {day.date.getDate()}
                   </span>
                </div>
                 
                 <div className="flex-1 px-0.5 sm:px-1 space-y-1 pb-2 overflow-hidden">
                   {dayTasks.map(task => (
                      <div 
                        key={task.id} 
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        className={`
                          group flex items-center gap-0.5 sm:gap-1.5 p-0.5 sm:p-1 rounded-[3px] sm:rounded-[4px] text-[10px] cursor-pointer shadow-sm transition-all hover:brightness-95 border border-transparent
                          min-w-0 w-full
                          ${getTaskStyles(task)}
                        `}
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                          className={`shrink-0 ${task.completed ? 'text-gray-400 dark:text-gray-500' : (task.priority === Priority.HIGH ? 'text-red-500' : task.priority === Priority.MEDIUM ? 'text-orange-500' : 'text-blue-500')}`}
                        >
                           {task.completed ? <CheckCircle2 size={10} className="sm:w-3 sm:h-3" /> : <Circle size={10} className="sm:w-3 sm:h-3" />}
                        </button>
                        <span className={`flex-1 truncate font-medium leading-tight min-w-0 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </span>
                        {task.quadrant && <div className="shrink-0 hidden sm:block"><QuadrantIcon quadrant={task.quadrant} /></div>}
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
  onDateChange,
  onDateClick,
  onTaskClick,
  onToggleTask,
}) => {
  // months 数组维护当前渲染的月份列表，用于无限滚动
  const [months, setMonths] = useState<Date[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // 用于追踪上次上报给父组件的日期，防止循环更新
  const lastReportedDateRef = useRef<Date | null>(null);

  // 初始化：渲染当前月、上个月和下个月
  useEffect(() => {
    const initMonths = [];
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    for (let i = -1; i <= 2; i++) {
       initMonths.push(new Date(y, m + i, 1));
    }
    setMonths(initMonths);
    setIsInitialized(true);
  }, []); 

  // 处理外部传入的 currentDate 变化（例如点击了"今天"按钮或头部导航）
  useEffect(() => {
    if (!isInitialized) return;
    
    // 如果变化是由滚动触发的自身上报，则忽略
    if (lastReportedDateRef.current && 
        currentDate.getFullYear() === lastReportedDateRef.current.getFullYear() && 
        currentDate.getMonth() === lastReportedDateRef.current.getMonth()) {
        return;
    }

    // 检查目标日期是否已在当前渲染列表中
    const targetTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();
    const existingIndex = months.findIndex(d => d.getTime() === targetTime);

    if (existingIndex !== -1 && scrollRef.current) {
       // 如果存在，滚动到该位置
       const targetEl = scrollRef.current.children[existingIndex] as HTMLElement;
       if (targetEl) {
         targetEl.scrollIntoView({ behavior: 'auto' });
       }
    } else {
       // 如果不存在（跳跃较大），重置列表
       const initMonths = [];
       const y = currentDate.getFullYear();
       const m = currentDate.getMonth();
       for (let i = -1; i <= 2; i++) {
          initMonths.push(new Date(y, m + i, 1));
       }
       setMonths(initMonths);
       
       setTimeout(() => {
          if (scrollRef.current) {
             const targetEl = scrollRef.current.children[1] as HTMLElement; // 索引1是当前月
             if (targetEl) targetEl.scrollIntoView({ behavior: 'auto' });
          }
       }, 0);
    }
  }, [currentDate]);

  // 无限滚动逻辑
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // 向下滚动到底部附近，加载下个月
    if (scrollTop + clientHeight > scrollHeight - 200) {
      setMonths(prev => {
        const last = prev[prev.length - 1];
        const next = new Date(last.getFullYear(), last.getMonth() + 1, 1);
        return [...prev, next];
      });
    }

    // 向上滚动到顶部附近，加载上个月
    if (scrollTop < 100) {
      setMonths(prev => {
        const first = prev[0];
        const newPrev = new Date(first.getFullYear(), first.getMonth() - 1, 1);
        return [newPrev, ...prev];
      });
    }
  }, []);

  // 维持滚动位置：当在顶部插入新月份时，调整 scrollTop 以防止视觉跳动
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
      {/* 固定的星期表头 */}
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

      {/* 无限滚动容器 */}
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
             onDateClick={onDateClick}
             onTaskClick={onTaskClick}
             onToggleTask={onToggleTask}
             onVisible={() => handleMonthVisible(monthDate)}
           />
        ))}
      </div>
    </div>
  );
};
