# Research Log

## Discovery Scope
Light discovery for extension feature. Calendar-hub extends existing month view without changing data models or introducing new dependencies.

## Key Findings

### Extension Point Analysis
- FullCalendar.tsx MonthBlock: Already has date click handling via `onDateClick`. Adding inline input means capturing clicks on empty areas vs. task bars.
- App.tsx sidebar: Currently 70+ lines of JSX inline. Extraction to Sidebar.tsx is straightforward refactoring.
- EventPopover → TaskDetailPanel: The popover shows limited info (title, date, project, priority badge, progress badge). The side panel needs all editable fields.
- TaskDetailModal: 691 lines, handles all task creation/editing including recurring rules and dependencies. Keeping it for complex editing avoids scope creep.

### Build vs. Adopt
- No new libraries needed. All functionality achievable with existing React + Tailwind + Dexie stack.
- Side panel animation uses CSS transitions (Tailwind `translate-x` + `transition-all`), no animation library needed.

### Integration Risk
- **Low risk**: Data model unchanged, import/export untouched
- **Medium risk**: MonthBlock changes — must distinguish between date click (create) and task click (edit), and between empty area click vs. date number button click
- **Low risk**: Sidebar extraction — pure refactoring, no logic changes

## Design Decisions
1. **Keep TaskDetailModal**: For recurring rule editing and dependency management, the full modal remains the right UX. Side panel links to it for complex cases.
2. **Calendar filtering in App.tsx**: Filter state lives in App.tsx (not in a context/provider) to match existing state management pattern. useCalendarFilters hook computes derived filtered data.
3. **Inline input per date cell**: Internal state in MonthBlock (which date has active input), avoids lifting input state to parent. On submit, callback to parent.

## Synthesis Outcomes
- **Generalization**: The inline create and modal create share the same `saveTask` function — no new API needed
- **Simplification**: Side panel replaces EventPopover for calendar tasks; popover retained for backward compatibility in other views
- **No new abstractions**: This feature adds components, not layers
