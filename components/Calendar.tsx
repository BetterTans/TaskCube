
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, Priority } from '../types';

// 注意：此组件为基础日历组件，实际应用中已使用功能更强大的 FullCalendar.tsx 替代
// 保留此文件作为简单的日历选择器参考

interface CalendarProps {
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks, selectedDate, onSelectDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 是周日

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDate = (day: number) => {
    const d = new Date(year, month, day);
    // 处理时区偏移以确保获得正确的本地 YYYY-MM-DD
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  // 渲染日期下方的任务指示点
  const getTaskIndicators = (dateStr: string) => {
    const dayTasks = tasks.filter(t => t.date === dateStr && !t.completed);
    if (dayTasks.length === 0) return null;

    const hasHigh = dayTasks.some(t => t.priority === Priority.HIGH);
    const hasMedium = dayTasks.some(t => t.priority === Priority.MEDIUM);
    const hasLow = dayTasks.some(t => t.priority === Priority.LOW);

    return (
      <div className="flex gap-0.5 mt-1 justify-center">
        {hasHigh && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
        {!hasHigh && hasMedium && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
        {!hasHigh && !hasMedium && hasLow && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
        {dayTasks.length > 1 && <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    // 填充月初空白天数
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-14" />);
    }

    // 渲染实际天数
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(day);
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      days.push(
        <button
          key={day}
          onClick={() => onSelectDate(dateStr)}
          className={`h-14 w-full rounded-lg flex flex-col items-center justify-start pt-2 transition-all relative
            ${isSelected 
              ? 'bg-indigo-600 text-white shadow-md' 
              : 'hover:bg-indigo-50 text-gray-700'
            }
            ${isToday && !isSelected ? 'text-indigo-600 font-bold bg-indigo-50/50' : ''}
          `}
        >
          <span className={`text-sm ${isToday && !isSelected ? 'font-bold' : ''}`}>{day}</span>
          {getTaskIndicators(dateStr)}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-bold text-gray-800">
          {year}年 {monthNames[month]}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
};
