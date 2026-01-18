import React, { useState, useEffect, useRef } from 'react';
import { Task, Project, Priority } from '../types';
import { X, Edit, Trash2, CheckCircle2, Circle, Clock, Briefcase } from 'lucide-react';

interface EventPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  anchorEl: HTMLElement | null;
  projects: Project[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const EventPopover: React.FC<EventPopoverProps> = ({
  isOpen,
  onClose,
  task,
  anchorEl,
  projects,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });

  useEffect(() => {
    const calculatePosition = () => {
      if (!anchorEl || !popoverRef.current) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight;

      let top = anchorRect.bottom + 8;
      let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;

      // 如果下方空间不足，则显示在上方
      if (top + popoverRect.height > viewHeight - 20) {
        top = anchorRect.top - popoverRect.height - 8;
      }
      
      // 避免超出屏幕左侧
      if (left < 10) left = 10;
      // 避免超出屏幕右侧
      if (left + popoverRect.width > viewWidth - 10) {
        left = viewWidth - popoverRect.width - 10;
      }

      setPosition({ top, left, opacity: 1 });
    };

    if (isOpen) {
      // 延迟计算，等待 popover 渲染以获取正确尺寸
      requestAnimationFrame(calculatePosition);
    }
  }, [isOpen, anchorEl, task]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const project = projects.find(p => p.id === task.projectId);

  const priorityStyles = {
    [Priority.HIGH]: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30",
    [Priority.MEDIUM]: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30",
    [Priority.LOW]: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
  };
  const priorityLabels = { [Priority.HIGH]: '高', [Priority.MEDIUM]: '中', [Priority.LOW]: '低' };

  return (
    <div
      ref={popoverRef}
      style={{ top: position.top, left: position.left, opacity: position.opacity }}
      className="fixed z-[90] w-72 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-zinc-800 transition-opacity duration-150 animate-in fade-in zoom-in-95"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
            {task.title}
          </h3>
          <button
            onClick={() => onToggle(task.id)}
            className={`flex-shrink-0 ml-2 mt-0.5 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
          >
            {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>
              {task.date}
              {task.startTime ? `, ${task.startTime}` : ' (全天)'}
            </span>
          </div>
          {project && (
            <div className="flex items-center gap-2">
              <Briefcase size={14} style={{ color: project.color }} />
              <span>{project.title}</span>
            </div>
          )}
          <div className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${priorityStyles[task.priority]}`}>
             {priorityLabels[task.priority]} 优先级
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="bg-gray-50/50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800 flex divide-x divide-gray-100 dark:divide-zinc-800">
        <button onClick={() => onEdit(task)} className="flex-1 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5">
          <Edit size={14} />
          编辑
        </button>
        <button onClick={() => onDelete(task.id)} className="flex-1 py-3 text-sm font-medium text-red-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5">
          <Trash2 size={14} />
          删除
        </button>
      </div>
    </div>
  );
};
