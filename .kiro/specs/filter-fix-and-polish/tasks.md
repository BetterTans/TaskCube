# Implementation Plan — 筛选修复与体验打磨

> **For Hermes:** Execute tasks in order. Task 1-3 can be parallel. Commit after each.

**Goal:** Fix filter propagation, sidebar overflow, move view switcher to header tab bar, add filter indicator

**Architecture:** Header gains ViewTabs; Sidebar loses ViewSwitcher; filteredTasks pass to all views

**Tech Stack:** React 19, TypeScript, Tailwind CSS, lucide-react

---

### Task 1: Rename useCalendarFilters → useTaskFilters

**Objective:** Rename hook to accurately reflect cross-view usage

**Files:**
- Rename: `hooks/useCalendarFilters.ts` → `hooks/useTaskFilters.ts`
- Modify: `App.tsx:21,100`

**Commands:**
```bash
mv hooks/useCalendarFilters.ts hooks/useTaskFilters.ts
```

In `hooks/useTaskFilters.ts`: `useCalendarFilters` → `useTaskFilters`

In `App.tsx`:
- Line 21: `import { useCalendarFilters } from './hooks/useCalendarFilters.ts'` → `import { useTaskFilters } from './hooks/useTaskFilters.ts'`
- Line 100: `useCalendarFilters(` → `useTaskFilters(`

**Verify:** `npx tsc --noEmit` — no new errors

**Commit:** `refactor: rename useCalendarFilters to useTaskFilters`

---

### Task 2: Fix filter propagation to all views

**Objective:** Pass `filteredTasks` to all views, not just calendar

**Files:** `App.tsx:397-399`

**Change:** In `renderCurrentView()`, replace all `tasks={tasks}` with `tasks={filteredTasks}` on day/matrix/table views.

Before:
```tsx
case 'day': return <DayTimeView ... tasks={tasks} ... />;
case 'matrix': return <MatrixView tasks={tasks} ... />;
case 'table': return <TableView tasks={tasks} ... />;
```

After:
```tsx
case 'day': return <DayTimeView ... tasks={filteredTasks} ... />;
case 'matrix': return <MatrixView tasks={filteredTasks} ... />;
case 'table': return <TableView tasks={filteredTasks} ... />;
```

**Verify:** `npx tsc --noEmit` — all view props accept `Task[]`

**Commit:** `fix: propagate sidebar filters to all views`

---

### Task 3: Add scroll containers to Sidebar + remove ViewSwitcher

**Objective:** Prevent overflow; prepare sidebar for header tab migration

**Files:** `components/Sidebar.tsx`

**Step 1:** Remove ViewSwitcher section (lines 66-82):
```tsx
{/* View Switcher */}
<nav className="space-y-1 mb-3">
  {viewOptions.map(view => (...))}
</nav>
```
DELETE this entire block.

**Step 2:** Remove the `viewOptions` constant (lines 23-28):
```tsx
const viewOptions: { id: ViewMode; icon: React.ElementType; title: string }[] = [...];
```
DELETE.

**Step 3:** Remove unused `viewMode`/`onViewModeChange` from props interface and destructuring:
In interface (lines 8-9): remove `viewMode: ViewMode;` and `onViewModeChange: (mode: ViewMode) => void;`
In destructuring (lines 41-42): remove `viewMode,` and `onViewModeChange,`

**Step 4:** Adjust imports — remove unused icon imports (`LayoutGrid`, `CalendarIcon`, `Clock`, `TableIcon`):
```tsx
import { Box, Briefcase, Repeat, Settings, PanelLeftClose, PanelRightClose, Zap, Star, Bell, Coffee } from 'lucide-react';
```

**Step 5:** Wrap filters in scrollable container. Replace (lines 88-154):
```tsx
{!isCollapsed && (
  <>
    {/* Project Filter */}
    <div className="mb-3">
      ...
      <div className="space-y-0.5">
        ...
      </div>
    </div>
    {/* Quadrant Filter */}
    <div className="mb-3">...</div>
  </>
)}
{/* Spacer */}
<div className="flex-1" />
```

