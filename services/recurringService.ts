
import { RecurringRule, Task } from "../types";

// 辅助函数：增加日期天数
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// 辅助函数：将字符串 YYYY-MM-DD 转换为本地 Date 对象
const parseDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

// 辅助函数：将 Date 对象格式化为 YYYY-MM-DD
const formatDate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * 根据周期规则生成任务实例。
 * 
 * 逻辑说明：
 * 遍历从规则开始日期（或当前时间）到生成截止日期的每一天，
 * 判断该日期是否符合规则的频率要求。如果符合且该日期尚未生成任务，则创建一个新任务。
 * 
 * @param rule 周期性规则对象
 * @param existingTasks 现有的任务列表，用于防止重复生成
 * @param rangeEndStr 生成范围的结束日期（可选，默认向后生成 90 天）
 * @returns 新生成的任务数组
 */
export const generateTasksFromRule = (
  rule: RecurringRule, 
  existingTasks: Task[],
  rangeEndStr?: string
): Task[] => {
  const newTasks: Task[] = [];
  const start = parseDate(rule.startDate);
  
  // 默认生成范围：从现在起往后 3 个月
  const now = new Date();
  const limitDate = rangeEndStr ? parseDate(rangeEndStr) : addDays(now, 90);
  const ruleEndDate = rule.endDate ? parseDate(rule.endDate) : null;
  
  // 实际截止日期是：规则结束日期 或 系统限制日期 中的较早者
  const effectiveEnd = ruleEndDate && ruleEndDate < limitDate ? ruleEndDate : limitDate;

  let current = new Date(start);

  // 安全计数器，防止无限循环
  let safetyCounter = 0;
  const MAX_ITERATIONS = 1000;

  while (current <= effectiveEnd && safetyCounter < MAX_ITERATIONS) {
    safetyCounter++;
    
    // 检查当前日期是否匹配规则
    let isMatch = false;

    if (rule.frequency === 'daily') {
      const diffTime = Math.abs(current.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays % rule.interval === 0) isMatch = true;
    } 
    else if (rule.frequency === 'weekly') {
      // 检查星期几是否匹配
      if (rule.weekDays && rule.weekDays.includes(current.getDay())) {
         // 检查周间隔 (例如每 2 周)
         const msPerWeek = 1000 * 60 * 60 * 24 * 7;
         const diffWeeks = Math.floor((current.getTime() - start.getTime()) / msPerWeek);
         if (diffWeeks % rule.interval === 0) isMatch = true;
      }
    }
    else if (rule.frequency === 'monthly') {
      // 检查日期（号数）是否匹配
      if (current.getDate() === start.getDate()) {
         // 检查月间隔
         const yearDiff = current.getFullYear() - start.getFullYear();
         const monthDiff = (yearDiff * 12) + (current.getMonth() - start.getMonth());
         if (monthDiff % rule.interval === 0) isMatch = true;
      }
    }
    else if (rule.frequency === 'custom') {
      // 自定义通常处理为按天间隔
      const diffTime = Math.abs(current.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays % rule.interval === 0) isMatch = true;
    }

    if (isMatch) {
      const dateStr = formatDate(current);
      
      // 检查该日期是否已经存在由该规则生成的任务
      const exists = existingTasks.some(
        t => t.recurringRuleId === rule.id && t.date === dateStr
      );

      // 如果不存在且日期在开始日期之后，则创建任务
      if (!exists && dateStr >= rule.startDate) {
        newTasks.push({
          id: crypto.randomUUID(),
          title: rule.title,
          description: rule.description,
          priority: rule.priority,
          quadrant: rule.quadrant,
          completed: false,
          // 每个实例重新创建子任务列表（基于模板）
          subTasks: rule.subTaskTitles ? rule.subTaskTitles.map(t => ({
             id: crypto.randomUUID(),
             title: t,
             completed: false
          })) : [], 
          createdAt: Date.now(),
          date: dateStr,
          isExpanded: false,
          recurringRuleId: rule.id,
          projectId: rule.projectId // 继承项目 ID
        });
      }
    }

    // 前进一天
    current.setDate(current.getDate() + 1);
  }

  return newTasks;
};
