# Design — 撤销/重做

## Architecture

UndoStack 为 React state（会话级，不持久化）。通过 wrapper 函数拦截所有 db.tasks 操作。

```typescript
// hooks/useUndoStack.ts
interface UndoEntry {
  id: string;
  type: 'create' | 'update' | 'delete' | 'subtask';
  description: string; // "创建「标题」"
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

function useUndoStack(maxSize = 50) {
  // stack[], pointer
  // push(entry), undo(), redo()
  // canUndo, canRedo
}
```

## Integration
- Wrap saveTask/deleteTask/toggleTask in App.tsx with undo stack
- Keyboard: Ctrl+Z / Ctrl+Shift+Z via useHotkeys
- Toast: 「已撤销 创建」「重做」button

## Files
- Create: `hooks/useUndoStack.ts` (~80 lines)
- Modify: `App.tsx` (+60 lines)

## Data Compat
- Undo stack lives in memory only
- No schema change
