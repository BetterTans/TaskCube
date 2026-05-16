import { Priority, TaskProgress, EisenhowerQuadrant } from '../types';

// --- 优先级配色 ---
export const priorityBadgeStyles: Record<Priority, { light: string; dark: string; label: string }> = {
  [Priority.HIGH]: {
    light: 'bg-red-50 text-red-700 border border-red-200',
    dark: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    label: '高',
  },
  [Priority.MEDIUM]: {
    light: 'bg-amber-50 text-amber-700 border border-amber-200',
    dark: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    label: '中',
  },
  [Priority.LOW]: {
    light: 'bg-sky-50 text-sky-700 border border-sky-200',
    dark: 'dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800',
    label: '低',
  },
};

export const priorityDotColors: Record<Priority, { light: string; dark: string }> = {
  [Priority.HIGH]: { light: 'bg-red-500', dark: 'dark:bg-red-400' },
  [Priority.MEDIUM]: { light: 'bg-amber-500', dark: 'dark:bg-amber-400' },
  [Priority.LOW]: { light: 'bg-sky-500', dark: 'dark:bg-sky-400' },
};

export const priorityHexColors: Record<Priority, string> = {
  [Priority.HIGH]: '#EF4444',
  [Priority.MEDIUM]: '#F59E0B',
  [Priority.LOW]: '#0EA5E9',
};

// --- 进展配色 ---
export const progressBadgeStyles: Record<TaskProgress, { light: string; dark: string; label: string }> = {
  [TaskProgress.INITIAL]: {
    light: 'bg-gray-100 text-gray-600',
    dark: 'dark:bg-gray-800 dark:text-gray-400',
    label: '初始',
  },
  [TaskProgress.IN_PROGRESS]: {
    light: 'bg-blue-50 text-blue-700',
    dark: 'dark:bg-blue-900/30 dark:text-blue-300',
    label: '进行中',
  },
  [TaskProgress.ON_HOLD]: {
    light: 'bg-amber-50 text-amber-600',
    dark: 'dark:bg-amber-900/30 dark:text-amber-300',
    label: '挂起',
  },
  [TaskProgress.BLOCKED]: {
    light: 'bg-red-50 text-red-700',
    dark: 'dark:bg-red-900/30 dark:text-red-300',
    label: '阻塞',
  },
  [TaskProgress.COMPLETED]: {
    light: 'bg-green-50 text-green-700',
    dark: 'dark:bg-green-900/30 dark:text-green-300',
    label: '已完成',
  },
  [TaskProgress.DELAYED]: {
    light: 'bg-orange-50 text-orange-700',
    dark: 'dark:bg-orange-900/30 dark:text-orange-300',
    label: '延迟',
  },
};

export const progressIconColors: Record<TaskProgress, string> = {
  [TaskProgress.INITIAL]: 'text-gray-400 dark:text-gray-500',
  [TaskProgress.IN_PROGRESS]: 'text-blue-500 dark:text-blue-400',
  [TaskProgress.ON_HOLD]: 'text-amber-500 dark:text-amber-400',
  [TaskProgress.BLOCKED]: 'text-red-500 dark:text-red-400',
  [TaskProgress.COMPLETED]: 'text-green-500 dark:text-green-400',
  [TaskProgress.DELAYED]: 'text-orange-500 dark:text-orange-400',
};

// --- 象限配色 ---
export const quadrantStyles: Record<EisenhowerQuadrant, { tint: string; iconColor: string }> = {
  [EisenhowerQuadrant.Q1]: {
    tint: 'bg-red-50/50 dark:bg-red-900/10',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  [EisenhowerQuadrant.Q2]: {
    tint: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  [EisenhowerQuadrant.Q3]: {
    tint: 'bg-amber-50/50 dark:bg-amber-900/10',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  [EisenhowerQuadrant.Q4]: {
    tint: 'bg-slate-50/50 dark:bg-slate-900/10',
    iconColor: 'text-slate-400 dark:text-slate-500',
  },
};

// --- 标签配色 ---
const TAG_PALETTE = ['rose', 'pink', 'fuchsia', 'purple', 'violet', 'indigo', 'sky', 'teal', 'emerald', 'lime'];

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getTagColor = (tag: string): { light: string; dark: string } => {
  const colorName = TAG_PALETTE[hashString(tag) % TAG_PALETTE.length];
  return {
    light: `bg-${colorName}-100 text-${colorName}-700`,
    dark: `dark:bg-${colorName}-900/30 dark:text-${colorName}-300`,
  };
};

// --- 辅助函数 ---
export const getPriorityBadge = (priority: Priority): string => {
  const s = priorityBadgeStyles[priority];
  return `${s.light} ${s.dark}`;
};

export const getProgressBadge = (progress?: TaskProgress): string => {
  const p = progress || TaskProgress.INITIAL;
  const s = progressBadgeStyles[p];
  return `${s.light} ${s.dark}`;
};

export const getQuadrantTint = (quadrant: EisenhowerQuadrant): string => {
  const s = quadrantStyles[quadrant];
  return s.tint;
};