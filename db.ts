import Dexie, { Table } from 'dexie';
import { Task, Project, RecurringRule, Priority, EisenhowerQuadrant } from './types';

// 定义数据库类
export class TaskCubeDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  recurringRules!: Table<RecurringRule>;

  constructor() {
    super('TaskCubeDB');
    
    // 定义表结构
    // 注意: IndexedDB 是 schemaless 的，这里只需要定义索引字段
    // 使用 type assertion (as any) 解决 TypeScript 对 subclass 方法继承的类型推断问题
    (this as any).version(1).stores({
      tasks: 'id, date, projectId, priority, completed, recurringRuleId',
      projects: 'id, status',
      recurringRules: 'id'
    });

    // 数据迁移逻辑：数据库首次创建时运行
    (this as any).on('populate', () => {
      console.log("Populating database from LocalStorage...");
      
      const savedTasks = localStorage.getItem('gemini-tasks-full');
      const savedRules = localStorage.getItem('gemini-recurring-rules');
      const savedProjects = localStorage.getItem('gemini-projects');

      if (savedTasks) {
        try {
          const tasks = JSON.parse(savedTasks);
          this.tasks.bulkAdd(tasks);
        } catch (e) { console.error("Migrate tasks failed", e); }
      } else {
        // 如果完全没有数据，添加一些初始演示数据
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
            isExpanded: false
          }
        ]);
      }

      if (savedRules) {
        try {
          const rules = JSON.parse(savedRules);
          this.recurringRules.bulkAdd(rules);
        } catch (e) { console.error("Migrate rules failed", e); }
      }

      if (savedProjects) {
        try {
          const projects = JSON.parse(savedProjects);
          this.projects.bulkAdd(projects);
        } catch (e) { console.error("Migrate projects failed", e); }
      }
    });
  }
}

export const db = new TaskCubeDB();