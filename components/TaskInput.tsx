import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Priority } from '../types';

/**
 * TaskInputProps 接口定义了任务输入组件的属性。
 * @property {function} onAdd - 当用户提交新任务时调用的回调函数。
 */
interface TaskInputProps {
  onAdd: (title: string, priority: Priority) => void;
}

/**
 * 一个简单的任务输入表单组件 (目前未在主应用视图中使用)。
 * 它允许用户输入任务标题、选择优先级，并提交新任务。
 */
export const TaskInput: React.FC<TaskInputProps> = ({ onAdd }) => {
  // 本地状态：管理输入框的标题和选择的优先级
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  /**
   * 处理表单提交事件。
   * 如果标题不为空，则调用 onAdd 回调，并重置表单状态。
   * @param {React.FormEvent} e - 表单事件对象。
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return; // 防止提交空任务
    onAdd(title, priority);
    // 重置输入框和优先级
    setTitle('');
    setPriority(Priority.MEDIUM);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
        {/* 任务标题输入框 */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="添加新任务..."
          className="flex-1 px-3 py-2 outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
        />
        
        {/* 优先级选择器 */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="text-sm bg-gray-50 border-none rounded-lg px-3 py-2 text-gray-600 outline-none hover:bg-gray-100 cursor-pointer hidden sm:block"
        >
          <option value={Priority.LOW}>低优先级</option>
          <option value={Priority.MEDIUM}>中优先级</option>
          <option value={Priority.HIGH}>高优先级</option>
        </select>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>
    </form>
  );
};