With:
```tsx
{!isCollapsed && (
  <div className="overflow-y-auto min-h-0 flex-1">
    {/* Project Filter */}
    <div className="mb-3">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">项目</span>
        <button onClick={onOpenProjects} className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 p-0.5 rounded transition-colors">
          <Briefcase size={14} />
        </button>
      </div>
      <div className="space-y-0.5 max-h-[35vh] overflow-y-auto">
        <button onClick={() => onProjectFilter(null)} className={`${btnBase} ${filterProjectId === null ? activeClass : inactiveClass}`}>
          <span>全部项目</span>
        </button>
        {projects.map(p => (
          <button key={p.id} onClick={() => onProjectFilter(p.id === filterProjectId ? null : p.id)} className={`${btnBase} ${filterProjectId === p.id ? activeClass : inactiveClass}`}>
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="truncate flex-1">{p.title}</span>
            {(taskCounts.projects[p.id] || 0) > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">{taskCounts.projects[p.id]}</span>
            )}
          </button>
        ))}
      </div>
    </div>
    {/* Quadrant Filter */}
    <div className="mb-3">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">象限</span>
      <div className="space-y-0.5 mt-1 max-h-[25vh] overflow-y-auto">
        <button onClick={() => onQuadrantFilter(null)} className={`${btnBase} ${filterQuadrant === null ? activeClass : inactiveClass}`}>
          <span>全部象限</span>
        </button>
        {quadrantOptions.map(q => {
          const Icon = q.icon;
          const count = taskCounts.quadrants[q.id] || 0;
          return (
            <button key={q.id} onClick={() => onQuadrantFilter(q.id === filterQuadrant ? null : q.id)} className={`${btnBase} ${filterQuadrant === q.id ? activeClass : inactiveClass}`}>
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate flex-1">{q.label}</span>
              {count > 0 && <span className="text-xs text-gray-400 dark:text-gray-500">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  </div>
)}
```

Remove the separate `<div className="flex-1" />` spacer.

**Step 6:** Ensure bottom actions are shrink-0:
```tsx
<div className="flex flex-col gap-1 shrink-0">
```

**Verify:** `npm run dev` → add 15 projects → verify scrollbar, verify no view switcher, verify bottom buttons

**Commit:** `fix: add scroll containers, remove ViewSwitcher from sidebar`

---

### Task 4: Create ViewTabs component

**Objective:** Header tab bar for view switching

**Files:** Create `components/ViewTabs.tsx`

```tsx
import React from 'react';
import { LayoutGrid, Calendar as CalendarIcon, Clock, Table as TableIcon } from 'lucide-react';

type ViewMode = 'calendar' | 'day' | 'matrix' | 'table';

interface ViewTabsProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const tabs: { id: ViewMode; icon: React.ElementType; label: string }[] = [
  { id: 'matrix',   icon: LayoutGrid,   label: '四象限' },
  { id: 'calendar', icon: CalendarIcon, label: '月视图' },
  { id: 'day',      icon: Clock,         label: '日视图' },
  { id: 'table',    icon: TableIcon,     label: '列表'   },
];

export const ViewTabs: React.FC<ViewTabsProps> = ({ viewMode, onChange }) => {
  return (
    <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-all duration-200
            ${viewMode === tab.id
              ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}
          `}
        >
          <tab.icon size={14} />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
