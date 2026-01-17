
import React from 'react';
import { RecurringRule } from '../types';
import { X, Repeat, Trash2, Calendar, Edit2 } from 'lucide-react';
import { Button } from './Button';

interface RecurringManagerProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RecurringRule[];
  onDeleteRule: (id: string) => void;
  onEditRule: (rule: RecurringRule) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({
  isOpen,
  onClose,
  rules,
  onDeleteRule,
  onEditRule
}) => {
  if (!isOpen) return null;

  // 生成规则描述文本
  const getFrequencyText = (rule: RecurringRule) => {
    if (rule.frequency === 'daily') return `每 ${rule.interval} 天`;
    if (rule.frequency === 'monthly') return `每 ${rule.interval} 个月`;
    if (rule.frequency === 'custom') return `每 ${rule.interval} 天`;
    if (rule.frequency === 'weekly') {
      const days = rule.weekDays?.map(d => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、');
      return `每 ${rule.interval} 周 (${days})`;
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Repeat className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">周期任务管理</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {rules.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>暂无周期任务设置</p>
            </div>
          ) : (
            rules.map(rule => (
              <div
                key={rule.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {rule.title}
                    </h4>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => onEditRule(rule)}
                      className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      title="编辑规则"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteRule(rule.id)}
                      className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="删除规则及后续任务"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 cursor-default">
                   <div className="flex items-center gap-2">
                      <Repeat size={14} />
                      <span>{getFrequencyText(rule)}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span>开始: {rule.startDate} {rule.endDate ? `| 结束: ${rule.endDate}` : ''}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50 text-right">
           <Button variant="secondary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};
