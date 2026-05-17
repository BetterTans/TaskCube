# Implementation Plan

## Task Format

- [ ] {{NUMBER}}. {{TASK_DESCRIPTION}}{{PARALLEL_MARK}}
  - Detail items
  - Observable completion condition
  - _Requirements: X.X_
  - _Boundary: ComponentName_ (for (P) tasks)
  - _Depends: X.X_ (for cross-boundary dependencies)

---

- [ ] 1. Foundation
- [ ] 1.1 (P) Extract Sidebar component from App.tsx inline JSX
  - Move sidebar JSX (~70 lines) from App.tsx into `components/Sidebar.tsx`
  - Preserve all existing functionality: view switcher (matrix/calendar/day/table), project button, recurring rules button, settings button
  - Pass viewMode, onViewModeChange, isCollapsed, onToggleCollapse as props
  - Add project list rendering with `filterProjectId` and `onProjectFilter` props
  - Add quadrant filter buttons with `filterQuadrant` and `onQuadrantFilter` props
  - Display task count badges next to each project and quadrant filter item
  - Sidebar renders correctly in both collapsed and expanded states
  - _Requirements: 4.1, 4.2, 4.4, 4.6_
  - _Boundary: Sidebar_

- [ ] 1.2 (P) Create useCalendarFilters hook
  - Create `hooks/useCalendarFilters.ts`
  - Accept `tasks`, `filterProjectId`, `filterQuadrant` as input
  - Return `filteredTasks` (AND logic when both filters active) and `counts` (per-project and per-quadrant task counts)
  - Completed tasks count toward filter totals regardless of completion status
  - Filtered task list displayed correctly when both project and quadrant filters are active
  - _Requirements: 4.5_
  - _Boundary: useCalendarFilters_

- [ ] 2. FullCalendar enhancements
- [ ] 2.1 Add inline task creation on date cell click
  - In MonthBlock, add state for `inlineInputDate` and `inlineInputValue`
  - When user clicks empty area of a date cell, show a small text input in that cell
  - Input auto-focuses; pressing Enter calls new `onInlineCreate(dateStr, title)` prop
  - Pressing Escape or clicking outside cancels input without creating task
  - Empty input + Enter does not create task
  - App.tsx wires `onInlineCreate` to call `saveTask` with defaults (date=dateStr, priority=MEDIUM, quadrant=Q2, progress=INITIAL)
  - Created task appears on calendar immediately via useLiveQuery
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - _Boundary: MonthBlock_

- [ ] 2.2 Enhance calendar task bar visual display
  - Add quadrant icon (Zap/Star/Bell/Coffee) inside each task bar element
  - Add progress status text (e.g., 初始/进行中/已完成) on the right side of each task bar
  - Task bar background color uses project color when task has a project, otherwise falls back to priority color
  - Completed tasks render with `opacity-60` and grayscale filter
  - Hover state: slight scale-up (`hover:brightness-110`) for non-completed tasks
  - All visual enhancements visible on calendar without clicking into task
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - _Boundary: MonthBlock_

- [ ] 3. (P) Create TaskDetailPanel component
  - Create `components/TaskDetailPanel.tsx`
  - Panel slides in from right side with CSS transition (`translate-x` + `transition-transform`)
  - Display all task fields: title (editable input), description (textarea), date (date input), endDate, priority (toggle buttons), quadrant (2x2 grid), progress (select), project (select), tags (pills + add input), startTime/duration (time inputs + all-day toggle), subtasks (list with add/toggle/delete)
  - Auto-save on field blur: compare current value to initial, if changed call `onUpdate(partialTask)`
  - Block save if title is empty, show inline validation message
  - Click outside panel or close button dismisses panel
  - Clicking another task while panel is open switches panel content to new task
  - Delete button in panel shows confirmation, then deletes task and closes panel
  - "More details" button opens TaskDetailModal for recurring rules and dependency editing
  - Panel renders correctly at all viewport sizes, calendar remains visible and interactive
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_
  - _Boundary: TaskDetailPanel_

- [ ] 4. App.tsx integration
- [ ] 4.1 Wire Sidebar with filters into App.tsx layout
  - Replace inline sidebar JSX with `<Sidebar>` component
  - Add `filterProjectId` and `filterQuadrant` state in App.tsx
  - Pass filter state and callbacks to Sidebar
  - Calendar receives filtered tasks via useCalendarFilters hook
  - Sidebar filter selection updates calendar content in real time
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - _Depends: 1.1, 1.2_

- [ ] 4.2 Wire TaskDetailPanel and inline creation into App.tsx
  - Add `selectedTaskId` state; derive `selectedTask` from tasks array
  - Wire FullCalendar's `onInlineCreate` to call `saveTask` with defaults
  - Wire FullCalendar's `onTaskClick` to set `selectedTaskId` and open TaskDetailPanel
  - Wire TaskDetailPanel's `onUpdate` to call `saveTask`
  - Wire TaskDetailPanel's `onDelete` to call `deleteTask`
  - Replace EventPopover usage in calendar context (keep for other views)
  - Side panel opens on task click; inline creation saves and shows new task
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.5, 2.7_
  - _Depends: 2.1, 2.2, 3_

- [ ] 4.3 Connect TaskDetailPanel to TaskDetailModal for complex editing
  - "More details" button in TaskDetailPanel sets `editingTask` and opens TaskDetailModal
  - Closing TaskDetailModal returns to side panel view (re-open panel)
  - Recurring rules, dependencies, and AI features accessible via modal, not duplicated in panel
  - Complex editing flow works end-to-end without data loss
  - _Requirements: 2.2_
  - _Depends: 3, 4.2_

- [ ] 5. Validation
- [ ] 5.1 Test core user flows end-to-end
  - Click date → type title → Enter → task appears on calendar with correct defaults
  - Click task on calendar → side panel opens → modify priority → click outside → reopen panel → confirm change persisted
  - Select project filter → calendar shows only that project's tasks → select quadrant filter → calendar shows intersection
  - Click "More details" → TaskDetailModal opens with task data → edit recurring rule → save → side panel reopens
  - Delete task from side panel → confirm → task removed from calendar
  - All 23 acceptance criteria verified
  - _Requirements: 1.1–5.5_

- [ ] 5.2 Test import backward compatibility
  - Export current data as backup JSON
  - Clear IndexedDB, import a v1.0 format backup (no progress field), verify progress auto-filled correctly
  - Clear IndexedDB, import a v1.1 format backup, verify all tasks/projects/rules/settings restored
  - TaskDetailPanel and inline creation work correctly with imported tasks
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
