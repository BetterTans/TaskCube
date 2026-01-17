
import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { X, Plus, Briefcase, TrendingUp, ChevronRight, Folder } from 'lucide-react';
import { Button } from './Button';

interface ProjectListModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreateProject: (project: Partial<Project>) => void;
  onProjectClick: (project: Project) => void;
}

export const ProjectListModal: React.FC<ProjectListModalProps> = ({
  isOpen,
  onClose,
  projects,
  onCreateProject,
  onProjectClick
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    onCreateProject({
      title: newTitle,
      description: newDesc,
      status: 'active',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      logs: []
    });
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-[#F2F2F7] dark:bg-black sm:rounded-2xl rounded-t-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[90vh] sm:h-[80vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* iOS 风格头部 */}
        <div className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
           <button onClick={onClose} className="text-indigo-600 dark:text-indigo-400 font-medium text-base">完成</button>
           <h3 className="font-semibold text-gray-900 dark:text-white text-base">项目</h3>
           <button 
             onClick={() => setIsCreating(true)} 
             className="text-indigo-600 dark:text-indigo-400 font-medium text-base"
             disabled={isCreating}
           >
             <Plus size={24} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          
          {/* 创建项目表单 */}
          {isCreating && (
             <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
               <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800">
                  <input
                    autoFocus
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="项目名称"
                    className="w-full px-4 py-3 border-b border-gray-100 dark:border-zinc-800 outline-none text-base placeholder:text-gray-400 dark:placeholder:text-zinc-600 bg-transparent text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="备注..."
                    className="w-full px-4 py-3 outline-none text-sm text-gray-600 dark:text-gray-300 resize-none h-20 bg-transparent"
                  />
                  <div className="flex border-t border-gray-100 dark:border-zinc-800 divide-x divide-gray-100 dark:divide-zinc-800">
                     <button 
                       onClick={() => setIsCreating(false)}
                       className="flex-1 py-3 text-gray-500 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                     >
                       取消
                     </button>
                     <button 
                       onClick={handleCreate}
                       className="flex-1 py-3 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                     >
                       创建
                     </button>
                  </div>
               </div>
             </div>
          )}

          {/* 项目列表 - iOS 分组风格 */}
          <div className="space-y-6">
             {projects.length === 0 && !isCreating ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Folder size={48} className="mb-4 opacity-20" />
                  <p className="font-medium">暂无项目</p>
                  <p className="text-sm mt-1">点击右上角 + 号创建新项目</p>
                </div>
             ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                   {projects.map(project => (
                     <div 
                       key={project.id}
                       onClick={() => onProjectClick(project)}
                       className="flex items-center gap-4 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer group active:bg-gray-100 dark:active:bg-zinc-700"
                     >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${project.status === 'completed' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-400' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                           <Folder size={20} className="fill-current" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-0.5">
                              <h4 className={`font-semibold text-base truncate pr-2 ${project.status === 'completed' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                {project.title}
                              </h4>
                              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                                {new Date(project.startDate).toLocaleDateString()}
                              </span>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden max-w-[100px]">
                                <div 
                                  className={`h-full rounded-full ${project.status === 'completed' ? 'bg-gray-400' : 'bg-indigo-500'}`} 
                                  style={{ width: `${project.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{project.progress}%</span>
                              {project.description && (
                                <span className="text-xs text-gray-400 truncate max-w-[150px] ml-auto">
                                  {project.description}
                                </span>
                              )}
                           </div>
                        </div>
                        
                        <ChevronRight size={16} className="text-gray-300 dark:text-zinc-600 shrink-0" />
                     </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
