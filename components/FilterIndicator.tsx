import React from 'react';
import { X, Filter } from 'lucide-react';
import { EisenhowerQuadrant, Project } from '../types.ts';

const quadrantLabels: Record<EisenhowerQuadrant, string> = {
  [EisenhowerQuadrant.Q1]: 'Q1 重要紧急',
  [EisenhowerQuadrant.Q2]: 'Q2 重要不紧急',
  [EisenhowerQuadrant.Q3]: 'Q3 紧急不重要',
  [EisenhowerQuadrant.Q4]: 'Q4 不重要不紧急',
};

interface FilterIndicatorProps {
  filterProjectId: string | null;
  filterQuadrant: EisenhowerQuadrant | null;
  projects: Project[];
  onClearProject: () => void;
  onClearQuadrant: () => void;
}

export const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  filterProjectId,
  filterQuadrant,
  projects,
  onClearProject,
  onClearQuadrant,
}) => {
  if (!filterProjectId && !filterQuadrant) return null;

  const projectName = filterProjectId
    ? projects.find(p => p.id === filterProjectId)?.title ?? null
    : null;

  return (
    <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 animate-in slide-in-from-top-2 duration-200">
      <Filter size={12} className="flex-shrink-0" />
      {projectName && (
        <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 border border-indigo-200 dark:border-indigo-700">
          {projectName}
          <button onClick={onClearProject} className="hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </span>
      )}
      {filterQuadrant && (
        <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 border border-indigo-200 dark:border-indigo-700">
          {quadrantLabels[filterQuadrant]}
          <button onClick={onClearQuadrant} className="hover:text-red-500 transition-colors">
            <X size={12} />
          </button>
        </span>
      )}
    </div>
  );
};
