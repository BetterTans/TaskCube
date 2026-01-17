
import React from 'react';
import { RecurringFrequency } from '../types';
import { Calendar, Clock } from 'lucide-react';

interface RecurringOptionsProps {
  frequency: RecurringFrequency;
  interval: number;
  weekDays: number[];
  startDate: string;
  endDate: string;
  onChange: (updates: any) => void;
}

export const RecurringOptions: React.FC<RecurringOptionsProps> = ({
  frequency,
  interval,
  weekDays,
  startDate,
  endDate,
  onChange
}) => {
  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  // 切换选中星期几 (至少保留一个)
  const toggleWeekDay = (dayIndex: number) => {
    if (weekDays.includes(dayIndex)) {
      if (weekDays.length > 1) {
        onChange({ weekDays: weekDays.filter(d => d !== dayIndex) });
      }
    } else {
      onChange({ weekDays: [...weekDays, dayIndex].sort() });
    }
  };

  // 处理每月日期的变化（自动调整到该月合法天数）
  const handleMonthDayChange = (day: number) => {
    const currentStart = new Date(startDate);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const maxDays = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, maxDays);
    
    const newDate = new Date(year, month, validDay);
    const offset = newDate.getTimezoneOffset() * 60000;
    const newDateStr = new Date(newDate.getTime() - offset).toISOString().split('T')[0];
    onChange({ startDate: newDateStr });
  };

  const currentDayOfMonth = new Date(startDate).getDate();

  return (
    <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-100 space-y-5 shadow-sm">
      {/* 频率选择器 */}
      <div className="flex bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
        {[
          { id: 'daily', label: '每天' },
          { id: 'weekly', label: '每周' },
          { id: 'monthly', label: '每月' },
          { id: 'custom', label: '间隔' },
        ].map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange({ frequency: opt.id })}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-all ${
              frequency === opt.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 间隔设置 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-sm text-gray-500">每</span>
          <input 
            type="number" 
            min="1" 
            max="99"
            value={interval}
            onChange={(e) => onChange({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
            className="w-12 text-center font-semibold text-gray-800 outline-none border-b border-gray-200 focus:border-indigo-500 transition-colors"
          />
          <span className="text-sm text-gray-500">
            {frequency === 'daily' || frequency === 'custom' ? '天' : 
             frequency === 'weekly' ? '周' : '月'}
          </span>
        </div>

        {/* 开始日期 - 如果是周频率，隐藏此项，由下方星期选择器决定逻辑 */}
        {frequency !== 'weekly' && (
          <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors group">
            <Calendar size={16} className="text-gray-400 group-hover:text-indigo-500" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="flex-1 text-sm bg-transparent outline-none text-gray-700 font-medium cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 月频率特有：几号 */}
      {frequency === 'monthly' && (
        <div className="flex items-center gap-3 text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-gray-500">每月</span>
          <select 
            value={currentDayOfMonth} 
            onChange={(e) => handleMonthDayChange(parseInt(e.target.value))}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1 font-medium outline-none focus:border-indigo-500"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}号</option>
            ))}
          </select>
          <span className="text-gray-500">重复</span>
        </div>
      )}

      {/* 周频率特有：星期几选择器 */}
      {frequency === 'weekly' && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">重复时间</label>
          <div className="flex justify-between gap-2">
            {weekDayLabels.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleWeekDay(idx)}
                className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 ${
                  weekDays.includes(idx)
                    ? 'bg-indigo-600 text-white shadow-md scale-110'
                    : 'bg-white border border-gray-200 text-gray-400 hover:border-indigo-200 hover:text-indigo-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结束日期 */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">结束日期 (可选)</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="text-sm bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 outline-none text-gray-600 pb-0.5"
            />
        </div>
      </div>
    </div>
  );
};
