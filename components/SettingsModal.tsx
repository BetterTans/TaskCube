
import React, { useState, useEffect } from 'react';
import { AISettings, ThemeMode } from '../types';
import { X, Server, Key, Box, Check, RotateCcw, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from './Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  currentTheme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

// 默认配置
const DEFAULT_SETTINGS: AISettings = {
  baseUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-3.5-turbo'
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  currentTheme = 'light',
  onThemeChange
}) => {
  const [formData, setFormData] = useState<AISettings>(settings);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  const handleChange = (field: keyof AISettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // 简单的校验：Base URL 去除末尾斜杠
    const cleanedUrl = formData.baseUrl.replace(/\/+$/, '');
    const finalData = { ...formData, baseUrl: cleanedUrl };
    
    onSave(finalData);
    setShowSuccess(true);
    setTimeout(() => {
        setShowSuccess(false);
        onClose();
    }, 800);
  };

  const handleReset = () => {
    if(window.confirm('确定要恢复默认设置吗？')) {
        setFormData(DEFAULT_SETTINGS);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800">
        
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50">
           <h3 className="font-bold text-gray-900 dark:text-white text-lg">设置</h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-6">
           
           {/* 主题设置 */}
           {onThemeChange && (
             <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">外观主题</label>
                <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg">
                   {[
                     { id: 'light', icon: <Sun size={14} />, label: '浅色' },
                     { id: 'dark', icon: <Moon size={14} />, label: '深色' },
                     { id: 'system', icon: <Monitor size={14} />, label: '系统' },
                   ].map((t) => (
                     <button
                       key={t.id}
                       onClick={() => onThemeChange(t.id as ThemeMode)}
                       className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                         currentTheme === t.id 
                           ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm' 
                           : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                       }`}
                     >
                       {t.icon}
                       {t.label}
                     </button>
                   ))}
                </div>
             </div>
           )}

           <div className="border-t border-gray-100 dark:border-zinc-800 pt-4 space-y-5">
             <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI 模型配置</h4>
             
             <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                TaskCube 支持任何兼容 <strong>OpenAI 接口标准</strong> 的服务。
                你可以配置官方 OpenAI、DeepSeek、Groq 或本地 Ollama 等模型服务。
             </div>

             {/* Base URL */}
             <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                   <Server size={14} className="text-gray-400" />
                   API 接口地址 (Base URL)
                </label>
                <input 
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => handleChange('baseUrl', e.target.value)}
                  placeholder="例如: https://api.openai.com/v1"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all font-mono text-gray-600 dark:text-gray-200"
                />
                <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">通常以 /v1 结尾</p>
             </div>

             {/* API Key */}
             <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                   <Key size={14} className="text-gray-400" />
                   API 密钥 (Key)
                </label>
                <input 
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => handleChange('apiKey', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all font-mono text-gray-900 dark:text-gray-200"
                />
             </div>

             {/* Model Name */}
             <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                   <Box size={14} className="text-gray-400" />
                   模型名称 (Model Name)
                </label>
                <input 
                  type="text"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                  placeholder="例如: gpt-4o, deepseek-chat"
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all font-mono text-gray-600 dark:text-gray-200"
                />
             </div>
           </div>
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
           <button 
             onClick={handleReset}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
           >
             <RotateCcw size={14} /> 恢复默认
           </button>

           <div className="flex gap-3">
              <Button variant="secondary" onClick={onClose}>取消</Button>
              <Button onClick={handleSave} disabled={!formData.apiKey && !process.env.API_KEY} className="min-w-[80px]">
                 {showSuccess ? <Check size={18} /> : '保存'}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
};
