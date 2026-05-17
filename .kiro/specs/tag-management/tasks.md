# Tasks — 标签管理面板

> **Goal:** Tag CRUD panel in Settings, with rename/delete/merge/color support.

### Task 3.1: Add TAG_COLORS storage key
- Add `TAG_COLORS` to `config/storageKeys.ts`
- Default colors from existing hash-based palette
- _Files:_ `config/storageKeys.ts`

### Task 3.2: Create TagManager component
- Create `components/TagManager.tsx`
- List all tags sorted by usage count
- Each tag: color dot, name (editable), count, edit/delete buttons
- "New tag" input at bottom
- Color picker (12-color grid) per tag
- _Files:_ Create `components/TagManager.tsx`

### Task 3.3: Implement bulk operations
- Tag rename: `Collection.modify()` across all tasks
- Tag delete: remove from all tasks + confirm dialog
- Tag merge: replace source tag with target in all tasks
- All operations in a single Dexie transaction
- _Files:_ `TagManager.tsx`

### Task 3.4: Add TagManager tab to SettingsModal
- New tab "标签" in SettingsModal tab bar
- Render TagManager with tasks from props
- Wire callbacks to db operations
- _Files:_ `components/SettingsModal.tsx`

### Task 3.5: Test & commit
- Create tag → appears in task detail tag input
- Rename tag → all tasks updated
- Delete tag → removed from all tasks
- Merge tag → source replaced with target
- Verify color persistence across reloads
