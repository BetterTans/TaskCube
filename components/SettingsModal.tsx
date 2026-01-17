import React, { useState, useEffect, useRef } from 'react';
import { AISettings, ThemeMode } from '../types';
import { X, Server, Key, Box, Check, RotateCcw, Moon, Sun, Monitor, Download, Upload, Database } from 'lucide-react';
import { Button } from './Button';
import { db } from '../db';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- 导出数据 ---
  const handleExport = async () => {
    try {
      const backupData = {
        version: 1,
        timestamp: new Date().toISOString(),
        tasks: await db.tasks.toArray(),
        projects: await db.projects.toArray(),
        recurringRules: await db.recurringRules.toArray(),
        settings: formData // 同时也备份当前的 AI 设置
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TaskCube_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("导出失败，请重试");
    }
  };

  // --- 导入数据 ---
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("警告：导入数据将完全覆盖当前的数据库！\n\n建议先导出当前数据作为备份。\n确定要继续吗？")) {
       e.target.value = ''; // 清空 input 以便下次能触发 onChange
       return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const data = JSON.parse(jsonStr);

        // 简单的格式校验
        if (!Array.isArray(data.tasks) || !Array.isArray(data.projects)) {
           throw new Error("无效的备份文件格式");
        }

        // 使用事务确保原子性操作
        await db.transaction('rw', db.tasks, db.projects, db.recurringRules, async () => {
           // 清空现有数据
           await db.tasks.clear();
           await db.projects.clear();
           await db.recurringRules.clear();

           // 写入新数据
           await db.tasks.bulkAdd(data.tasks);
           await db.projects.bulkAdd(data.projects);
           if (data.recurringRules) await db.recurringRules.bulkAdd(data.recurringRules);
        });

        // 恢复设置
        if (data.settings) {
           setFormData(data.settings);
           onSave(data.settings);
        }

        alert("数据恢复成功！页面将刷新以加载新数据。");
        window.location.reload();

      } catch (err) {
        console.error("Import failed", err);
        alert("导入失败：文件格式错误或已损坏。");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/50 shrink-0">
           <h3 className="font-bold text-gray-900 dark:text-white text-lg">设置</h3>
           <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
             <X size={20} />
           </button>
        </div>

        {/* 表单内容 - 可滚动 */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
           
           {/* 主题设置 */}
           {onThemeChange && (
             <div className="space-y-3">
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

           {/* 数据管理区域 */}
           <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                 <Database size={16} /> 数据管理
              </label>
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl p-4 border border-gray-100 dark:border-zinc-700 space-y-3">
                 <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    所有数据存储在本地浏览器 (IndexedDB)。为防止数据丢失，建议定期导出备份。
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={handleExport}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
                    >
                       <Download size={16} /> 导出备份
                    </button>
                    <button 
                      onClick={handleImportClick}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors"
                    >
                       <Upload size={16} /> 恢复数据
                    </button>
                    <input 
                       type="file" 
                       accept=".json" 
                       ref={fileInputRef} 
                       onChange={handleFileChange}
                       className="hidden" 
                    />
                 </div>
              </div>
           </div>

           <div className="border-t border-gray-100 dark:border-zinc-800 pt-2"></div>

           {/* AI API 设置 */}
           <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                <Box className="text-indigo-600 dark:text-indigo-400" size={18} />
                <h4 className="font-semibold text-gray-900 dark:text-white">AI 模型接口</h4>
             </div>
             
             <div className="space-y-3">
               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Base URL (API 代理地址)</label>
                 <div className="relative">
                   <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input
                     type="text"
                     value={formData.baseUrl}
                     onChange={(e) => handleChange('baseUrl', e.target.value)}
                     placeholder="https://api.openai.com/v1"
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">API Key</label>
                 <div className="relative">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input
                     type="password"
                     value={formData.apiKey}
                     onChange={(e) => handleChange('apiKey', e.target.value)}
                     placeholder="sk-..."
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                   />
                 </div>
               </div>

               <div>
                 <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Model Name</label>
                 <div className="relative">
                   <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                   <input
                     type="text"
                     value={formData.model}
                     onChange={(e) => handleChange('model', e.target.value)}
                     placeholder="gpt-3.5-turbo, deepseek-chat..."
                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                   />
                 </div>
               </div>
             </div>
           </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 bg-gray-50/50 dark:bg-zinc-900/50 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <button 
             onClick={handleReset}
             className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
          >
             <RotateCcw size={14} /> 恢复默认
          </button>

          <div className="flex gap-3">
             <Button variant="secondary" onClick={onClose} size="sm">
               取消
             </Button>
             <Button onClick={handleSave} size="sm" className="min-w-[80px]">
               {showSuccess ? <Check size={16} /> : '保存'}
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
};