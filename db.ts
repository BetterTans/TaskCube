import Dexie, { Table } from 'dexie';
import { Task, Project, RecurringRule, Priority, EisenhowerQuadrant } from './types';

/**
 * 定义应用的 IndexedDB 数据库类。
 * TaskCubeDB 继承自 Dexie，用于方便地操作底层的 IndexedDB。
 */
export class TaskCubeDB extends Dexie {
  // 定义数据库中的表。'Table' 是 Dexie 提供的类型，用于强类型化表操作。
  tasks!: Table<Task>;
  projects!: Table<Project>;
  recurringRules!: Table<RecurringRule>;

  constructor() {
    super('TaskCubeDB'); // 'TaskCubeDB' 是数据库的名称
    
    // FIX: Assign `this` to a variable typed as Dexie to help TypeScript resolve inherited methods.
    const db: Dexie = this;

    // 定义数据库的版本和表结构（主要是索引）。
    // Dexie 支持数据库版本升级。当应用代码需要新的索引时，可以增加一个版本。
    
    // 版本 1：初始的表结构定义。
    // 保留旧版本的定义是为了让 Dexie 能够处理从旧版本到新版本的平滑升级。
    db.version(1).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId',
      projects: 'id, status',
      recurringRules: 'id'
    });
    
    // 版本 2：为 tasks 表增加了 'tags' 字段的多入口索引 (*tags)。
    // 这允许我们高效地查询包含特定标签的任务。
    db.version(2).stores({
      // 'id' 是主键。其他字段是索引，用于加速查询。
      tasks: 'id, date, projectId, priority, completed, recurringRuleId, *tags',
      projects: 'id, status',
      recurringRules: 'id, *tags'
    });

    // 版本 3: 增加任务依赖关系索引
    db.version(3).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId, *tags, *predecessorIds, *successorIds',
      projects: 'id, status',
      recurringRules: 'id, *tags'
    });


    /**
     * 'populate' 事件处理器。
     * 这个事件仅在数据库首次被创建时触发一次。
     * 主要用于：
     * 1. 将旧的、存储在 localStorage 中的数据迁移到新的 IndexedDB 数据库中。
     * 2. 如果没有任何旧数据，则添加一些初始的演示数据，以引导新用户。
     */
    db.on('populate', () => {
      console.log("Populating database for the first time, checking for legacy LocalStorage data...");
      
      // 尝试从 localStorage 获取旧数据
      const savedTasks = localStorage.getItem('gemini-tasks-full');
      const savedRules = localStorage.getItem('gemini-recurring-rules');
      const savedProjects = localStorage.getItem('gemini-projects');

      if (savedTasks) {
        try {
          const tasks = JSON.parse(savedTasks);
          this.tasks.bulkAdd(tasks); // 批量添加到新数据库
        } catch (e) { console.error("Failed to migrate tasks from LocalStorage:", e); }
      } else {
        // 如果没有旧数据，添加一条欢迎任务作为演示
        const TODAY = new Date().toISOString().split('T')[0];
        this.tasks.bulkAdd([
          {
            id: '1',
            title: '欢迎使用 TaskCube',
            description: '这是一个基于 IndexedDB 的演示任务',
            completed: false,
            priority: Priority.HIGH,
            quadrant: EisenhowerQuadrant.Q1,
            subTasks: [],
            createdAt: Date.now(),
            date: TODAY,
            startTime: '09:00',
            duration: 60,
            isExpanded: false,
            tags: ['演示', '入门']
          }
        ]);
      }

      if (savedRules) {
        try {
          const rules = JSON.parse(savedRules);
          this.recurringRules.bulkAdd(rules);
        } catch (e) { console.error("Failed to migrate recurring rules from LocalStorage:", e); }
      }

      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          this.projects.bulkAdd(projects);
        } catch (e) { console.error("Failed to migrate projects from LocalStorage:", e); }
      }
    });
  }
}

// 创建并导出一个全局的数据库实例，供整个应用使用。
export const db = new TaskCubeDB();