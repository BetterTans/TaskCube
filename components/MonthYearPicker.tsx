
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthYearPickerProps {
  currentDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

/**
 * 月份/年份快速选择器组件
 */
export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ currentDate, onChange, onClose }) => {
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());

  const months = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];

  const handleMonthClick = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    onChange(newDate);
    onClose();
  };

  return (
    <div className="absolute top-12 left-6 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-4 w-72 animate-in fade-in zoom-in-95 duration-200">
      {/* 年份切换头部 */}
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setViewYear(y => y - 1)}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-lg text-gray-800">{viewYear}年</span>
        <button 
          onClick={() => setViewYear(y => y + 1)}
          className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* 月份网格 */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((m, idx) => {
          const isSelected = viewYear === currentDate.getFullYear() && idx === currentDate.getMonth();
          return (
            <button
              key={m}
              onClick={() => handleMonthClick(idx)}
              className={`py-2 rounded-lg text-sm transition-colors ${
                isSelected 
                  ? 'bg-indigo-600 text-white font-medium' 
                  : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
      
      {/* 点击外部关闭遮罩 */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};
