# Design — 统一 Logger 迁移

## Architecture

```typescript
// utils/logger.ts

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const isProduction = typeof import.meta !== 'undefined' && import.meta.env?.PROD;

function log(level: LogLevel, ...args: unknown[]) {
  if (isProduction && LEVELS[level] < LEVELS['warn']) return;
  const prefix = `[NextDo:${level.toUpperCase()}]`;
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(prefix, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => log('debug', ...args),
  info:  (...args: unknown[]) => log('info', ...args),
  warn:  (...args: unknown[]) => log('warn', ...args),
  error: (...args: unknown[]) => log('error', ...args),
};
```

## Migration Map

| File | Line | Current | → | Logger |
|------|------|---------|---|--------|
| db.ts | 56 | `console.log("Upgrading...")` | → | `logger.info` |
| db.ts | 76 | `console.log("Database upgrade...")` | → | `logger.info` |
| db.ts | 96 | `console.log("Populating...")` | → | `logger.info` |
| autoBackup.ts | 16 | `console.log("Persistent storage...")` | → | `logger.info` |
| autoBackup.ts | 35 | `console.log("showDirectoryPicker...")` | → | `logger.debug` |
| autoBackup.ts | 38 | `console.log("showDirectoryPicker...")` | → | `logger.debug` |
| autoBackup.ts | 118 | `console.log("No saved...")` | → | `logger.debug` |
| autoBackup.ts | 133 | `console.log("Auto-backup written")` | → | `logger.info` |
| autoBackup.ts | 215 | `console.log("Auto-restore...")` | → | `logger.info` |
| autoBackup.ts | 254 | `console.log("Auto-restore...")` | → | `logger.info` |
| SettingsModal.tsx | 185 | `console.log("Detected old...")` | → | `logger.info` |
| DayTimeView.tsx | 182 | `console.log("Started dragging...")` | → | `logger.debug` |

## Design Decisions

### D1: 不引入依赖
自建 20 行 logger，零依赖。

### D2: 生产静默 debug/info
生产模式下只输出 warn 和 error。12 处中的 11 处迁移为 info/debug，生产环境自动静默。

### D3: console.error 保留原有
error 级别保持 console.error 行为（包括 stack trace）。

## Files

| File | Action | Lines |
|------|--------|-------|
| `utils/logger.ts` | Create | ~20 |
| `db.ts` | Modify | -3 +3 |
| `services/autoBackup.ts` | Modify | -7 +8 |
| `components/SettingsModal.tsx` | Modify | -1 +2 |
| `components/DayTimeView.tsx` | Modify | -1 +1 |
