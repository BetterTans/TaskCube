import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Command 接口定义了命令面板中每个命令的结构。
 * @property {string} id - 命令的唯一标识符。
 * @property {('action' | 'task')} type - 命令的类型，用于可能的未来样式区分。
 * @property {React.ReactNode} icon - 显示在命令旁边的图标。
 * @property {string} title - 命令的显示名称。
 * @property {string} [shortcut] - 命令关联的快捷键提示。
 * @property {function} action - 执行该命令时调用的函数。
 */
export interface Command {
  id: string;
  type: 'action' | 'task';
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
  action: () => void;
}

/**
 * CommandPaletteProps 接口定义了命令面板组件的属性。
 * @property {boolean} isOpen - 控制面板是否可见。
 * @property {function} onClose - 关闭面板时调用的回调。
 * @property {Command[]} commands - 要在面板中显示的命令列表。
 */
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

/**
 * 全局命令面板组件，类似于 VS Code 或 Spotlight 的功能。
 * 用户可以通过快捷键 (Cmd/Ctrl+K) 打开它，然后通过输入文本来快速搜索和执行各种操作或查找任务。
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  // 状态：管理搜索查询和当前选中的命令索引
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs：用于直接访问 DOM 元素
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 使用 useMemo 缓存过滤后的命令列表，只有当搜索查询或原始命令列表变化时才重新计算
  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands; // 如果没有查询，返回所有命令
    const lowerQuery = searchQuery.toLowerCase();
    // 过滤出标题包含查询字符串的命令
    return commands.filter(cmd => cmd.title.toLowerCase().includes(lowerQuery));
  }, [searchQuery, commands]);

  // 当面板打开时，重置状态并聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      // 使用 setTimeout 确保在 DOM 元素可见后再聚焦
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // 当选中项变化时，确保它在列表中可见
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // 处理键盘导航（上下箭头、回车、Esc）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action(); // 执行选中命令的动作
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);
  
  if (!isOpen) return null;

  return (
    // 背景遮罩，点击时关闭面板
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // 阻止点击面板内部时关闭
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-zinc-800">
          <Search size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0); // 搜索时重置选中项
            }}
            placeholder="输入命令或搜索任务..."
            className="w-full bg-transparent outline-none text-lg text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
          />
        </div>
        
        {/* 命令列表 */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onMouseEnter={() => setSelectedIndex(index)} // 鼠标悬停时更新选中项
                onClick={() => { cmd.action(); onClose(); }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {cmd.icon}
                   </div>
                   <span className={`font-medium ${index === selectedIndex ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-800 dark:text-gray-200'}`}>
                     {cmd.title}
                   </span>
                </div>
                {/* 快捷键提示 */}
                {cmd.shortcut && (
                  <kbd className="text-xs font-mono bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border-b-2 border-gray-300 dark:border-zinc-600">
                    {cmd.shortcut}
                  </kbd>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p>无匹配结果</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