```

**Verify:** `npx tsc --noEmit` — component compiles

**Commit:** `feat: add ViewTabs header component`

---

### Task 5: Integrate ViewTabs into App.tsx Header

**Objective:** Replace sidebar view switching with header tab bar

**Files:** `App.tsx`

**Step 1:** Import ViewTabs:
```typescript
import { ViewTabs } from './components/ViewTabs.tsx';
```

**Step 2:** Restructure Header (lines 423-443). Replace current header:
```tsx
<header className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg px-6 py-4 shrink-0 z-20 border-b border-gray-100 dark:border-zinc-800 transition-colors flex items-center justify-between">
  <div className="flex items-center h-full">
      {(viewMode === 'calendar' || viewMode === 'day') && (
         <div className="flex items-center animate-in fade-in duration-200">
           <button onClick={...}><ChevronLeft size={20} /></button>
           <span className="text-xl font-bold ...">{...}</span>
           <button onClick={...}><ChevronRight size={20} /></button>
         </div>
      )}
      {viewMode === 'matrix' && (
         <div className="flex items-center gap-2 animate-in fade-in duration-200">
            <input type="date" value={matrixDateRange.start} ... />
            <span className="text-gray-400">-</span>
            <input type="date" value={matrixDateRange.end} ... />
         </div>
      )}
  </div>
  <div className="flex items-center gap-3">
      <button onClick={() => openNewTaskModal(getTodayString())} className="...">+ 新建任务</button>
   </div>
</header>
```

With:
```tsx
<header className="bg-white/50 dark:bg-zinc-900/50 backdrop-blur-lg px-4 sm:px-6 py-3 shrink-0 z-20 border-b border-gray-100 dark:border-zinc-800 transition-colors flex items-center justify-between gap-3">
  {/* Left: Date navigation */}
  <div className="flex items-center min-w-0">
    {(viewMode === 'calendar' || viewMode === 'day') && (
      <div className="flex items-center animate-in fade-in duration-200">
        <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - (viewMode === 'calendar' ? 1 : 0), d.getDate() - (viewMode === 'day' ? 1 : 0)))} className="text-indigo-600 dark:text-indigo-400 p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 flex-shrink-0"><ChevronLeft size={18} /></button>
        <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mx-2 min-w-[80px] sm:min-w-[120px] text-center truncate">{viewMode === 'day' ? (getTodayString(currentDate) === TODAY ? '今天' : `${currentDate.getMonth()+1}月${currentDate.getDate()}日`) : `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`}</span>
        <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + (viewMode === 'calendar' ? 1 : 0), d.getDate() + (viewMode === 'day' ? 1 : 0)))} className="text-indigo-600 dark:text-indigo-400 p-2 rounded-lg hover:bg-gray-200/50 dark:hover:bg-zinc-700/50 flex-shrink-0"><ChevronRight size={18} /></button>
      </div>
    )}
    {viewMode === 'matrix' && (
      <div className="flex items-center gap-2 animate-in fade-in duration-200">
        <input type="date" value={matrixDateRange.start} onChange={(e) => setMatrixDateRange(r => ({ ...r, start: e.target.value }))} className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-300 dark:color-scheme-dark h-9"/>
        <span className="text-gray-400 text-sm">-</span>
        <input type="date" value={matrixDateRange.end} onChange={(e) => setMatrixDateRange(r => ({ ...r, end: e.target.value }))} className="bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-500 text-gray-700 dark:text-gray-300 dark:color-scheme-dark h-9"/>
      </div>
    )}
  </div>

  {/* Center: View Tabs */}
  <ViewTabs viewMode={viewMode} onChange={setViewMode} />

  {/* Right: Actions */}
  <div className="flex items-center gap-2 flex-shrink-0">
    <button onClick={() => openNewTaskModal(getTodayString())} className="px-3 sm:px-4 py-2 flex items-center justify-center gap-1.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-sm font-medium" title="添加新任务 (N)"><Plus size={16} /> <span className="hidden sm:inline">新建任务</span></button>
  </div>
</header>
```

**Step 3:** Remove `viewMode` and `onViewModeChange` props from Sidebar:
```tsx
<Sidebar
  // viewMode={viewMode}              ← 删除
  // onViewModeChange={setViewMode}   ← 删除
  filterProjectId={filterProjectId}
  ...
