import React, { useState, useEffect, useRef } from 'react';
import { AISettings, ThemeMode, TaskProgress, Task } from '../types.ts';
import { X, Server, Key, Box, Check, RotateCcw, Moon, Sun, Monitor, Download, Upload, Database, Keyboard, Palette, FolderOpen, Tag } from 'lucide-react';
import { Button } from './Button.tsx';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { db } from '../db.ts';
import { DEFAULT_AI_SETTINGS } from '../config/defaultValues.ts';
import { STORAGE_KEYS } from '../config/storageKeys.ts';
import { ToastType } from '../hooks/useToast.ts';
import { isFileSystemAccessSupported, selectBackupDirectoryNative, clearBackupDirectory, isBackupConfigured, getBackupState, triggerBackup, generateBackupData } from '../services/autoBackup.ts';
import { Save } from 'lucide-react';
import { logger } from '../utils/logger.ts';
import { TagsManager } from './TagsManager.tsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
  hotkeys: Record<string, string>;
  onHotkeysChange: (hotkeys: Record<string, string>) => void;
  defaultHotkeys: Record<string, string>;
  addToast: (message: string, type: ToastType, duration?: number) => string;
  onRequestBackupDir?: () => void;
  tasks?: Task[];
}

const HOTKEY_LABELS: Record<string, string> = {
  'new_task': '新建任务',
  'go_to_today': '跳转到今天',
  'toggle_view': '切换视图',
  'open_projects': '打开项目',
  'open_palette': '打开指令面板',
};

type SettingsView = 'appearance' | 'hotkeys' | 'ai' | 'data' | 'tags';

