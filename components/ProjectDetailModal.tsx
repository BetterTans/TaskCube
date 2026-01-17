
import React, { useState } from 'react';
import { Project, Task, ProjectLog, ProjectStatus, Priority, EisenhowerQuadrant } from '../types';
import { X, Calendar, Plus, Send, CheckCircle2, PlayCircle, PauseCircle, Trash2, Sparkles, LayoutList, History, Circle, ArrowLeft, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { generateProjectPlan } from '../services/aiService';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  tasks: Task[];
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddProjectTask: (task: Partial<Task>) => void;
  onCreateTaskClick: (projectId: string) => void;
  onTaskClick: (task: Task) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  isOpen,
  onClose,
  project,
  tasks,
  onUpdateProject,
  onDeleteProject,
  onAddProjectTask,
  onCreateTaskClick,
  onTaskClick
}) => {
  // 选项卡状态：'tasks' 显示任务列表，'timeline' 显示日志
  const [activeTab, setActiveTab] = useState<'tasks' | 'timeline'>('tasks');
  const [logInput, setLogInput] = useState('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  if (!isOpen || !project) return null;

  const projectTasks = tasks.filter(t => t.projectId === project.id);

  // 状态变更处理（完成时自动设置进度 100%）
  const handleStatusChange = (status: ProjectStatus) => {
    const updates: Partial<Project> = { status };
    if (status === 'completed') {
      updates.progress = 100;
    }
    onUpdateProject(project.id, updates);
  };

  // 添加日志
  const handleAddLog = () => {
    if (!logInput.trim()) return;
    const newLog: ProjectLog = {
      id: crypto.randomUUID(),
      content: logInput,
      date: Date.now(),
      type: 'note'
    };
    onUpdateProject(project.id, { 
      logs: [newLog, ...project.logs] 
    });
    setLogInput('');
  };

  // AI 生成项目计划
  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    const plan = await generateProjectPlan(project.title, project.description);
    plan.forEach(item => {
      onAddProjectTask({
        title: item.title,
        description: item.reason, 
        priority: item.priority,
        projectId: project.id,
        quadrant: EisenhowerQuadrant.Q2, 
        date: new Date().toISOString().split('T')[0] 
      });
    });
    // 自动添加一条日志记录生成操作
    const newLog: ProjectLog = {
      id: crypto.randomUUID(),
      content: `AI 助手生成了 ${plan.length} 个建议行动计划。`,
      date: Date.now(),
      type: 'milestone'
    };
    onUpdateProject(project.id, { logs: [newLog, ...project.logs] });
    setIsGeneratingPlan(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm transition-all">
      <div className="bg-[#F2F2F7] dark:bg-black w-full max-w-3xl overflow-hidden flex flex-col h-[95vh] sm:h-[85vh] sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* iOS 风格导航栏 */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <button onClick={onClose} className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-base">
            <ArrowLeft size={20} className="mr-1" />
            返回
          </button>
          <div className="font-semibold text-gray-900 dark:text-white text-base max-w-[200px] truncate">
             {project.title}
          </div>
          <button 
             onClick={() => {
                if(window.confirm('确定要删除这个项目吗？')) {
                   onDeleteProject(project.id);
                   onClose();
                }
             }}
             className="text-red-500 p-1"
          >
             <Trash2 size={20} />
          </button>
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-6">
            
            {/* 项目信息卡片 */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-zinc-800">
               <div className="mb-4">
                  <input 
                    type="text"
                    value={project.title}
                    onChange={(e) => onUpdateProject(project.id, { title: e.target.value })}
                    className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none p-0 w-full placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                  />
                  <input 
                     type="text"
                     value={project.description || ''}
                     onChange={(e) => onUpdateProject(project.id, { description: e.target.value })}
                     placeholder="添加项目描述..."
                     className="text-sm text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none p-0 w-full mt-1"
                  />
               </div>

               <div className="flex flex-col gap-4">
                 {/* 状态切换 */}
                 <div className="flex items-center gap-2">
                   {['active', 'on_hold', 'completed'].map((s) => (
                     <button
                       key={s}
                       onClick={() => handleStatusChange(s as ProjectStatus)}
                       className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all
                         ${project.status === s 
                            ? (s === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                               s === 'on_hold' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                               'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300')
                            : 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'
                         }
                       `}
                     >
                        {s === 'active' && <PlayCircle size={12} className="fill-current" />}
                        {s === 'on_hold' && <PauseCircle size={12} className="fill-current" />}
                        {s === 'completed' && <CheckCircle2 size={12} className="fill-current" />}
                        {s === 'active' ? '进行中' : s === 'on_hold' ? '已挂起' : '已完成'}
                     </button>
                   ))}
                 </div>
                 
                 {/* 可拖拽进度条 */}
                 <div className="flex items-center gap-3">
                    <div className="flex-1 relative h-6 flex items-center select-none touch-none">
                       {/* 轨道 */}
                       <div className="absolute left-0 right-0 h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                          <div 
                             className="h-full bg-indigo-500 transition-all duration-150 ease-out"
                             style={{ width: `${project.progress}%` }}
                          />
                       </div>
                       
                       {/* 交互层 (透明 input) */}
                       <input 
                          type="range"
                          min="0"
                          max="100"
                          value={project.progress}
                          onChange={(e) => onUpdateProject(project.id, { progress: parseInt(e.target.value) })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />

                       {/* 滑块视觉层 */}
                       <div 
                          className="absolute top-1/2 h-5 w-5 bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-900 shadow-md rounded-full transform -translate-y-1/2 pointer-events-none flex items-center justify-center transition-all duration-150 ease-out"
                          style={{ left: `${project.progress}%`, marginLeft: '-10px' }}
                       >
                          <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                       </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-8 text-right">{project.progress}%</span>
                 </div>
               </div>
            </div>

            {/* 分段控制器 */}
            <div className="bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg flex">
              <button 
                onClick={() => setActiveTab('tasks')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-[6px] transition-all shadow-sm ${activeTab === 'tasks' ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400 bg-transparent shadow-none'}`}
              >
                任务清单
              </button>
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-[6px] transition-all shadow-sm ${activeTab === 'timeline' ? 'bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-gray-400 bg-transparent shadow-none'}`}
              >
                过程日志
              </button>
            </div>

            {/* 内容切换区 */}
            <div>
              {activeTab === 'tasks' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                     <span className="text-xs font-semibold text-gray-400 uppercase">
                       {projectTasks.length} 个任务
                     </span>
                     <button 
                        onClick={handleGeneratePlan}
                        disabled={isGeneratingPlan}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1"
                     >
                        <Sparkles size={12} className={isGeneratingPlan ? 'animate-spin' : ''} />
                        AI 生成计划
                     </button>
                  </div>
                  
                  <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800">
                     {projectTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                           <p className="text-sm">暂无任务</p>
                        </div>
                     ) : (
                        projectTasks
                        .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
                        .map(task => (
                           <div 
                             key={task.id}
                             onClick={() => onTaskClick(task)}
                             className="flex items-center gap-3 p-3.5 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer active:bg-gray-100 dark:active:bg-zinc-700 transition-colors"
                           >
                              <div className={task.completed ? 'text-gray-300 dark:text-zinc-600' : 'text-gray-300 dark:text-zinc-600'}>
                                 {task.completed ? <CheckCircle2 size={20} className="text-green-500" /> : <Circle size={20} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <div className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{task.title}</div>
                                 <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                    <span>{task.date}</span>
                                    {task.priority === Priority.HIGH && <span className="text-red-500 font-medium bg-red-50 dark:bg-red-900/20 px-1 rounded">High</span>}
                                 </div>
                              </div>
                              <MoreHorizontal size={16} className="text-gray-300 dark:text-gray-600" />
                           </div>
                        ))
                     )}
                     <button 
                        onClick={() => onCreateTaskClick(project.id)}
                        className="w-full py-3.5 text-indigo-600 dark:text-indigo-400 font-medium text-sm flex items-center justify-center hover:bg-gray-50 dark:hover:bg-zinc-800"
                     >
                        <Plus size={16} className="mr-1" /> 添加新任务
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="space-y-4">
                   <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm flex gap-2">
                      <input
                        type="text"
                        value={logInput}
                        onChange={(e) => setLogInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLog()}
                        placeholder="记录今日进展..."
                        className="flex-1 bg-transparent outline-none text-sm px-2 text-gray-900 dark:text-white"
                      />
                      <button 
                        onClick={handleAddLog}
                        disabled={!logInput.trim()}
                        className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                   </div>

                   <div className="space-y-3">
                      {project.logs.map((log) => (
                         <div key={log.id} className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <p className="text-gray-800 dark:text-gray-200 text-sm">{log.content}</p>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50 dark:border-zinc-800">
                              <span className="text-xs text-gray-400">
                                 {new Date(log.date).toLocaleString()}
                              </span>
                              {log.type === 'milestone' && (
                                 <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">Milestone</span>
                              )}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
