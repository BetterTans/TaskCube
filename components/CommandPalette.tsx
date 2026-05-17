import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, Tag, Briefcase } from 'lucide-react';
import { Task, Project } from '../types.ts';
import { useSearchIndex, SearchResult } from '../hooks/useSearchIndex.ts';

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
  tasks?: Task[];
  projects?: Project[];
  onTaskSelect?: (task: Task) => void;
}

const matchColors: Record<SearchResult['matchType'], { icon: React.ReactNode; color: string }> = {
  title: { icon: null, color: 'text-yellow-500' },
  tag: { icon: <Tag size={12} />, color: 'text-teal-500' },
  description: { icon: null, color: 'text-gray-400' },
  project: { icon: <Briefcase size={12} />, color: 'text-purple-500' },
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands, tasks, projects, onTaskSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { search } = useSearchIndex(tasks ?? [], projects ?? []);
  const searchResults = useMemo(() => searchQuery.trim() ? search(searchQuery) : [], [searchQuery, search]);

  const filteredCommands = useMemo(() => {
    if (searchResults.length > 0) return [];
    if (!searchQuery) return commands;
    const lowerQuery = searchQuery.toLowerCase();
    return commands.filter(cmd => cmd.title.toLowerCase().includes(lowerQuery));
  }, [searchQuery, commands, searchResults]);

  const totalItems = searchResults.length > 0 ? searchResults.length : filteredCommands.length;

  useEffect(() => {
    if (isOpen) { setSearchQuery(''); setSelectedIndex(0); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % Math.max(totalItems, 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + Math.max(totalItems, 1)) % Math.max(totalItems, 1)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults.length > 0 && searchResults[selectedIndex] && onTaskSelect) {
          onTaskSelect(searchResults[selectedIndex].task);
          onClose();
        } else if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') { onClose(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, searchResults, selectedIndex, onClose, onTaskSelect, totalItems]);

  if (!isOpen) return null;

  const showSearchResults = searchResults.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 sm:pt-32 p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-zinc-800">
          <Search size={20} className="text-gray-400 dark:text-zinc-500 shrink-0" />
          <input ref={inputRef} type="text" value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="搜索任务或输入命令..."
            className="w-full bg-transparent outline-none text-lg text-gray-800 dark:text-zinc-200 placeholder:text-gray-400 dark:placeholder:text-zinc-600"
          />
        </div>
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto custom-scrollbar p-2">
          {showSearchResults ? (
            <>
              <div className="px-3 py-1.5 text-xs text-gray-400 font-medium">找到 {searchResults.length} 个匹配</div>
              {searchResults.map((result, index) => {
                const mc = matchColors[result.matchType];
                return (
                  <div key={result.task.id}
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => { onTaskSelect?.(result.task); onClose(); }}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                    <div className={`mt-0.5 shrink-0 ${mc.color}`}>{mc.icon || <span className="text-xs font-bold">T</span>}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-800 dark:text-zinc-200 truncate">{result.task.title}</div>
                      {result.context && <div className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">{result.context}</div>}
                    </div>
                    <div className="shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${mc.color} bg-current/10`}>{result.matchType === 'tag' ? '标签' : result.matchType === 'project' ? '项目' : result.matchType === 'description' ? '描述' : '标题'}</span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div key={cmd.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => { cmd.action(); onClose(); }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-400'}`}>{cmd.icon}</div>
                  <span className={`font-medium ${index === selectedIndex ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-800 dark:text-zinc-200'}`}>{cmd.title}</span>
                </div>
                {cmd.shortcut && <kbd className="text-xs font-mono bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 px-1.5 py-0.5 rounded border-b-2 border-gray-300 dark:border-zinc-600">{cmd.shortcut}</kbd>}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400"><p>无匹配结果</p></div>
          )}
        </div>
      </div>
    </div>
  );
};
