import React from 'react';
import { Task } from '../types.ts';
import { ChevronRight, Zap } from 'lucide-react';

interface NextActionProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export const NextAction: React.FC<NextActionProps> = ({ tasks, onTaskClick }) => {
  if (tasks.length === 0) {
    return null;
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="px-6 py-3 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg border-b border-gray-100 dark:border-zinc-800 shrink-0 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Zap size={16} className="text-indigo-500" />
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider">下一步行动</h3>
      </div>
      <div className="space-y-1">
        {tasks.map(task => (
          <button
            key={task.id}
            onClick={() => onTaskClick(task)}
            className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{task.title}</span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              {task.estimatedDuration && (
                <span className="text-xs font-mono bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                  {formatDuration(task.estimatedDuration)}
                </span>
              )}
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
