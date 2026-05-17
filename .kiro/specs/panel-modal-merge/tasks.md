# Tasks — 合并任务编辑组件

> **Goal:** Extract TaskEditorCore, refactor Panel + Modal to use it. Reduce 1454→~980 lines.

### Task 1.1: Create TaskEditorCore skeleton
- Create `components/TaskEditorCore.tsx`
- Define Props interface (mode, task, projects, onChange, etc.)
- Render fields for mode='panel' only (no auto-save, no AI)
- _Files:_ Create `components/TaskEditorCore.tsx`

### Task 1.2: Migrate all edit fields to TaskEditorCore
- Title, description, date, endDate, startTime, duration
- Priority toggle, Quadrant grid, Progress select
- Project dropdown, Tags input, SubTasks list
- All onChange callbacks wired
- _Files:_ `TaskEditorCore.tsx`

### Task 1.3: Refactor TaskDetailPanel to use TaskEditorCore
- Replace inline field JSX with `<TaskEditorCore mode="panel" .../>`
- Keep onBlur auto-save in Panel layer
- Keep panel slide animation
- Keep "More details" button
- _Files:_ `TaskDetailPanel.tsx` (~763 → ~350 lines)

### Task 1.4: Refactor TaskDetailModal to use TaskEditorCore
- Replace inline field JSX with `<TaskEditorCore mode="modal" .../>`
- Keep AI smart fill, recurring rule, dependency sections
- Reduce to ~350 lines
- _Files:_ `TaskDetailModal.tsx` (~691 → ~350 lines)

### Task 1.5: Test & commit
- npx tsc --noEmit
- Manual: create task in Panel, verify all fields save
- Manual: open Modal from Panel, verify data pre-filled
- Manual: edit in Panel → open Modal → verify data sync
- _Verify:_ All existing task operations unchanged
