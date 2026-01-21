import React, { useState, useEffect, useRef } from 'react';
import { Task, Project, Priority } from '../types';
import { X, Edit, Trash2, CheckCircle2, Circle, Clock, Briefcase, Lock } from 'lucide-react';

/**
 * EventPopoverProps 接口定义了事件浮窗组件的属性。
 * @property {boolean} isOpen - 控制浮窗是否可见。
 * @property {function} onClose - 关闭浮窗的回调。
 * @property {Task | null} task - 要在浮窗中显示的任务对象。
 * @property {HTMLElement | null} anchorEl - 浮窗定位的锚点元素。
 * @property {Project[]} projects - 项目列表，用于查找和显示任务所属项目。
 * @property {function} onToggle - 切换任务完成状态的回调。
 * @property {function} onEdit - 点击编辑按钮的回调。
 * @property {function} onDelete - 点击删除按钮的回调。
 * @property {boolean} isBlocked - 任务是否被前置任务阻塞。
 */
interface EventPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  anchorEl: HTMLElement | null;
  projects: Project[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isBlocked: boolean;
}

/**
 * 事件浮窗组件。
 * 当用户在日历视图中点击一个任务时，此浮窗会出现在任务旁边，
 * 提供任务的摘要信息和快速操作按钮（完成、编辑、删除）。
 */
export const EventPopover: React.FC<EventPopoverProps> = ({
  isOpen,
  onClose,
  task,
  anchorEl,
  projects,
  onToggle,
  onEdit,
  onDelete,
  isBlocked
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  // 状态：管理浮窗的位置 (top, left) 和透明度
  const [position, setPosition] = useState({ top: 0, left: 0, opacity: 0 });

  // 当浮窗关闭时重置位置
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: 0, left: 0, opacity: 0 });
    }
  }, [isOpen]);

  // 核心定位逻辑：当浮窗打开或锚点变化时，重新计算其位置
  useEffect(() => {
    const calculatePosition = () => {
      try {
        if (!anchorEl || !popoverRef.current) {
          console.warn('EventPopover: anchorEl or popoverRef not available');
          return;
        }

        const anchorRect = anchorEl.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        const viewWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewHeight = window.innerHeight || document.documentElement.clientHeight;

        // 检查getBoundingClientRect是否返回了有效数值
        if (!anchorRect || typeof anchorRect.left !== 'number' || typeof anchorRect.top !== 'number') {
          console.warn('EventPopover: anchorRect is invalid', anchorRect);
          return;
        }

        // 检查是否是不正常的位置（比如所有值都是0）
        // 这可能发生在元素尚未完全渲染或被隐藏的情况下
        const isZeroPosition = anchorRect.left === 0 && anchorRect.top === 0 &&
                              anchorRect.width === 0 && anchorRect.height === 0;

        // 默认显示在锚点下方
        let top = anchorRect.bottom + 8;
        let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;

        // 如果是零位置或看起来不合理的位置，默认显示在屏幕中心
        if (isZeroPosition || !top || !left || !isFinite(top) || !isFinite(left)) {
          console.warn('EventPopover: Detected invalid position, using fallback', { anchorRect });
          // 默认显示在屏幕中心附近
          top = 100;
          left = (viewWidth - popoverRect.width) / 2;
        } else {
          // 正常计算的位置需要调整以适应屏幕边界

          // 如果下方空间不足，则显示在锚点上方
          if (top + popoverRect.height > viewHeight - 20) {
            top = anchorRect.top - popoverRect.height - 8;
          }

          // 避免超出屏幕左侧
          if (left < 10) left = 10;
          // 避免超出屏幕右侧
          if (left + popoverRect.width > viewWidth - 10) {
            left = viewWidth - popoverRect.width - 10;
          }

          // 确保top不会超出屏幕上方
          if (top < 10) top = 10;
        }

        setPosition({ top, left, opacity: 1 });
      } catch (error) {
        console.error('EventPopover: Error calculating position', error);
        // 发生错误时，使用安全位置
        setPosition({ top: 100, left: (window.innerWidth - 288) / 2, opacity: 1 });
      }
    };

    if (isOpen) {
      // 使用 requestAnimationFrame + setTimeout 双重保障，
      // 确保在浏览器下一次绘制前计算位置
      requestAnimationFrame(() => {
        setTimeout(calculatePosition, 0);
      });
    }
  }, [isOpen, anchorEl, task]);

  // 处理点击外部关闭浮窗的逻辑
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

  // 从项目列表中查找当前任务所属的项目
  const project = projects.find(p => p.id === task.projectId);

  // 优先级样式和标签
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
        {/* 头部：标题和完成按钮 */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            {isBlocked && <Lock size={16} className="text-gray-400 shrink-0" />}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {task.title}
            </h3>
          </div>
          <button
            onClick={() => onToggle(task.id)}
            disabled={isBlocked}
            title={isBlocked ? "被前置任务阻塞" : "标记为完成"}
            className={`flex-shrink-0 ml-2 mt-0.5 transition-colors disabled:cursor-not-allowed disabled:text-gray-300 dark:disabled:text-zinc-600 ${task.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600 hover:text-indigo-500'}`}
          >
            {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
          </button>
        </div>

        {/* 详情区域 */}
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
      
      {/* 底部操作按钮 */}
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
