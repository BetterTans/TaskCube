# Design — 专注模式

## Architecture

```typescript
// components/FocusTimer.tsx
// Schema v6: db.focusSessions
interface FocusSession {
  id: string;
  taskId?: string;
  projectId?: string;
  startTime: number;
  endTime?: number;
  duration: number; // planned minutes
  actualDuration?: number; // actual
  completed: boolean;
}
```

## UI
- Floating timer overlay (bottom-right) or sidebar panel
- Circular countdown + task title
- Sound: Web Audio API short beep (no audio files needed)
- Break timer after focus session

## Stats
- FocusStats component: today's total, weekly trend bars (CSS only)
- Per-project breakdown

## Data Compat
- New `focusSessions` table (v6)
- Backup v2.0 includes focusSessions
- v1.x import → empty focusSessions
