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

/**
 * TaskItemProps 接口定义了任务项组件的属性。
 * @property {Task} task - 要渲染的任务对象。
 * @property {function} onToggle - 切换任务完成状态的回调。
 * @property {function} onDelete - 删除任务的回调。
 * @property {function} onUpdateSubtasks - 更新整个子任务列表的回调。
 * @property {function} onToggleSubtask - 切换单个子任务完成状态的回调。
 * @property {function} onToggleExpand - 切换任务详情展开/折叠状态的回调。
 */
interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSubtasks: (taskId: string, subtasks: SubTask[]) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onToggleExpand: (id: string) => void;
}

/**
 * 任务列表项组件 (目前未在主视图中使用，主要用于旧版或简单列表场景)。
 * 它展示单个任务的信息，并提供完成、删除、展开/折叠以及 AI 生成子任务等功能。
 */
export const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggle, 
  onDelete, 
  onUpdateSubtasks,
  onToggleSubtask,
  onToggleExpand
}) => {
  // 状态：用于跟踪 AI 是否正在生成子任务，以显示加载动画
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * 调用 AI 服务将当前任务标题拆解为一系列可执行的子任务。
   * @param {React.MouseEvent} e - 事件对象，用于阻止事件冒泡。
   */
  const handleGenerateSubtasks = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.subTasks.length > 0) return; // 仅在没有子任务时才生成

    setIsGenerating(true);
    // 如果任务当前是折叠的，自动展开以显示加载状态
    if (!task.isExpanded) onToggleExpand(task.id);
    
    // 调用 AI 服务
    const subtaskTitles = await breakDownTask(task.title);
    
    if (subtaskTitles.length > 0) {
      // 将返回的标题字符串数组转换为 SubTask 对象数组
      const newSubtasks: SubTask[] = subtaskTitles.map(t => ({
        id: crypto.randomUUID(),
        title: t,
        completed: false
      }));
      // 通过回调更新父组件的状态
      onUpdateSubtasks(task.id, newSubtasks);
    }
    setIsGenerating(false);
  };

  // 定义不同优先级的样式
  const priorityColors = {
    [Priority.HIGH]: "text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900",
    [Priority.MEDIUM]: "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900",
    [Priority.LOW]: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  };

  // 定义不同优先级的标签文本
  const priorityLabels = {
    [Priority.HIGH]: "高",
    [Priority.MEDIUM]: "中",
    [Priority.LOW]: "低",
  };

  return (
    <div className={`group bg-white dark:bg-zinc-900 rounded-xl border transition-all duration-200 hover:shadow-md ${task.completed ? 'border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50' : 'border-gray-200 dark:border-zinc-800'}`}>
      {/* 任务主区域 */}
      <div className="p-4 flex items-start gap-3">
        {/* 完成/未完成切换按钮 */}
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
            {/* 任务标签和指示器 */}
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
          
          {/* 子任务和描述摘要 */}
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

        {/* 操作按钮区域 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
           {/* AI 智能拆解按钮 */}
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
           {/* 删除按钮 */}
           <button
             onClick={() => onDelete(task.id)}
             className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
             title="删除"
           >
             <Trash2 size={18} />
           </button>
           {/* 展开/折叠按钮 */}
           <button
             onClick={() => onToggleExpand(task.id)}
             className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
           >
             {task.isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
           </button>
        </div>
      </div>

      {/* 展开内容区域 / 子任务列表 */}
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
            {/* 渲染子任务列表 */}
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
