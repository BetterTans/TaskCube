/**
 * 任务优先级枚举
 */
export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

/**
 * 艾森豪威尔矩阵四象限枚举
 */
export enum EisenhowerQuadrant {
  Q1 = 'Q1', // 重要且紧急
  Q2 = 'Q2', // 重要但不紧急 (通常是最高效的区域)
  Q3 = 'Q3', // 紧急但不重要
  Q4 = 'Q4'  // 不重要且不紧急
}

/**
 * 子任务接口
 */
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

/**
 * 重复频率类型
 */
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * 周期性任务规则接口
 * 用于生成具体的 Task 实例
 */
export interface RecurringRule {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  quadrant?: EisenhowerQuadrant;
  frequency: RecurringFrequency;
  interval: number; // 间隔数值，例如每 2 天/周
  weekDays?: number[]; // 仅用于每周频率：0-6 代表周日到周六
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD (可选)
  startTime?: string; // HH:mm (如果是全天任务则为 undefined)
  duration?: number; // 分钟数
  createdAt: number;
  projectId?: string; // 关联的项目 ID
  subTaskTitles?: string[]; // 生成任务时自动携带的子任务模板
  tags?: string[]; // 标签
}

/**
 * 项目日志接口
 */
export interface ProjectLog {
  id: string;
  content: string;
  date: number; // 时间戳
  type: 'status' | 'milestone' | 'note'; // 日志类型
}

/**
 * 项目状态类型
 */
export type ProjectStatus = 'active' | 'on_hold' | 'completed';

/**
 * 项目接口
 */
export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  progress: number; // 0-100 进度百分比
  startDate: string;
  endDate?: string;
  logs: ProjectLog[]; // 项目进展日志
  createdAt: number;
  color: string; // 用于 UI 区分的颜色 (Hex)
}

/**
 * 核心任务接口
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  quadrant?: EisenhowerQuadrant; // 艾森豪威尔矩阵归类
  subTasks: SubTask[];
  createdAt: number;
  date: string; // 格式: YYYY-MM-DD (任务开始日期)
  endDate?: string; // 格式: YYYY-MM-DD (任务结束日期，可选)
  startTime?: string; // 格式: HH:mm (24h)，若无则为全天任务
  duration?: number; // 持续时间（分钟），默认 60
  isExpanded: boolean; // UI 状态：是否展开显示详情/子任务
  recurringRuleId?: string; // 如果是由周期规则生成的，关联规则 ID
  projectId?: string; // 关联的项目 ID
  tags?: string[]; // 标签
  predecessorIds?: string[]; // 前置任务 ID 列表 (此任务依赖的任务)
  successorIds?: string[];   // 后置任务 ID 列表 (依赖此任务的任务)
}

/**
 * 主题模式类型
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * AI 模型设置接口
 */
export interface AISettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}
