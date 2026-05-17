import { useMemo } from 'react';
import { Task, Project } from '../types.ts';

export interface SearchResult {
  task: Task;
  score: number;
  matchType: 'title' | 'tag' | 'description' | 'project';
  highlight: string;
  context: string;
}

export function useSearchIndex(tasks: Task[], projects: Project[]) {
  const projectMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.title);
    return map;
  }, [projects]);

  return useMemo(() => {
    function search(query: string, limit = 10): SearchResult[] {
      const q = query.toLowerCase().trim();
      if (!q || q.length < 1) return [];

      const results: SearchResult[] = [];

      for (const task of tasks) {
        const title = (task.title || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const tags = (task.tags || []).map(t => t.toLowerCase());
        const projectName = (projectMap.get(task.projectId || '') || '').toLowerCase();

        // Exact title match — score 100
        if (title === q) {
          results.push({ task, score: 100, matchType: 'title', highlight: task.title, context: '' });
          continue;
        }

        // Title partial match — score 80
        if (title.includes(q)) {
          results.push({
            task, score: 80, matchType: 'title',
            highlight: task.title,
            context: desc ? desc.substring(0, 60) : '',
          });
          continue;
        }

        // Tag match — score 60
        const matchedTag = tags.find(t => t.includes(q));
        if (matchedTag) {
          results.push({
            task, score: 60, matchType: 'tag',
            highlight: task.title,
            context: `标签: ${matchedTag}`,
          });
          continue;
        }

        // Description match — score 40
        if (desc.includes(q)) {
          const idx = desc.indexOf(q);
          const start = Math.max(0, idx - 20);
          const end = Math.min(desc.length, idx + q.length + 20);
          results.push({
            task, score: 40, matchType: 'description',
            highlight: task.title,
            context: (start > 0 ? '…' : '') + desc.substring(start, end) + (end < desc.length ? '…' : ''),
          });
          continue;
        }

        // Project name match — score 30
        if (projectName && projectName.includes(q)) {
          results.push({
            task, score: 30, matchType: 'project',
            highlight: task.title,
            context: `项目: ${projectMap.get(task.projectId || '')}`,
          });
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    return { search };
  }, [tasks, projectMap]);
}
