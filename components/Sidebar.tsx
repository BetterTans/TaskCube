import React from 'react';
import { EisenhowerQuadrant, Project } from '../types.ts';
import { Box, Briefcase, Repeat, Settings, PanelLeftClose, PanelRightClose, Zap, Star, Bell, Coffee } from 'lucide-react';

interface SidebarProps {
  filterProjectId: string | null;
  onProjectFilter: (projectId: string | null) => void;
  filterQuadrant: EisenhowerQuadrant | null;
  onQuadrantFilter: (quadrant: EisenhowerQuadrant | null) => void;
  projects: Project[];
  taskCounts: { projects: Record<string, number>; quadrants: Record<string, number> };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenProjects: () => void;
  onOpenRecurring: () => void;
  onOpenSettings: () => void;
}

const activeClass = 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm';
const inactiveClass = 'text-gray-500 dark:text-zinc-400 hover:bg-white/50 dark:hover:bg-zinc-700/50';

export const Sidebar: React.FC<SidebarProps> = ({
  filterProjectId,
  onProjectFilter,
  filterQuadrant,
  onQuadrantFilter,
  projects,
  taskCounts,
  isCollapsed,
  onToggleCollapse,
  onOpenProjects,
  onOpenRecurring,
  onOpenSettings,
}) => {
  // Unified button style used across all sections
  const btnBase = `w-full flex items-center gap-3 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors`;

  const quadrantOptions: { id: EisenhowerQuadrant; icon: React.ElementType; label: string }[] = [
    { id: EisenhowerQuadrant.Q1, icon: Zap, label: 'Q1 重要紧急' },
    { id: EisenhowerQuadrant.Q2, icon: Star, label: 'Q2 重要不紧急' },
    { id: EisenhowerQuadrant.Q3, icon: Bell, label: 'Q3 紧急不重要' },
    { id: EisenhowerQuadrant.Q4, icon: Coffee, label: 'Q4 不重要不紧急' },
  ];

  return (
    <aside className={`relative z-40 flex-shrink-0 bg-gray-100/50 dark:bg-zinc-800/20 backdrop-blur-lg border-r border-gray-200/80 dark:border-zinc-700/50 flex flex-col p-4 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center gap-2 mb-6 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg shadow-sm flex items-center justify-center text-white flex-shrink-0"><Box size={18} /></div>
        {!isCollapsed && <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">NextDo</h1>}
      </div>

      {/* Filters — hidden when collapsed */}
      {!isCollapsed && (
        <div className="overflow-y-auto min-h-0 flex-1">
          {/* Project Filter */}
          <div className="mb-3">
            <div className="flex items-center justify-between px-1 mb-1">
              <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">项目</span>
              <button onClick={onOpenProjects} className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-0.5 rounded transition-colors">
                <Briefcase size={14} />
              </button>
            </div>
            <div className="space-y-0.5 max-h-[35vh] overflow-y-auto">
              <button
                onClick={() => onProjectFilter(null)}
                className={`${btnBase} ${filterProjectId === null ? activeClass : inactiveClass}`}
              >
                <span>全部项目</span>
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => onProjectFilter(p.id === filterProjectId ? null : p.id)}
                  className={`${btnBase} ${filterProjectId === p.id ? activeClass : inactiveClass}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="truncate flex-1">{p.title}</span>
                  {(taskCounts.projects[p.id] || 0) > 0 && (
                    <span className="text-xs text-gray-400 dark:text-zinc-500">{taskCounts.projects[p.id]}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quadrant Filter */}
          <div className="mb-3">
            <span className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider px-1">象限</span>
            <div className="space-y-0.5 mt-1 max-h-[25vh] overflow-y-auto">
              <button
                onClick={() => onQuadrantFilter(null)}
                className={`${btnBase} ${filterQuadrant === null ? activeClass : inactiveClass}`}
              >
                <span>全部象限</span>
              </button>
              {quadrantOptions.map(q => {
                const Icon = q.icon;
                const count = taskCounts.quadrants[q.id] || 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => onQuadrantFilter(q.id === filterQuadrant ? null : q.id)}
                    className={`${btnBase} ${filterQuadrant === q.id ? activeClass : inactiveClass}`}
                  >
                    <Icon size={14} className="flex-shrink-0" />
                    <span className="truncate flex-1">{q.label}</span>
                    {count > 0 && (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Bottom actions — consistent style */}
      <div className="flex flex-col gap-1 shrink-0">
        {isCollapsed ? (
          <>
            <button onClick={onOpenRecurring} title="周期规则" className={`${btnBase} justify-center ${inactiveClass}`}>
              <Repeat size={18} className="flex-shrink-0" />
            </button>
            <button onClick={onOpenSettings} title="设置" className={`${btnBase} justify-center ${inactiveClass}`}>
              <Settings size={18} className="flex-shrink-0" />
            </button>
          </>
        ) : (
          <>
            <button onClick={onOpenRecurring} className={`${btnBase} ${inactiveClass}`}>
              <Repeat size={18} className="flex-shrink-0" /><span>周期规则</span>
            </button>
            <button onClick={onOpenSettings} className={`${btnBase} ${inactiveClass}`}>
              <Settings size={18} className="flex-shrink-0" /><span>设置</span>
            </button>
          </>
        )}
      </div>

      <button
        onMouseDown={() => onToggleCollapse()}
        onClick={(e) => e.preventDefault()}
        title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        className="absolute bottom-5 left-full -translate-x-1/2 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border border-gray-200/80 dark:border-zinc-700/50 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600 hover:text-gray-900 dark:hover:text-white transition-all"
      >
        {isCollapsed ? <PanelRightClose size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </aside>
  );
};
