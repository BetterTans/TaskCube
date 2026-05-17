# Design Document — 筛选修复与体验打磨

## Architecture

### 布局变更（前后对比）

**Before:**
```
┌─ Sidebar ─────┬─ Header ───────────────────────┐
│ View Switcher │  ◀▶ date         [+ 新建任务]   │
│ ────────────  ├─ Main ─────────────────────────┤
│ 项目筛选      │                                  │
│ 象限筛选      │         View Content             │
│ ────────────  │                                  │
│ 周期规则      │                                  │
│ 设置          │                                  │
└───────────────┴──────────────────────────────────┘
```

**After:**
```
┌─ Header ────────────────────────────────────────────────┐
│  ◀▶ date   [四象限] [月视图] [日视图] [列表]   [+ 新建] │
├── Sidebar ──┬─ Main ────────────────────────────────────┤
│ NextDo      │  [FilterIndicator — 筛选激活时显示]       │
│ ──────────  │                                           │
│ 项目筛选    │                                           │
│ 象限筛选    │             View Content                  │
│ ──────────  │                                           │
│ 周期规则    │                                           │
│ 设置        │                                           │
└─────────────┴───────────────────────────────────────────┘
```

### Component Tree

```
App
├── Header (重设计)
│   ├── NavArrows + DateDisplay (条件渲染：月/日视图)
│   ├── DateRangeInputs (条件渲染：四象限视图)
│   ├── ViewTabs [四象限 | 月视图 | 日视图 | 列表]
│   └── ActionButtons [+ 新建任务]
├── Sidebar (精简: 移除 ViewSwitcher)
│   ├── Logo
│   ├── Filters (overflow-y-auto, flex-1, min-h-0)
│   │   ├── ProjectFilter (max-h scroll)
│   │   └── QuadrantFilter (max-h scroll)
│   └── BottomActions (shrink-0)
├── Main
│   ├── FilterIndicator (非月视图 + 筛选激活时)
│   └── CurrentView (filteredTasks prop)
└── Modals + Panels (不变)
```

---

## Design Decisions

### D1: ViewTabs 组件

独立组件，放在 Header 中央：

```tsx
const ViewTabs = ({ viewMode, onChange }) => {
  const tabs = [
    { id: 'matrix',   icon: LayoutGrid,   label: '四象限' },
    { id: 'calendar', icon: CalendarIcon, label: '月视图' },
    { id: 'day',      icon: Clock,         label: '日视图' },
    { id: 'table',    icon: TableIcon,     label: '列表'   },
  ];
  
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

样式参考: Notion/Linear 的 segment control 风格。

### D2: Header 布局

三段式 flex 布局：
- Left: 导航箭头 + 日期（月/日视图）或日期范围选择器（四象限）
- Center: ViewTabs
- Right: 新建任务按钮

```tsx
<header className="... flex items-center justify-between">
  <div className="flex items-center gap-3">
    {/* 日期导航 — 仅月/日视图 */}
  </div>
  <ViewTabs viewMode={viewMode} onChange={setViewMode} />
  <div className="flex items-center gap-2">
    <button>+ 新建任务</button>
  </div>
</header>
```

### D3: Sidebar 变更

移除整个 View Switcher section（lines 66-82），其余不变。

```
Before:                           After:
┌─ Sidebar ──────┐               ┌─ Sidebar ──────┐
│ Logo            │               │ Logo            │
│ View Switcher   │  ← 移除      │                │
│ Divider         │               │ Divider         │
│ Filters         │               │ Filters (滚动)  │
│ spacer          │               │ spacer → 移除   │
│ Divider         │               │ Divider         │
│ Bottom actions  │               │ Bottom actions  │
└─────────────────┘               └─────────────────┘
```

Filters 区域改为 `flex-1 min-h-0 overflow-y-auto`，底部按钮 `shrink-0`。

### D4: 键盘快捷键保持

`toggleView` (v 键) 保持不变，仍然循环切换四个视图。CommandPalette 中的「切换视图」也保留。

### D5: 响应式

小屏幕（<640px）：Tab 只显示图标，隐藏文字标签。左侧导航箭头日期在小屏幕时缩小字体。

---

## File Change Summary

| # | File | Change |
|---|------|--------|
| 1 | `hooks/useCalendarFilters.ts` → `hooks/useTaskFilters.ts` | Rename |
| 2 | `App.tsx` | Import rename; new ViewTabs in header; pass filteredTasks to all views; add FilterIndicator |
| 3 | `components/Sidebar.tsx` | Remove ViewSwitcher; add scroll containers |
| 4 | `components/FilterIndicator.tsx` | New: filter status banner |
| 5 | `components/ViewTabs.tsx` | New: header tab bar |
