import React from 'react';
import { RecurringFrequency } from '../types';
import { Calendar, Clock } from 'lucide-react';
import { parseDate } from '../services/recurringService';

interface RecurringOptionsProps {
  frequency: RecurringFrequency;
  interval: number;
  weekDays: number[];
  startDate: string;
  endDate: string;
  isRequired?: boolean;
  onChange: (updates: any) => void;
}

export const RecurringOptions: React.FC<RecurringOptionsProps> = ({
  frequency, interval, weekDays, startDate, endDate, isRequired, onChange
}) => {
  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  const toggleWeekDay = (dayIndex: number) => {
    if (weekDays.includes(dayIndex)) {
      if (weekDays.length > 1) onChange({ weekDays: weekDays.filter(d => d !== dayIndex) });
    } else {
      onChange({ weekDays: [...weekDays, dayIndex].sort() });
    }
  };

  const handleMonthDayChange = (day: number) => {
    const currentStart = parseDate(startDate);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const maxDays = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, maxDays);
    const newDate = new Date(year, month, validDay);
    const offset = newDate.getTimezoneOffset() * 60000;
    const newDateStr = new Date(newDate.getTime() - offset).toISOString().split('T')[0];
    onChange({ startDate: newDateStr });
  };

  const currentDayOfMonth = parseDate(startDate).getDate();

  return (
    <div className="space-y-3">
      {/* 频率选择器 */}
      <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl">
        {[
          { id: 'daily', label: '每天' },
          { id: 'weekly', label: '每周' },
          { id: 'monthly', label: '每月' },
          { id: 'custom', label: '间隔' },
        ].map(opt => (
          <button key={opt.id} type="button"
            onClick={() => onChange({ frequency: opt.id })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              frequency === opt.id
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* 间隔设置 */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5">
        <span className="text-sm text-gray-500 dark:text-zinc-400">每</span>
        <input type="number" min="1" max="99" value={interval}
          onChange={(e) => onChange({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 text-center font-semibold text-gray-800 dark:text-zinc-200 outline-none border-b border-gray-300 dark:border-zinc-600 focus:border-indigo-400 bg-transparent transition-colors" />
        <span className="text-sm text-gray-500 dark:text-zinc-400">
          {frequency === 'daily' || frequency === 'custom' ? '天' : frequency === 'weekly' ? '周' : '月'}
        </span>
      </div>

      {/* 每月重复日 */}
      {frequency === 'monthly' && (
        <div className="flex items-center gap-3 text-sm bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-4 py-2.5">
          <span className="text-gray-500 dark:text-zinc-400">在每月的</span>
          <select value={currentDayOfMonth} onChange={(e) => handleMonthDayChange(parseInt(e.target.value))}
            className="bg-white dark:bg-zinc-800 rounded-lg px-2.5 py-1 font-medium outline-none focus:ring-1 focus:ring-indigo-400 text-sm">
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
          <span className="text-gray-500 dark:text-zinc-400">重复</span>
        </div>
      )}

      {/* 每周重复日 */}
      {frequency === 'weekly' && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">重复日</span>
          <div className="flex justify-between gap-1.5">
            {weekDayLabels.map((label, idx) => (
              <button key={idx} type="button" onClick={() => toggleWeekDay(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all duration-200 ${
                  weekDays.includes(idx)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结束日期 */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">结束日期</span>
          {isRequired && !endDate && <span className="text-red-400 text-xs">*</span>}
        </div>
        <input type="date" value={endDate}
          onChange={(e) => onChange({ endDate: e.target.value })}
          className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl px-3 py-1.5 text-sm outline-none border border-transparent focus:border-indigo-300 dark:color-scheme-dark" />
      </div>
    </div>
  );
};
