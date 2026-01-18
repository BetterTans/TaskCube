import React, { useState, useEffect, useRef } from 'react';
import { AISettings, ThemeMode } from '../types';
import { X, Server, Key, Box, Check, RotateCcw, Moon, Sun, Monitor, Download, Upload, Database, Keyboard } from 'lucide-react';
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
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo'
};

const HOTKEY_LABELS: Record<string, string> = {
  'new_task': '新建任务',
  'go_to_today': '跳转到今天',
  'toggle_view': '切换视图',
  'open_projects': '打开项目',
  'open_palette': '打开指令面板',
};

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

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
      setHotkeyData(hotkeys);
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

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50 shrink-0">
           <h3 className="font-bold text-gray-900 dark:text-white text-lg">设置</h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
           {onThemeChange && (
             <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">外观主题</label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                   {[{ id: 'light', icon: <Sun size={14}/>, label: '浅色' }, { id: 'dark', icon: <Moon size={14}/>, label: '深色' }, { id: 'system', icon: <Monitor size={14}/>, label: '系统' }].map(t => (
                     <button key={t.id} onClick={() => onThemeChange(t.id as ThemeMode)} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${currentTheme === t.id ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>{t.icon}{t.label}</button>
                   ))}
                </div>
             </div>
           )}

           <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Keyboard size={16}/> 快捷键</label>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                 {Object.entries(HOTKEY_LABELS).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                       <span className="text-sm text-gray-600 dark:text-gray-300">{label}</span>
                       <KeyInput value={hotkeyData[key] || ''} onChange={value => setHotkeyData(prev => ({ ...prev, [key]: value }))} />
                    </div>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Database size={16}/> 数据管理</label>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                 <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">所有数据存储在本地浏览器 (IndexedDB)。为防止数据丢失，建议定期导出备份。</div>
                 <div className="flex gap-3">
                    <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Download size={16}/> 导出备份</button>
                    <button onClick={handleImportClick} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"><Upload size={16}/> 恢复数据</button>
                    <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                 </div>
              </div>
           </div>
           
           <div className="border-t border-gray-100 dark:border-zinc-800 pt-2"></div>
           
           <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2"><Box className="text-indigo-600 dark:text-indigo-400" size={18} /><h4 className="font-semibold text-gray-900 dark:text-white">AI 模型接口</h4></div>
             <div className="space-y-3">
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base URL</label>
                 <div className="relative"><Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="text" value={formData.baseUrl} onChange={(e) => setFormData(p => ({...p, baseUrl: e.target.value}))} placeholder="https://api.openai.com/v1" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"/></div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                 <div className="relative"><Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="password" value={formData.apiKey} onChange={(e) => setFormData(p => ({...p, apiKey: e.target.value}))} placeholder="sk-..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"/></div>
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Model Name</label>
                 <div className="relative"><Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/><input type="text" value={formData.model} onChange={(e) => setFormData(p => ({...p, model: e.target.value}))} placeholder="gpt-3.5-turbo..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"/></div>
               </div>
             </div>
           </div>
        </div>

        <div className="px-6 py-4 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button onClick={handleReset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"><RotateCcw size={14}/> 恢复默认</button>
          <div className="flex gap-3">
             <Button variant="secondary" onClick={onClose} size="sm">取消</Button>
             <Button onClick={handleSave} size="sm" className="min-w-[80px]">{showSuccess ? <Check size={16}/> : '保存'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
};