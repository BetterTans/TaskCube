# Research — 筛选修复与体验打磨

## Bug 1: 筛选器仅在月视图生效

### 根因定位

`App.tsx` 第 396-399 行 `renderCurrentView()` 中：

```tsx
case 'calendar': return ... tasks={filteredTasks} ...   // ✅ 筛选生效
case 'day':      return <DayTimeView tasks={tasks} ... />     // ❌ 原始数据
case 'matrix':   return <MatrixView tasks={tasks} ... />      // ❌ 原始数据
case 'table':    return <TableView tasks={tasks} ... />       // ❌ 原始数据
```

只有月视图接收了 `useCalendarFilters` 处理后的 `filteredTasks`，其他三个视图直接使用未筛选的 `tasks`。

### 修复方案

将 `tasks={filteredTasks}` 传递给所有四个视图。所有视图组件接口均接受 `tasks: Task[]`，无需改接口。

### 影响分析

| 视图 | 当前行为 | 修复后行为 |
|------|---------|-----------|
| 月视图 (FullCalendar) | ✅ 筛选生效 | 不变 |
| 日视图 (DayTimeView) | ❌ 筛选无效 | ✅ 筛选生效 |
| 四象限 (MatrixView) | ❌ 筛选无效 | ✅ 筛选生效 |
| 列表 (TableView) | ❌ 侧边栏筛选无效 | ✅ 侧边栏筛选 + 表内筛选叠加 |

TableView 有自己的 `TableFilters`（状态/优先级/项目/象限/进展/日期/标签/搜索），修复后侧边栏筛选作为第一层过滤，表内筛选作为第二层。这是正确行为。

## Bug 2: 侧边栏项目列表溢出

### 根因定位

`Sidebar.tsx` 第 98-118 行：

```tsx
<div className="space-y-0.5">
  {/* 全部项目按钮 */}
  {projects.map(p => (...))}  {/* 所有项目遍历，无高度限制 */}
</div>
```

项目列表无 `overflow-y-auto` 或 `max-h` 约束。侧边栏使用 `flex flex-col` 布局，`space-y-0.5` 内的内容会无限延伸，挤压下方按钮。

### 布局结构

```
aside (flex flex-col h-screen)
├── Logo + 标题
├── View Switcher (4 buttons)
├── Divider
├── 筛选区域 ← overflow 发生在这里
│   ├── 项目筛选 (全部项目 + N projects)
│   └── 象限筛选 (全部象限 + 4 quadrants)
├── flex-1 spacer
├── Divider
└── 底部按钮 (周期规则 + 设置)
```

修复：给筛选区域添加 `overflow-y-auto` + `min-h-0`（flex 子元素需要 min-h:0 才能正确收缩），给项目列表特别加 `max-h-[35vh]`。

## 改进机会

### 1. Hook 命名
- `useCalendarFilters` → `useTaskFilters`：该 hook 不限于日历，被所有视图使用

### 2. 筛选指示缺失
- 切换到非月视图时，用户不知道筛选在生效
- 可在视图顶部加轻量指示条

### 3. 代码现状
- TypeScript strict 模式未开启
- 无自动化测试
- `useLiveQuery` 返回 `undefined` 时有骨架屏处理，完善

### 4. calendar-hub spec 状态
- 大部分已实现（Sidebar、useCalendarFilters、TaskDetailPanel、日历增强）
- tasks 1.1, 1.2, 2.1, 2.2, 3, 4.1, 4.2 已实现
- tasks 4.3, 5.1, 5.2 待完成
- **但 Requirement 4 中明确写了「侧边栏筛选器」应全局生效** — 当前实现在 `App.tsx` 4.1 集成时漏掉了非日历视图的筛选传递

## 文件影响范围

| 文件 | 修改类型 | 原因 |
|------|---------|------|
| `App.tsx` | 修改 | 传递 filteredTasks 给所有视图，重命名 hook |
| `hooks/useCalendarFilters.ts` | 重命名 | → `useTaskFilters.ts` |
| `components/Sidebar.tsx` | 修改 | 添加 overflow scroll |
| `components/FilterIndicator.tsx` | 新建 | 筛选状态指示条 |
