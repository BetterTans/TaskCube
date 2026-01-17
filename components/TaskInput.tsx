
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Priority } from '../types';

interface TaskInputProps {
  onAdd: (title: string, priority: Priority) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, priority);
    setTitle('');
    setPriority(Priority.MEDIUM); // 重置默认值
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="添加新任务..."
          className="flex-1 px-3 py-2 outline-none text-gray-700 placeholder:text-gray-400 bg-transparent"
        />
        
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          className="text-sm bg-gray-50 border-none rounded-lg px-3 py-2 text-gray-600 outline-none hover:bg-gray-100 cursor-pointer hidden sm:block"
        >
          <option value={Priority.LOW}>低优先级</option>
          <option value={Priority.MEDIUM}>中优先级</option>
          <option value={Priority.HIGH}>高优先级</option>
        </select>

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
