import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface Command {
  id: string;
  type: 'action' | 'task';
  icon: React.ReactNode;
  title: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = useMemo(() => {
    if (!searchQuery) return commands;
    const lowerQuery = searchQuery.toLowerCase();
    return commands.filter(cmd => cmd.title.toLowerCase().includes(lowerQuery));
  }, [searchQuery, commands]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // 确保选中项在视口内
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

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
          filteredCommands[selectedIndex].action();
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-zinc-800">
          <Search size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="输入命令或搜索任务..."
            className="w-full bg-transparent outline-none text-lg text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
          />
        </div>
        
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                onMouseEnter={() => setSelectedIndex(index)}
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
