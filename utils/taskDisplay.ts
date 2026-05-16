import { TaskProgress } from '../types';
import { progressBadgeStyles, progressIconColors } from '../config/taskColors';

export const getProgressDisplay = (progress?: TaskProgress) => {
  const p = progress || TaskProgress.INITIAL;
  const badge = progressBadgeStyles[p];
  const iconColor = progressIconColors[p];

  const labels: Record<TaskProgress, string> = {
    [TaskProgress.INITIAL]: '初始',
    [TaskProgress.IN_PROGRESS]: '进行中',
    [TaskProgress.ON_HOLD]: '挂起',
    [TaskProgress.BLOCKED]: '阻塞',
    [TaskProgress.COMPLETED]: '已完成',
    [TaskProgress.DELAYED]: '延迟',
  };

  return {
    text: labels[p],
    label: labels[p],
    style: {
      color: iconColor,
      badge: `${badge.light} ${badge.dark}`,
    },
  };
};