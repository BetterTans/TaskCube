# Tasks — 统一 Logger 迁移

> **Goal:** Replace 12 console.log with unified logger. Dev: full output; Prod: warn+error only.

### Task 4.1: Create logger utility
- Create `utils/logger.ts`
- Four levels: debug, info, warn, error
- Prod mode: suppress debug + info
- Prefix: `[NextDo:LEVEL]`
- _Files:_ Create `utils/logger.ts`

### Task 4.2: Migrate db.ts
- 3 console.log → logger.info
- Add import
- _Files:_ `db.ts`

### Task 4.3: Migrate autoBackup.ts
- 6 console.log → logger.info + logger.debug
- 2 console.error → logger.error (keep existing behavior)
- _Files:_ `services/autoBackup.ts`

### Task 4.4: Migrate components
- SettingsModal.tsx: 1 console.log → logger.info
- DayTimeView.tsx: 1 console.log → logger.debug
- _Files:_ `SettingsModal.tsx`, `DayTimeView.tsx`

### Task 4.5: Test & commit
- npx tsc --noEmit
- npm run dev → check console for [NextDo: prefix
- npm run build && npm run preview → verify debug/info suppressed
