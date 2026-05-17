export const STORAGE_KEYS = {
  AI_SETTINGS: 'nextdo-ai-settings',
  THEME: 'nextdo-theme',
  HOTKEYS: 'nextdo-hotkeys',
  SIDEBAR_COLLAPSED: 'nextdo-sidebar-collapsed',
  TABLE_FILTERS: 'nextdo-table-filters',
  TAG_COLORS: 'nextdo-tag-colors',
  BACKUP_DIR_HANDLE: 'nextdo-backup-dir-handle',
  // Legacy migration keys (v1 data format)
  LEGACY_TASKS_FULL: 'gemini-tasks-full',
  LEGACY_RECURRING_RULES: 'gemini-recurring-rules',
  LEGACY_PROJECTS: 'gemini-projects',
} as const;
