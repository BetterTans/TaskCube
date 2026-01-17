
import React from 'react';
import { Task, Priority } from '../types';
import { X, Plus, Calendar as CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './Button';

interface DayTaskListModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreateTask: (dateStr: string) => void;
  onToggleTask: (id: string) => void;
}

export const DayTaskListModal: React.FC<DayTaskListModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  tasks,
  onTaskClick,
  onCreateTask,
  onToggleTask
}) => {
  if (!isOpen) return null;

  // 排序：未完成优先，然后按优先级高->低
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pMap = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
    return pMap[a.priority] - pMap[b.priority];
  });

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.HIGH: return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-900";
      case Priority.MEDIUM: return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-900";
      case Priority.LOW: return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-900";
      default: return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-indigo-600 dark:text-indigo-400" size={20} />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">{dateStr}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p>今日暂无任务</p>
            </div>
          ) : (
            sortedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => { onTaskClick(task); onClose(); }} 
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all group
                  ${task.completed ? 'bg-gray-50 dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800'}
                `}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                  className={`transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-zinc-600 hover:text-indigo-500'}`}
                >
                  {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">{task.description}</div>
                  )}
                </div>
                <div className={`text-xs px-2 py-1 rounded border font-medium whitespace-nowrap ${getPriorityColor(task.priority)}`}>
                  {task.priority === Priority.HIGH ? '高' : task.priority === Priority.MEDIUM ? '中' : '低'}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
          <Button 
            className="w-full gap-2 justify-center" 
            onClick={() => { onCreateTask(dateStr); onClose(); }}
          >
            <Plus size={18} />
            添加新任务
          </Button>
        </div>
      </div>
    </div>
  );
};
