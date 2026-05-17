# Design — 提醒与通知

## Architecture

```typescript
// New field in Task:
reminderOffset?: number; // minutes before task time. undefined = no reminder

// services/reminderService.ts
- requestPermission(): Promise<boolean>
- checkReminders(tasks: Task[]): void  // called every 60s
- scheduleReminder(task: Task): void
- showNotification(task: Task): void
```

## Integration
- Reminder field in TaskEditorCore (after merge)
- Check every 60s via setInterval in App.tsx useEffect
- Notification onClick → switch to day view + highlight task

## Files
- Create: `services/reminderService.ts`
- Modify: `types.ts` (+1 optional field)
- Modify: `TaskEditorCore.tsx` (+reminder field)
- Modify: `App.tsx` (+interval)
- Modify: `db.ts` (no schema change — optional field auto-handled by Dexie)
- Modify: `services/autoBackup.ts` (bump version to 1.2)

## Data Compat
- `reminderOffset` is optional (`number | undefined`)
- v1.1 backup import → reminderOffset = undefined (no reminder)
- v1.2 backup export includes reminderOffset
