# Tasks — 全局全文搜索

> **Goal:** Extend CommandPalette with full-text search across title/description/tags/projects.

### Task 2.1: Build SearchIndex hook
- Create `hooks/useSearchIndex.ts`
- Input: tasks[], projects[]
- Output: search(query) → SearchResult[]
- Index: title, tags, description words, project names
- _Files:_ Create `hooks/useSearchIndex.ts`

### Task 2.2: Extend CommandPalette with search results
- Add `tasks` and `projects` props
- When input has text, show search results instead of commands
- Debounce 150ms input
- Render SearchResultItem with highlight + context snippet
- _Files:_ `components/CommandPalette.tsx`

### Task 2.3: Add SearchResultItem component
- Highlighted title (match text in yellow/amber)
- Description context (20 chars around match)
- Tag badge / Project color dot for tag/project matches
- Click or Enter → onTaskSelect
- _Files:_ `components/CommandPalette.tsx` (inline or extract)

### Task 2.4: Wire up in App.tsx
- Pass tasks and projects to CommandPalette
- onTaskSelect → openEditModal (table) or setSelectedTaskId (calendar)
- _Files:_ `App.tsx`

### Task 2.5: Test & commit
- Search by title partial match
- Search by tag name
- Search by project name
- Search by description keyword
- Verify debounce, empty state, keyboard nav
