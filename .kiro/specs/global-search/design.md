# Design — 全局全文搜索

## Architecture

扩展 CommandPalette 的搜索逻辑，从 `tasks.map(t => t.title)` 改为结构化搜索索引。

```
CommandPalette.tsx (extended)
├── SearchIndex (new, in-component useMemo)
│   ├── titleIndex: Map<lowercaseKeyword, Task[]>
│   ├── tagIndex: Map<lowercaseTag, Task[]>
│   ├── projectIndex: Map<projectId, Task[]>
│   └── descriptionIndex: Map<lowercaseWord, Task[]>
├── search(query) → SearchResult[]
│   ├── Exact title match → score 100
│   ├── Partial title match → score 80
│   ├── Tag match → score 60
│   ├── Description match → score 40
│   └── Project name match → score 30
├── SearchResultItem (highlighted title + context snippet)
└── Keyboard nav (↑↓ Enter Escape)
```

## Component API

```typescript
interface SearchResult {
  task: Task;
  score: number;
  matchType: 'title' | 'tag' | 'description' | 'project';
  highlight: string; // highlighted title HTML
  context: string;   // description context snippet
}

interface CommandPaletteProps {
  // unchanged — extend internal logic only
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  tasks: Task[];      // NEW: for search
  projects: Project[]; // NEW: for project name search
  onTaskSelect: (task: Task) => void; // NEW
}
```

## Design Decisions

### D1: Client-side only
数据量 < 5000 条时，客户端搜索足够。无需 Worker 或 WASM。

### D2: 搜索索引在 useMemo 中构建
每次 tasks 变化时重建索引（O(n)）。搜索时遍历索引（O(k) where k=匹配数）。

### D3: Debounce 150ms
输入时 debounce 避免频繁重建结果列表。

### D4: 结果限制
最多显示 10 条结果，按 score 降序排列。

## Files

| File | Action | Lines |
|------|--------|-------|
| `components/CommandPalette.tsx` | Extend | +80 |
