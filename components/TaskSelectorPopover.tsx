import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task } from '../types';
import { Search, X } from 'lucide-react';

interface TaskSelectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  tasks: Task[];
  excludeIds?: string[]; // IDs to exclude from the list (e.g., the current task itself)
  onSelect: (taskId: string) => void;
  title: string;
}

export const TaskSelectorPopover: React.FC<TaskSelectorPopoverProps> = ({
  isOpen,
  onClose,
  anchorEl,
  tasks,
  excludeIds = [],
  onSelect,
  title
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isReady, setIsReady] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && anchorEl) {
      // We need to wait for the popover to be in the DOM to measure it.
      // A timeout of 0 pushes this to the end of the current call stack.
      const timer = setTimeout(() => {
        if (!popoverRef.current) return;
        const anchorRect = anchorEl.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewWidth = window.innerWidth;
        const viewHeight = window.innerHeight;

        let top = anchorRect.bottom + 4;
        let left = anchorRect.left;

        if (left + popoverRect.width > viewWidth - 10) {
            left = viewWidth - popoverRect.width - 10;
        }
        if (left < 10) {
            left = 10;
        }
        if (top + popoverRect.height > viewHeight - 10) {
            top = anchorRect.top - popoverRect.height - 4;
        }

        setPosition({ top, left });
        setIsReady(true);
        inputRef.current?.focus();
      }, 0);

      return () => clearTimeout(timer);
    } else {
      setIsReady(false);
      setSearchQuery('');
    }
  }, [isOpen, anchorEl]);


  const filteredTasks = useMemo(() => {
    return tasks.filter(task =>
      !task.completed &&
      !excludeIds.includes(task.id) &&
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tasks, excludeIds, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div
        ref={popoverRef}
        style={{ top: position.top, left: position.left }}
        className={`fixed w-80 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-700 flex flex-col max-h-80 transition-opacity duration-150 ${isReady ? 'opacity-100 animate-in fade-in zoom-in-95' : 'opacity-0'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800">
          <h4 className="font-semibold text-center text-sm text-gray-800 dark:text-gray-200">{title}</h4>
        </div>
        <div className="relative p-2">
          <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索任务..."
            className="w-full bg-gray-100 dark:bg-zinc-700/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <button
                key={task.id}
                onClick={() => {
                  onSelect(task.id);
                  onClose();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm text-gray-800 dark:text-gray-200">{task.title}</span>
                <span className="text-xs text-gray-400 block">{task.date}</span>
              </button>
            ))
          ) : (
            <div className="text-center p-4 text-sm text-gray-400">没有可选择的任务</div>
          )}
        </div>
      </div>
    </div>
  );
};