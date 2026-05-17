# Design — 合并任务编辑组件

## Architecture

```
Before:
  TaskDetailPanel (763 lines)        TaskDetailModal (691 lines)
  ┌─ 标题、描述、日期... ─┐          ┌─ 标题、描述、日期... ─┐
  │ 优先级、象限、进度...  │          │ 优先级、象限、进度...  │
  │ 项目、标签、子任务...  │          │ 项目、标签、子任务...  │
  │ 自动保存 onBlur       │          │ AI 智能填充           │
  │ 「更多详情」→ Modal   │          │ 重复规则编辑           │
  └───────────────────────┘          │ 前置依赖管理           │
                                     └───────────────────────┘

After:
  TaskEditorCore (~280 lines)
  ┌─ 共享字段渲染 ────────┐
  │ 标题、描述、日期       │
  │ 优先级、象限、进度     │
  │ 项目选择、标签、子任务 │
  │ 开始时间/时长          │
  └───────────────────────┘
       ↑ prop: mode='panel' | 'modal'
       │
  ┌────┴───────────────────────┐
  │ TaskDetailPanel (~350行)    │  TaskDetailModal (~350行)
  │ 自动保存 onBlur            │  AI 智能填充
  │ 滑入/滑出动画              │  重复规则编辑
  │ 「更多详情」→ Modal        │  前置依赖管理
  └────────────────────────────┘
```

## Component API

### TaskEditorCore
```typescript
interface TaskEditorCoreProps {
  task: Partial<Task>;
  projects: Project[];
  allTasks: Task[];
  mode: 'panel' | 'modal';
  onChange: (partial: Partial<Task>) => void;
  onSubTaskChange: (subTasks: SubTask[]) => void;
  onDelete?: () => void;
  addToast: (msg: string, type: 'success' | 'error') => void;
}
```

### TaskDetailPanel (refactored)
```typescript
interface TaskDetailPanelProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskData: Partial<Task>, ruleData?: Partial<RecurringRule>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  projects: Project[];
  allTasks: Task[];
  // ... existing props kept
}
```

## Design Decisions

### D1: mode prop over separate components
`mode: 'panel' | 'modal'` 比「两个字段渲染组件」更简洁。差异仅在外层容器和交互。

### D2: Panel 保持 onBlur 自动保存
Panel 的自动保存逻辑保留在 Panel 层，不放入 Core。Core 只负责渲染 + onChange 回调。

### D3: Modal 瘦身为「高级编辑」
Modal 不再渲染所有字段，仅保留 Panel 不方便的：
- AI 智能填充（自然语言输入）
- 重复规则编辑
- 前置/后置依赖管理

常用编辑（标题、优先级、项目等）在 Panel 完成。

### D4: 历史数据
无 schema 变更，无新字段。Task 接口不变。

## Files

| File | Action | Lines |
|------|--------|-------|
| `components/TaskEditorCore.tsx` | Create | ~280 |
| `components/TaskDetailPanel.tsx` | Rewrite | 763→~350 |
| `components/TaskDetailModal.tsx` | Rewrite | 691→~350 |
| `App.tsx` | Minor update | 不变 |
