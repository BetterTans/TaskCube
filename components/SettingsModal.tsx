import React, { useState, useEffect, useRef } from 'react';
import { AISettings, ThemeMode } from '../types';
import { X, Server, Key, Box, Check, RotateCcw, Moon, Sun, Monitor, Download, Upload, Database, Keyboard, Palette } from 'lucide-react';
import { Button } from './Button';
import { db } from '../db';

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
}

const DEFAULT_AI_SETTINGS: AISettings = {
  // FIX: Gemini doesn't use a Base URL in this context. API Key is from env.
  baseUrl: '',
  apiKey: '',
  model: 'gemini-3-flash-preview'
};

const HOTKEY_LABELS: Record<string, string> = {
  'new_task': '新建任务',
  'go_to_today': '跳转到今天',
  'toggle_view': '切换视图',
  'open_projects': '打开项目',
  'open_palette': '打开指令面板',
};

type SettingsView = 'appearance' | 'hotkeys' | 'ai' | 'data';

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
      className="min-w-[80px] text-center bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-md px-2 py-1 text-sm font-mono font-semibold text-gray-700 dark:text-gray-300 hover:border-indigo-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
    >
      {isListening ? '...' : value.replace('meta', 'Cmd').toUpperCase()}
    </button>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, settings, onSave,
  currentTheme = 'light', onThemeChange,
  hotkeys, onHotkeysChange, defaultHotkeys
}) => {
  const [formData, setFormData] = useState<AISettings>(settings);
  const [hotkeyData, setHotkeyData] = useState(hotkeys);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeView, setActiveView] = useState<SettingsView>('appearance');

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setHotkeyData(hotkeys);
      setActiveView('appearance');
    }
  }, [isOpen, settings, hotkeys]);

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
    if(window.confirm('确定要恢复所有默认设置吗？')) {
        setFormData(DEFAULT_AI_SETTINGS);
        setHotkeyData(defaultHotkeys);
    }
  };

  const handleExport = async () => { /* ... (no changes) ... */ };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... (no changes) ... */ };
  
  if (!isOpen) return null;

  const menuItems = [
    { id: 'appearance', label: '外观', icon: Palette },
    { id: 'hotkeys', label: '快捷键', icon: Keyboard },
    { id: 'ai', label: 'AI 模型', icon: Box },
    { id: 'data', label: '数据管理', icon: Database },
  ];

  const renderContent = () => {
    switch(activeView) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">外观</h2>
            {onThemeChange && (
             <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">应用主题</label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                   {[{ id: 'light', icon: <Sun size={14}/>, label: '浅色' }, { id: 'dark', icon: <Moon size={14}/>, label: '深色' }, { id: 'system', icon: <Monitor size={14}/>, label: '跟随系统' }].map(t => (
                     <button key={t.id} onClick={() => onThemeChange(t.id as ThemeMode)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${currentTheme === t.id ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>{t.icon}{t.label}</button>
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
                     <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
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
                  {/* FIX: API Key is handled by environment variable */}
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                    <input 
                      type="text" 
                      value="已从环境中加载" 
                      disabled 
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 outline-none transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">API 密钥通过 `process.env.API_KEY` 安全提供。</p>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">模型名称</label>
                 <div className="relative">
                   <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                   <input 
                     type="text" 
                     value={formData.model} 
                     onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} 
                     placeholder="gemini-3-flash-preview" 
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                   />
                 </div>
               </div>
             </div>
          </div>
        );
      case 'data':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">数据管理</h2>
             <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                 <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">所有数据存储在本地浏览器 (IndexedDB)。为防止数据丢失，建议定期导出备份。</div>
                 <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Download size={16}/> 导出备份</button>
                    <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Upload size={16}/> 恢复数据</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 </div>
              </div>
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
                    className={`w-full flex items-center gap-3 text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-gray-200/70 dark:bg-zinc-800 text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-zinc-800/50'
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
          <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14}/> 恢复默认</button>
          <div className="flex gap-3">
             <Button variant="secondary" onClick={onClose} size="sm">关闭</Button>
             <Button onClick={handleSave} size="sm" className="min-w-[80px]">{showSuccess ? <Check size={16}/> : '保存'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
