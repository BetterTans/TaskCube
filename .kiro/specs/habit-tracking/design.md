# Design — 习惯追踪

## Architecture
No new database table. All computed from existing task.completed + task.date + recurringRule.

```typescript
// utils/habitStats.ts
export function getHabitStreak(tasks: Task[], ruleId: string): {
  currentStreak: number;
  bestStreak: number;
  completionRate: number; // last 30 days
  dailyStatus: { date: string; completed: boolean }[]; // last 7 days
}
```

## UI
- New tab in header: "习惯" (Flame icon)
- Grid of habit cards with 7-day dot matrix
- Click card → expand to monthly heatmap (CSS Grid 7xN)

## Heatmap
- 7 columns (Sun-Sat), N rows (weeks)
- Color: green gradient based on completion count
- Pure CSS grid — no chart library

## Data Compat
- No schema change. Statistics computed from existing data.
- Legacy tasks automatically contribute to habit history.
