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

    // 定义数据库的版本和表结构（主要是索引）。
    this.version(1).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId',
      projects: 'id, status',
      recurringRules: 'id'
    });
    
    this.version(2).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId, *tags',
      projects: 'id, status',
      recurringRules: 'id, *tags'
    });

    this.version(3).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId, *tags, *predecessorIds, *successorIds',
      projects: 'id, status',
      recurringRules: 'id, *tags'
    });

    /**
     * 'populate' 事件处理器。
     */
    this.on('populate', () => {
      console.log("Populating database for the first time, checking for legacy LocalStorage data...");
      
      const savedTasks = localStorage.getItem('gemini-tasks-full');
      const savedRules = localStorage.getItem('gemini-recurring-rules');
      const savedProjects = localStorage.getItem('gemini-projects');

      if (savedTasks) {
        try {
          const tasks = JSON.parse(savedTasks);
          this.tasks.bulkAdd(tasks);
        } catch (e) { console.error("Failed to migrate tasks from LocalStorage:", e); }
      } else {
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