import React, { useState, useMemo, useCallback } from 'react';
import { Task, Project, EisenhowerQuadrant, Priority } from '../types';
import { Zap, Star, Bell, Coffee, Clock, AlignLeft, ChevronDown, Lock } from 'lucide-react';

interface MatrixViewProps {
  tasks: Task[];
  projects: Project[];
  blockedTaskIds: Set<string>;
  dateRange: { start: string; end: string };
  onUpdateTask: (task: Partial<Task>) => void;
  onTaskClick: (task: Task, event: React.MouseEvent) => void;
}

const QuadrantHeader = ({
  id,
  title,
  subtitle,
  icon,
  taskCount,
  isCollapsed,
  onToggleCollapse,
}: {
  id: EisenhowerQuadrant;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  taskCount: number;
  isCollapsed: boolean;
  onToggleCollapse: (id: EisenhowerQuadrant) => void;
}) => (
  <div className="flex items-center justify-between mb-4 px-2">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-base font-medium text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-zinc-700/50 w-8 h-8 rounded-full flex items-center justify-center">
        {taskCount}
      </span>
      <button
        onClick={() => onToggleCollapse(id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <ChevronDown
          size={20}
          className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}
        />
      </button>
    </div>
  </div>
);

interface MatrixTaskCardProps {
  task: Task;
  project?: Project;
  isBlocked: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: () => void;
  onClick: (task: Task, event: React.MouseEvent) => void;
}

const MatrixTaskCard = React.memo(({ task, project, isBlocked, onDragStart, onDragEnd, onClick }: MatrixTaskCardProps) => {
  const priorityColor = {
    [Priority.HIGH]: 'bg-red-500',
    [Priority.MEDIUM]: 'bg-orange-400',
    [Priority.LOW]: 'bg-blue-400',
  };

  return (
    <div
      draggable={!task.completed && !isBlocked}
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onClick={(e) => onClick(task, e)}
      className={`bg-white dark:bg-zinc-800/80 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-zinc-700/50 transition-all duration-200 ${isBlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'} ${task.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 flex items-start gap-2">
            {isBlocked && <Lock size={14} className="text-gray-400 mt-0.5 shrink-0" />}
            <p className={`font-semibold text-gray-800 dark:text-gray-100 leading-snug break-words ${task.completed ? 'line-through' : ''}`}>{task.title}</p>
        </div>
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${priorityColor[task.priority]}`} title={`优先级: ${task.priority}`}></div>
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          {task.startTime && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded-full">
              <Clock size={12} />
              <span>{task.startTime}</span>
            </div>
          )}
          {task.subTasks.length > 0 && (
            <div className="flex items-center gap-1">
              <AlignLeft size={12} />
              <span>{task.subTasks.filter(s => s.completed).length}/{task.subTasks.length}</span>
            </div>
          )}
        </div>
        {project && (
            <div className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${project.color}20`, color: project.color }}>
              {project.title}
            </div>
        )}
      </div>
    </div>
  );
});

export const MatrixView: React.FC<MatrixViewProps> = ({ tasks, projects, blockedTaskIds, dateRange, onUpdateTask, onTaskClick }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverQuadrant, setDragOverQuadrant] = useState<EisenhowerQuadrant | null>(null);
  const [collapsedQuadrants, setCollapsedQuadrants] = useState<Set<EisenhowerQuadrant>>(new Set());

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => task.date >= dateRange.start && task.date <= dateRange.end);
  }, [tasks, dateRange]);

  const quadrants = useMemo(() => {
    const q: Record<EisenhowerQuadrant, Task[]> = {
      [EisenhowerQuadrant.Q1]: [],
      [EisenhowerQuadrant.Q2]: [],
      [EisenhowerQuadrant.Q3]: [],
      [EisenhowerQuadrant.Q4]: [],
    };
    filteredTasks.forEach(task => {
        const quadrant = task.quadrant || EisenhowerQuadrant.Q2; // Default to Q2
        if (q[quadrant]) {
            q[quadrant].push(task);
        }
    });
    // Sort tasks within each quadrant
    for (const key in q) {
        q[key as EisenhowerQuadrant].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const pMap = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
            return pMap[a.priority] - pMap[b.priority];
        });
    }
    return q;
  }, [filteredTasks]);

  const toggleQuadrantCollapse = (id: EisenhowerQuadrant) => {
    setCollapsedQuadrants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
  }, []);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent, targetQuadrant: EisenhowerQuadrant) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const task = tasks.find(t => t.id === taskId);
    if (task && (task.quadrant || 'Q2') !== targetQuadrant) {
      onUpdateTask({ id: taskId, quadrant: targetQuadrant });
    }
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
  };
  
  const handleDragEnter = (e: React.DragEvent, quadrant: EisenhowerQuadrant) => {
     e.preventDefault();
     if(draggedTaskId) {
         setDragOverQuadrant(quadrant);
     }
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverQuadrant(null);
  }

  const quadrantOrder: EisenhowerQuadrant[] = [EisenhowerQuadrant.Q1, EisenhowerQuadrant.Q2, EisenhowerQuadrant.Q3, EisenhowerQuadrant.Q4];
  const quadrantInfo = {
    [EisenhowerQuadrant.Q1]: { title: '重要 & 紧急', subtitle: '立即处理', icon: <Zap size={24} className="text-red-500"/> },
    [EisenhowerQuadrant.Q2]: { title: '重要 & 不紧急', subtitle: '计划执行', icon: <Star size={24} className="text-green-600"/> },
    [EisenhowerQuadrant.Q3]: { title: '紧急 & 不重要', subtitle: '审慎处理', icon: <Bell size={24} className="text-orange-500"/> },
    [EisenhowerQuadrant.Q4]: { title: '不重要 & 不紧急', subtitle: '暂缓排除', icon: <Coffee size={24} className="text-blue-500"/> },
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-2 sm:p-6">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {quadrantOrder.map(qId => {
          const isCollapsed = collapsedQuadrants.has(qId);
          const { title, subtitle, icon } = quadrantInfo[qId];
          return (
            <div key={qId} className="flex flex-col">
              <QuadrantHeader
                id={qId}
                title={title}
                subtitle={subtitle}
                icon={icon}
                taskCount={quadrants[qId].length}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleQuadrantCollapse}
              />
              <div className={`transition-[grid-template-rows] duration-300 ease-in-out grid ${isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'} flex-1`}>
                <div 
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, qId)}
                  onDragEnter={(e) => handleDragEnter(e, qId)}
                  onDragLeave={handleDragLeave}
                  className={`p-1 min-h-[200px] overflow-hidden transition-colors duration-200 border-2 border-dashed rounded-2xl ${dragOverQuadrant === qId ? 'border-indigo-400/50 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-transparent'}`}
                >
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                      {quadrants[qId].map(task => (
                        <div key={task.id} className={`${draggedTaskId === task.id ? 'opacity-30 scale-95' : ''} transition-all`}>
                          <MatrixTaskCard
                            task={task}
                            project={projects.find(p => p.id === task.projectId)}
                            isBlocked={blockedTaskIds.has(task.id)}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onClick={onTaskClick}
                          />
                        </div>
                      ))}
                    </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};