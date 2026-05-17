# Design — AI 智能排程

## Architecture

```typescript
// services/aiService.ts (extend)
export const suggestTimeSlot = async (
  task: Partial<Task>,
  dateStr: string,
  existingTasks: Task[],
  settings: AISettings
): Promise<{ startTime: string; reason: string }[]>
```

## Flow
1. User creates task → sets date
2. AI analyzes: existing tasks on that date, task priority/quadrant
3. AI returns 2-3 recommended time slots
4. User picks one → auto-fills startTime

## UI
- "AI 推荐时间" button in TaskEditorCore
- Slot suggestions shown as pills below date field
- Each pill shows time + short reason
- DayTimeView: vacant slots highlighted with subtle dashed border

## Data Compat
- No new fields. AI analysis is ephemeral.