const KeyInput: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
  const [isListening, setIsListening] = useState(false);

  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    let key = e.key.toLowerCase();
    if (key === ' ') key = 'space';
    
    let combo = [];
    if (e.metaKey) combo.push('meta');
    if (e.ctrlKey) combo.push('ctrl');
    if (e.shiftKey) combo.push('shift');
    if (!['meta', 'control', 'shift', 'alt'].includes(key)) {
       combo.push(key);
    }
    
    onChange(combo.join('+'));
    setIsListening(false);
  };

  useEffect(() => {
    if (isListening) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isListening]);

  return (
    <button
      onClick={() => setIsListening(true)}
      onBlur={() => setIsListening(false)}
      className="min-w-[80px] text-center bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg px-2 py-1 text-sm font-mono font-semibold text-gray-700 dark:text-zinc-300 hover:border-indigo-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
    >
      {isListening ? '...' : value.replace('meta', 'Cmd').toUpperCase()}
    </button>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, onSave,
  currentTheme = 'light', onThemeChange,
  hotkeys, onHotkeysChange, defaultHotkeys, addToast,
  onRequestBackupDir, tasks = []
}) => {
  const [formData, setFormData] = useState<AISettings>(settings);
  const [hotkeyData, setHotkeyData] = useState(hotkeys);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<SettingsView>('appearance');
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [backupConfigured, setBackupConfigured] = useState(isBackupConfigured());
  const [backupDirName, setBackupDirName] = useState(getBackupState().dirName);
  const [backupNativeFailed, setBackupNativeFailed] = useState(false);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, title, message, onConfirm });
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setHotkeyData(hotkeys);
      setActiveView('appearance');
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave({ ...formData, baseUrl: formData.baseUrl.replace(/\/+$/, '') });
    onHotkeysChange(hotkeyData);
    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        onClose();
    }, 800);
  };

  const handleReset = () => {
    showConfirm('恢复默认设置', '确定要恢复所有默认设置吗？', () => {
        setFormData(DEFAULT_AI_SETTINGS);
        setHotkeyData(defaultHotkeys);
    });
  };

  const handleExport = async () => {
    try {
      const tasks = await db.tasks.toArray();
      const projects = await db.projects.toArray();
      const recurringRules = await db.recurringRules.toArray();

      const settingsData = {
        aiSettings: localStorage.getItem(STORAGE_KEYS.AI_SETTINGS),
        theme: localStorage.getItem(STORAGE_KEYS.THEME),
        hotkeys: localStorage.getItem(STORAGE_KEYS.HOTKEYS),
        sidebarCollapsed: localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED),
        tableFilters: localStorage.getItem(STORAGE_KEYS.TABLE_FILTERS),
      };

      const backupData = {
        version: '1.1',
        exportedAt: new Date().toISOString(),
        database: { tasks, projects, recurringRules },
        localStorage: settingsData,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `nextdo-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('数据已成功导出！', 'success');
    } catch (error) {
      console.error('Failed to export data:', error);
      addToast('数据导出失败，请检查控制台获取更多信息。', 'error');
    }
  };
  
  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showConfirm('导入数据', '您确定要导入数据吗？这将覆盖所有当前数据。此操作无法撤销。', () => doImport(file));
  };

  const doImport = async (file: File) => {
      try {
        const jsonString = await file.text();
        const backupData = JSON.parse(jsonString);

        if (!backupData.database || !backupData.localStorage) {
          throw new Error('无效的备份文件格式。');
        }

        // Compatibility check: handle progress field for backward compatibility
        let tasksToImport = backupData.database.tasks || [];
        const today = new Date().toISOString().split('T')[0];

        // If no progress field exists, convert old data format
        if (backupData.version === '1.0' || !tasksToImport.some((task: any) => task.progress !== undefined)) {
          logger.info('Detected old data format, adding progress field compatibility...');
          tasksToImport = tasksToImport.map((task: any) => {
            // Only add progress if it doesn't exist
            if (!task.progress) {
              // Backward compatibility: map completed/status to progress
              if (task.completed) {
                // 已完成任务
                task.progress = TaskProgress.COMPLETED;
              } else if (task.endDate && task.endDate < today) {
                // 已过期但未完成的任务
                task.progress = TaskProgress.DELAYED;
              } else {
                // 其他任务
                task.progress = TaskProgress.INITIAL;
              }
            }
            return task;
          });
        }

        // Step 1: Restore Database
        await db.transaction('rw', db.tasks, db.projects, db.recurringRules, async () => {
          await Promise.all([
            db.tasks.clear(),
            db.projects.clear(),
            db.recurringRules.clear(),
          ]);
          await Promise.all([
            db.tasks.bulkAdd(tasksToImport),
            db.projects.bulkAdd(backupData.database.projects || []),
            db.recurringRules.bulkAdd(backupData.database.recurringRules || []),
          ]);
        });

        // Step 2: Restore LocalStorage Settings
        const lsData = backupData.localStorage;

        // A list of all keys managed by the backup system.
        const managedKeys = Object.values(STORAGE_KEYS);

        const backupValues: Record<string, string | null | undefined> = {
          [STORAGE_KEYS.AI_SETTINGS]: lsData.aiSettings,
          [STORAGE_KEYS.THEME]: lsData.theme,
          [STORAGE_KEYS.HOTKEYS]: lsData.hotkeys,
          [STORAGE_KEYS.SIDEBAR_COLLAPSED]: lsData.sidebarCollapsed,
          [STORAGE_KEYS.TABLE_FILTERS]: lsData.tableFilters,
        };

        // This loop ensures a clean restore.
        // It sets any value present in the backup, and crucially,
        // removes any local setting if it's not in the backup (i.e., value is null/undefined).
        for (const key of managedKeys) {
            const value = backupValues[key as keyof typeof backupValues];
            if (value !== null && value !== undefined) {
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
            }
        }

        addToast('数据导入成功！应用将重新加载以应用更改。', 'success');
        window.location.reload();
      } catch (error) {
        console.error('Failed to import data:', error);
        addToast(`数据导入失败：${error instanceof Error ? error.message : String(error)}`, 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };
  
  if (!isOpen) return null;

  const menuItems = [
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'hotkeys', label: '快捷键', icon: Keyboard },
    { id: 'ai', label: 'AI 模型', icon: Box },
    { id: 'data', label: '数据管理', icon: Database },
    { id: 'tags', label: '标签', icon: Tag },
  ];

  const renderContent = () => {
    switch(activeView) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">外观</h2>
            {onThemeChange && (
             <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-zinc-300">应用主题</label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                   {[{ id: 'light', icon: <Sun size={14}/>, label: '浅色' }, { id: 'dark', icon: <Moon size={14}/>, label: '深色' }, { id: 'system', icon: <Monitor size={14}/>, label: '跟随系统' }].map(t => (
                     <button key={t.id} onClick={() => onThemeChange(t.id as ThemeMode)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${currentTheme === t.id ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'}`}>{t.icon}{t.label}</button>
                   ))}
                </div>
             </div>
           )}
          </div>
        );
      case 'hotkeys':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">快捷键</h2>
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
               {Object.entries(HOTKEY_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                     <span className="text-sm text-gray-600 dark:text-zinc-300">{label}</span>
                     <KeyInput value={hotkeyData[key] || ''} onChange={value => setHotkeyData(prev => ({ ...prev, [key]: value }))} />
                  </div>
               ))}
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI 模型设置</h2>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">Base URL</label>
                  <div className="relative">
                    <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                      type="text" 
                      value={formData.baseUrl} 
                      onChange={(e) => setFormData(p => ({...p, baseUrl: e.target.value}))} 
                      placeholder="https://api.openai.com/v1" 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                      type="password" 
                      value={formData.apiKey} 
                      onChange={(e) => setFormData(p => ({...p, apiKey: e.target.value}))} 
                      placeholder="sk-..." 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                    />
                  </div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1">模型名称</label>
                 <div className="relative">
                   <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                   <input 
                     type="text" 
                     value={formData.model} 
                     onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} 
                     placeholder="gpt-3.5-turbo" 
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                   />
                 </div>
               </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center">
                  支持任何兼容 OpenAI API 格式的服务，包括本地模型。
                </p>
             </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">数据管理</h2>
             <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                 <div className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">所有数据存储在本地浏览器 (IndexedDB)。为防止数据丢失，建议定期导出备份。</div>
                 <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Download size={16}/> 导出备份</button>
                    <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Upload size={16}/> 恢复数据</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 </div>
              </div>
              {isFileSystemAccessSupported() && !backupNativeFailed && (
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">自动备份</h3>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                    {backupConfigured
                      ? `已设置自动备份文件夹「${backupDirName}」。每次数据变更后自动保存备份文件，浏览器清缓存也不会丢失数据。`
                      : '选择一个本地文件夹后，应用会自动将数据备份到该文件夹。即使浏览器缓存被清理，数据文件仍保留在电脑上。'}
                  </div>
                  <div className="flex gap-3">
                    {backupConfigured ? (
                      <>
                        <button onClick={async () => { await clearBackupDirectory(); setBackupConfigured(false); setBackupDirName(''); addToast('已取消自动备份', 'info'); }} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><X size={16}/> 取消自动备份</button>
                        <button onClick={() => { triggerBackup(); addToast('手动备份已触发，5秒后写入', 'success'); }} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Save size={16}/> 立即备份</button>
                      </>
                    ) : (
                      <button onClick={async () => { const result = await selectBackupDirectoryNative(); if (result.success) { setBackupConfigured(true); setBackupDirName(result.dirName || ''); addToast('自动备份已设置，文件夹: ' + (result.dirName || ''), 'success'); } else { addToast(result.error || '选择文件夹失败', 'error'); setBackupNativeFailed(true); } }} className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"><FolderOpen size={16}/> 选择备份文件夹</button>
                    )}
                  </div>
                </div>
              )}
              {(!isFileSystemAccessSupported() || backupNativeFailed) && !backupConfigured && (
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">快速备份</h3>
                  <div className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                    当前浏览器不支持自动备份到文件夹（macOS Chrome 限制）。点击下方按钮可一键下载备份文件到本地，建议定期操作以防数据丢失。
                  </div>
                  <button onClick={async () => { try { const jsonString = await generateBackupData(); const blob = new Blob([jsonString], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `nextdo-backup-${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); addToast('备份文件已下载', 'success'); } catch { addToast('备份下载失败', 'error'); } }} className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"><Download size={16}/> 一键下载备份</button>
                </div>
              )}
          </div>
        );
      case 'tags':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">标签管理</h2>
            <TagsManager tasks={tasks ?? []} addToast={addToast} />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-50 dark:bg-zinc-950 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800 flex flex-col h-[70vh] max-h-[600px]">
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 bg-gray-100/50 dark:bg-black/20 p-4 border-r border-gray-200 dark:border-zinc-800/50 flex-shrink-0">
            <div className="space-y-1">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id as SettingsView)}
                    className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-gray-200/70 dark:bg-zinc-800 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
                      }
                    `}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white dark:bg-zinc-900">
             {renderContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50/80 dark:bg-zinc-950/80 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0 backdrop-blur-sm">
          <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14}/> 恢复默认</button>
          <div className="flex gap-3">
             <Button variant="secondary" onClick={onClose} size="sm">关闭</Button>
             <Button onClick={handleSave} size="sm" className="min-w-[80px]">{showSuccess ? <Check size={16}/> : '保存'}</Button>
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(prev => ({ ...prev, isOpen: false })); }}
        onCancel={() => { setConfirmState(prev => ({ ...prev, isOpen: false })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
      />
    </div>
  );
};