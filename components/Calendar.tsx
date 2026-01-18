import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task, Priority } from '../types';
import { parseDate } from '../services/recurringService';

// 注意：此组件为基础日历组件，实际应用中已使用功能更强大的 FullCalendar.tsx 替代。
// 保留此文件作为简单的日历选择器或未来小型日历部件的参考。

/**
 * CalendarProps 接口定义了基础日历组件的属性。
 * @property {Task[]} tasks - 用于在日期下方显示指示点的任务数组。
 * @property {string} selectedDate - 当前选中的日期字符串 (YYYY-MM-DD)。
 * @property {function} onSelectDate - 当用户点击选择一个新日期时调用的回调。
 */
interface CalendarProps {
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

/**
 * 一个简单的、非滚动的月份日历视图组件。
 */
export const Calendar: React.FC<CalendarProps> = ({ tasks, selectedDate, onSelectDate }) => {
  // 组件内部状态，管理当前显示的月份
  const [currentDate, setCurrentDate] = useState(parseDate(selectedDate));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 计算当前月份的天数和第一天是星期几
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 是周日

  // 导航到上个月
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  // 导航到下个月
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 格式化日期数字为 'YYYY-MM-DD' 字符串
  const formatDate = (day: number) => {
    const d = new Date(year, month, day);
    // 处理时区偏移以确保获得正确的本地 YYYY-MM-DD
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };

  /**
   * 获取并渲染指定日期下方的任务指示点。
   * @param {string} dateStr - 日期字符串 'YYYY-MM-DD'。
   * @returns {React.ReactNode} - 任务指示点的 JSX 或 null。
   */
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

  // 渲染日历网格中的所有日期单元格
  const renderDays = () => {
    const days = [];
    // 填充月初的空白天数
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-14" />);
    }

    // 渲染月份中的实际天数
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
      {/* 日历头部：月份和导航 */}
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

      {/* 星期标签 */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
};
