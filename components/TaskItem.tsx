
import React, { useState } from 'react';
import { Task, SubTask, Priority } from '../types';
import { breakDownTask } from '../services/aiService';
import { Button } from './Button';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Sparkles, 
  MoreVertical,
  AlignLeft,
  Repeat
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (taskId: string, subtasks: SubTask[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onToggleExpand: (id: string) => void;
}

/**
 * 任务列表项组件
 * 包含展开/折叠、AI 生成子任务等功能
 */
export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdateSubtasks,
  onToggleSubtask,
  onToggleExpand
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // 调用 AI 将任务拆解为子任务
  const handleGenerateSubtasks = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subTasks.length > 0) return; // 只有在没有子任务时生成

    setIsGenerating(true);
    // 自动展开以显示加载状态
    if (!task.isExpanded) onToggleExpand(task.id);
    
    const subtaskTitles = await breakDownTask(task.title);
    
    if (subtaskTitles.length > 0) {
      const newSubtasks: SubTask[] = subtaskTitles.map(t => ({
        id: crypto.randomUUID(),
        title: t,
        completed: false
      }));
      onUpdateSubtasks(task.id, newSubtasks);
    }
    setIsGenerating(false);
  };

  const priorityColors = {
    [Priority.HIGH]: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
    [Priority.MEDIUM]: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900",
    [Priority.LOW]: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  };

  const priorityLabels = {
    [Priority.HIGH]: "高",
    [Priority.MEDIUM]: "中",
    [Priority.LOW]: "低",
  };

  return (
    <div className={`group bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-200 hover:shadow-md ${task.completed ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50' : 'border-gray-200 dark:border-zinc-800'}`}>
      <div className="p-4 flex items-start gap-3">
        <button 
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
        >
          {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-base font-medium truncate pr-4 ${task.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
              {task.title}
            </h3>
            <div className="flex items-center gap-2">
              {task.recurringRuleId && (
                <span title="周期任务" className="flex items-center">
                  <Repeat size={14} className="text-indigo-500" />
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}优先级
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 h-6">
            {task.subTasks.length > 0 && (
               <span className="flex items-center gap-1 text-xs">
                 <AlignLeft size={12} />
                 {task.subTasks.filter(s => s.completed).length}/{task.subTasks.length}
               </span>
            )}
            {task.description && <span className="truncate max-w-[200px]">{task.description}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
           {/* AI 魔法按钮 */}
           {!task.completed && task.subTasks.length === 0 && (
            <button
              onClick={handleGenerateSubtasks}
              disabled={isGenerating}
              className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg tooltip-trigger"
              title="AI 智能拆解"
            >
              <Sparkles size={18} className={isGenerating ? "animate-pulse" : ""} />
            </button>
           )}

           <button
             onClick={() => onDelete(task.id)}
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
             title="删除"
           >
             <Trash2 size={18} />
           </button>

           <button
             onClick={() => onToggleExpand(task.id)}
             className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
           >
             {task.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </div>
      </div>

      {/* 展开内容区域 / 子任务 */}
      {task.isExpanded && (
        <div className="px-4 pb-4 pl-12">
          <div className="space-y-2 border-l-2 border-indigo-100 dark:border-indigo-900 pl-4 py-2">
            {isGenerating && (
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-sm animate-pulse">
                <Sparkles size={14} />
                <span>思考中... AI 正在为您拆解任务</span>
              </div>
            )}
            
            {!isGenerating && task.subTasks.length === 0 && (
               <p className="text-sm text-gray-400 dark:text-gray-500 italic">暂无子任务。点击✨星光图标即可生成。</p>
            )}

            {task.subTasks.map(subtask => (
              <div key={subtask.id} className="flex items-center gap-3 group/sub">
                <button 
                  onClick={() => onToggleSubtask(task.id, subtask.id)}
                  className={`flex-shrink-0 transition-colors ${subtask.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
                >
                  {subtask.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <span className={`text-sm ${subtask.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                  {subtask.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
