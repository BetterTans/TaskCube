import { useMemo } from 'react';
import { Task, EisenhowerQuadrant, Project } from '../types.ts';

export function useTaskFilters(
  tasks: Task[],
  filterProjectId: string | null,
  filterQuadrant: EisenhowerQuadrant | null
): {
  filteredTasks: Task[];
  counts: { projects: Record<string, number>; quadrants: Record<string, number> };
} {
  return useMemo(() => {
    const projectCounts: Record<string, number> = {};
    const quadrantCounts: Record<string, number> = {};

    for (const t of tasks) {
      if (t.projectId) {
        projectCounts[t.projectId] = (projectCounts[t.projectId] || 0) + 1;
      }
      if (t.quadrant) {
        quadrantCounts[t.quadrant] = (quadrantCounts[t.quadrant] || 0) + 1;
      }
    }

    let filtered = tasks;
    if (filterProjectId && filterQuadrant) {
      filtered = tasks.filter(t => t.projectId === filterProjectId && t.quadrant === filterQuadrant);
    } else if (filterProjectId) {
      filtered = tasks.filter(t => t.projectId === filterProjectId);
    } else if (filterQuadrant) {
      filtered = tasks.filter(t => t.quadrant === filterQuadrant);
    }

    return { filteredTasks: filtered, counts: { projects: projectCounts, quadrants: quadrantCounts } };
  }, [tasks, filterProjectId, filterQuadrant]);
}