/>
```

**Verify:** `npx tsc --noEmit` → `npm run dev` → verify tabs work, sidebar has no view switcher

**Commit:** `feat: move view switching to header tab bar`

---

### Task 6: Create FilterIndicator component

**Objective:** Show active filter status in non-calendar views

**Files:** Create `components/FilterIndicator.tsx`, modify `App.tsx`

Create `components/FilterIndicator.tsx`:
```tsx
import React from 'react';
import { X, Filter } from 'lucide-react';
import { EisenhowerQuadrant, Project } from '../types.ts';

const quadrantLabels: Record<EisenhowerQuadrant, string> = {
  [EisenhowerQuadrant.Q1]: 'Q1 重要紧急',
  [EisenhowerQuadrant.Q2]: 'Q2 重要不紧急',
  [EisenhowerQuadrant.Q3]: 'Q3 紧急不重要',
  [EisenhowerQuadrant.Q4]: 'Q4 不重要不紧急',
};

interface FilterIndicatorProps {
  filterProjectId: string | null;
  filterQuadrant: EisenhowerQuadrant | null;
  projects: Project[];
  onClearProject: () => void;
  onClearQuadrant: () => void;
}

export const FilterIndicator: React.FC<FilterIndicatorProps> = ({
  filterProjectId, filterQuadrant, projects, onClearProject, onClearQuadrant,
}) => {
  if (!filterProjectId && !filterQuadrant) return null;

  const projectName = filterProjectId
    ? projects.find(p => p.id === filterProjectId)?.title ?? null
    : null;

  return (
    <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 animate-in slide-in-from-top-2 duration-200">
      <Filter size={12} className="flex-shrink-0" />
      {projectName && (
        <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 border border-indigo-200 dark:border-indigo-700">
          {projectName}
          <button onClick={onClearProject} className="hover:text-red-500 transition-colors"><X size={12} /></button>
        </span>
      )}
      {filterQuadrant && (
        <span className="inline-flex items-center gap-1 bg-white dark:bg-zinc-800 rounded-full px-2 py-0.5 border border-indigo-200 dark:border-indigo-700">
          {quadrantLabels[filterQuadrant]}
          <button onClick={onClearQuadrant} className="hover:text-red-500 transition-colors"><X size={12} /></button>
        </span>
      )}
    </div>
  );
};
```

In `App.tsx`, import FilterIndicator and add after header, before main:
```tsx
{viewMode !== 'calendar' && (
  <FilterIndicator
    filterProjectId={filterProjectId}
    filterQuadrant={filterQuadrant}
    projects={projects ?? []}
    onClearProject={() => setFilterProjectId(null)}
    onClearQuadrant={() => setFilterQuadrant(null)}
  />
)}
```

**Verify:** `npx tsc --noEmit` → `npm run dev` → select filter in sidebar → switch to non-calendar view → verify indicator

**Commit:** `feat: add filter status indicator for non-calendar views`

---

### Task 7: Final validation

**Objective:** Verify all fixes + new features end-to-end

**Step 1: TypeScript check**
```bash
npx tsc --noEmit
```

**Step 2: Smoke test checklist**
- [ ] Header shows ViewTabs, clicking switches views
- [ ] Sidebar has NO view switcher, only filters + bottom actions
- [ ] Project filter → switch all 4 views via tabs → filter persists
- [ ] Quadrant filter → switch all 4 views → filter persists
- [ ] Both filters → all views → AND logic works
- [ ] Filter indicator shows in day/matrix/table views when filter active
- [ ] Click × on indicator clears filter
- [ ] 15+ projects → sidebar scrolls, bottom buttons visible
- [ ] Collapse/expand sidebar → layout correct, tabs still visible
- [ ] Keyboard `/v` still toggles views
- [ ] Calendar inline create still works
- [ ] TaskDetailPanel still works
- [ ] Dark mode works with new header tabs

**Step 3: Commit**
```bash
git add -A && git commit -m "chore: final validation for filter-fix-and-polish"
```
