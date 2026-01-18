import React from 'react';
import { RecurringFrequency } from '../types';
import { Calendar, Clock } from 'lucide-react';
import { parseDate } from '../services/recurringService';

/**
 * RecurringOptionsProps 接口定义了周期性选项组件的属性。
 * @property {RecurringFrequency} frequency - 当前选择的重复频率。
 * @property {number} interval - 重复的间隔。
 * @property {number[]} weekDays - 当频率为 'weekly' 时，选中的星期几数组。
 * @property {string} startDate - 周期规则的开始日期。
 * @property {string} endDate - 周期规则的结束日期。
 * @property {boolean} [isRequired] - 结束日期是否为必填项。
 * @property {function} onChange - 当任何选项改变时调用的回调。
 */
interface RecurringOptionsProps {
  frequency: RecurringFrequency;
  interval: number;
  weekDays: number[];
  startDate: string;
  endDate: string;
  isRequired?: boolean;
  onChange: (updates: any) => void;
}

/**
 * 周期性选项配置组件。
 * 在任务详情模态框中，当用户启用“重复”选项时，此组件会被渲染，
 * 用于配置详细的重复规则，如频率、间隔、星期几等。
 */
export const RecurringOptions: React.FC<RecurringOptionsProps> = ({
  frequency,
  interval,
  weekDays,
  startDate,
  endDate,
  isRequired,
  onChange
}) => {
  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  /**
   * 切换选中的星期几。
   * @param {number} dayIndex - 被点击的星期索引 (0-6)。
   */
  const toggleWeekDay = (dayIndex: number) => {
    if (weekDays.includes(dayIndex)) {
      // 如果是最后一个选中的星期，则不允许取消，保证至少有一个
      if (weekDays.length > 1) {
        onChange({ weekDays: weekDays.filter(d => d !== dayIndex) });
      }
    } else {
      // 添加新的星期并排序
      onChange({ weekDays: [...weekDays, dayIndex].sort() });
    }
  };

  /**
   * 处理每月重复日期的变化。
   * 会自动将日期调整到当月的合法天数范围内（例如，选择31号，但当前月份只有30天，则自动变为30号）。
   * @param {number} day - 用户选择的日期（1-31）。
   */
  const handleMonthDayChange = (day: number) => {
    const currentStart = parseDate(startDate);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    // 获取当月最大天数
    const maxDays = new Date(year, month + 1, 0).getDate();
    const validDay = Math.min(day, maxDays);
    
    const newDate = new Date(year, month, validDay);
    // 转换为 YYYY-MM-DD 格式
    const offset = newDate.getTimezoneOffset() * 60000;
    const newDateStr = new Date(newDate.getTime() - offset).toISOString().split('T')[0];
    onChange({ startDate: newDateStr });
  };

  const currentDayOfMonth = parseDate(startDate).getDate();

  return (
    <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl space-y-4 border border-gray-200 dark:border-zinc-800">
      {/* 频率选择器 (每天, 每周, 每月, 间隔) */}
      <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-full">
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
            className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              frequency === opt.id 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 间隔设置输入框 */}
      <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg">
        <span className="text-sm text-gray-500 dark:text-gray-400">每</span>
        <input 
          type="number" 
          min="1" 
          max="99"
          value={interval}
          onChange={(e) => onChange({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-12 text-center font-semibold text-gray-800 dark:text-gray-200 outline-none border-b-2 border-gray-200 dark:border-zinc-700 focus:border-indigo-500 bg-transparent transition-colors"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {frequency === 'daily' || frequency === 'custom' ? '天' : 
           frequency === 'weekly' ? '周' : '月'}
        </span>
      </div>

      {/* 每月重复的特定选项：选择几号 */}
      {frequency === 'monthly' && (
        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-lg">
          <span className="text-gray-500 dark:text-gray-400">在每月的</span>
          <select 
            value={currentDayOfMonth} 
            onChange={(e) => handleMonthDayChange(parseInt(e.target.value))}
            className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 font-medium outline-none focus:border-indigo-500"
          >
            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
              <option key={d} value={d}>{d}日</option>
            ))}
          </select>
          <span className="text-gray-500 dark:text-gray-400">重复</span>
        </div>
      )}

      {/* 每周重复的特定选项：选择星期几 */}
      {frequency === 'weekly' && (
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">重复日</label>
          <div className="flex justify-between gap-1 sm:gap-2">
            {weekDayLabels.map((label, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleWeekDay(idx)}
                className={`w-9 h-9 rounded-full text-xs font-semibold flex items-center justify-center transition-all duration-200 ${
                  weekDays.includes(idx)
                    ? 'bg-indigo-600 text-white shadow-md scale-105'
                    : 'bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-zinc-600 hover:text-indigo-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结束日期选择 */}
      <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              结束日期
              {isRequired && !endDate && <span className="text-red-500 ml-1 font-bold">*</span>}
            </label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="text-sm bg-transparent outline-none text-gray-600 dark:text-gray-400 text-right dark:color-scheme-dark"
            />
        </div>
      </div>
    </div>
  );
};