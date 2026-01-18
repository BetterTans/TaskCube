import { RecurringRule, Task } from "../types";

/**
 * 辅助函数：为一个 Date 对象增加指定的天数。
 * @param {Date} date - 原始日期。
 * @param {number} days - 要增加的天数。
 * @returns {Date} - 计算后的新日期。
 */
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * 辅助函数：将字符串 'YYYY-MM-DD' 转换为本地时区的 Date 对象（时间设为午夜）。
 * 包含了对无效或空字符串的健壮性处理。
 * @param {string} dateStr - 日期字符串。
 * @returns {Date} - 解析后的 Date 对象。
 */
export const parseDate = (dateStr: string): Date => {
  // 对空或无效的字符串进行安全检查，防止生成 "Invalid Date"
  if (!dateStr || typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    console.warn(`Invalid date string passed to parseDate: ${dateStr}. Falling back to today.`);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 确保时间是午夜
    return today;
  }
  const parts = dateStr.split('-');
  // 月份索引是从 0 开始的
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

/**
 * 辅助函数：将 Date 对象格式化为 'YYYY-MM-DD' 字符串，并处理时区问题。
 * @param {Date} date - 要格式化的 Date 对象。
 * @returns {string} - 'YYYY-MM-DD' 格式的字符串。
 */
const formatDate = (date: Date): string => {
  // toISOString() 会转换为 UTC 时间，这里通过减去时区偏移来获取本地日期的正确字符串表示
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

/**
 * 根据周期规则生成未来的任务实例。
 * 
 * 核心逻辑：
 * 1. 确定生成范围：从规则的开始日期开始，到一个计算出的截止日期（通常是未来90天或规则的结束日期）。
 * 2. 迭代范围内的每一天。
 * 3. 对每一天，检查其是否符合规则定义的频率（每日、每周、每月等）和间隔。
 * 4. 如果日期匹配，并且数据库中尚不存在由该规则为该日期生成的任务，则创建一个新的任务实例。
 * 5. 使用安全计数器防止因逻辑错误导致的无限循环。
 * 
 * @param {RecurringRule} rule - 周期性规则对象。
 * @param {Task[]} existingTasks - 现有的任务列表，用于防止重复生成。
 * @param {string} [rangeEndStr] - 生成范围的结束日期（可选，默认向后生成 90 天）。
 * @returns {Task[]} - 新生成的任务数组。
 */
export const generateTasksFromRule = (
  rule: RecurringRule, 
  existingTasks: Task[],
  rangeEndStr?: string
): Task[] => {
  const newTasks: Task[] = [];
  const start = parseDate(rule.startDate);
  
  // 默认生成范围：从现在起往后 90 天
  const now = new Date();
  const limitDate = rangeEndStr ? parseDate(rangeEndStr) : addDays(now, 90);
  const ruleEndDate = rule.endDate ? parseDate(rule.endDate) : null;
  
  // 实际的生成截止日期取规则结束日期和系统限制日期中的较早者
  const effectiveEnd = ruleEndDate && ruleEndDate < limitDate ? ruleEndDate : limitDate;

  let current = new Date(start);

  // 安全计数器，防止因错误配置导致无限循环
  let safetyCounter = 0;
  const MAX_ITERATIONS = 1000;

  while (current <= effectiveEnd && safetyCounter < MAX_ITERATIONS) {
    safetyCounter++;
    
    let isMatch = false; // 标记当天是否符合生成条件

    // 根据不同频率类型判断是否匹配
    switch(rule.frequency) {
      case 'daily':
      case 'custom': // 自定义间隔按天处理
        const diffTime = Math.abs(current.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays % rule.interval === 0) isMatch = true;
        break;
      
      case 'weekly':
        // 检查星期几是否匹配
        if (rule.weekDays && rule.weekDays.includes(current.getDay())) {
           // 检查周间隔 (例如每 2 周)
           const msPerWeek = 1000 * 60 * 60 * 24 * 7;
           const diffWeeks = Math.floor((current.getTime() - start.getTime()) / msPerWeek);
           if (diffWeeks % rule.interval === 0) isMatch = true;
        }
        break;

      case 'monthly':
        // 检查日期（号数）是否与开始日期相同
        if (current.getDate() === start.getDate()) {
           // 检查月间隔
           const yearDiff = current.getFullYear() - start.getFullYear();
           const monthDiff = (yearDiff * 12) + (current.getMonth() - start.getMonth());
           if (monthDiff % rule.interval === 0) isMatch = true;
        }
        break;
    }

    if (isMatch) {
      const dateStr = formatDate(current);
      
      // 检查该日期是否已经存在由该规则生成的任务
      const exists = existingTasks.some(
        t => t.recurringRuleId === rule.id && t.date === dateStr
      );

      // 如果不存在且日期在规则开始日期之后（或当天），则创建任务
      if (!exists && dateStr >= rule.startDate) {
        newTasks.push({
          id: crypto.randomUUID(),
          title: rule.title,
          description: rule.description,
          priority: rule.priority,
          quadrant: rule.quadrant,
          completed: false,
          // 每个实例都从模板重新创建子任务列表
          subTasks: rule.subTaskTitles ? rule.subTaskTitles.map(t => ({
             id: crypto.randomUUID(),
             title: t,
             completed: false
          })) : [], 
          createdAt: Date.now(),
          date: dateStr,
          isExpanded: false,
          recurringRuleId: rule.id,
          projectId: rule.projectId // 任务继承规则的项目 ID
        });
      }
    }

    // 迭代到下一天
    current.setDate(current.getDate() + 1);
  }

  return newTasks;
};
