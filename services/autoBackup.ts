import { logger } from '../utils/logger';
import { db } from '../db';
import { STORAGE_KEYS } from '../config/storageKeys';
import { TaskProgress } from '../types';


const BACKUP_FILENAME = 'nextdo-auto-backup.json';
const DEBOUNCE_MS = 5000;

let backupTimer: ReturnType<typeof setTimeout> | null = null;
let directoryHandle: FileSystemDirectoryHandle | null = null;
let backupDirName: string = '';

// --- navigator.storage.persist() ---
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist();
    logger.info(`Persistent storage: ${granted ? 'granted' : 'denied'}`);
    return granted;
  }
  return false;
};

// --- File System Access API ---
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

// Returns current backup state info for UI display
export const getBackupState = (): { configured: boolean; dirName: string } => {
  return { configured: directoryHandle !== null, dirName: backupDirName };
};

// Try showDirectoryPicker — works reliably on Windows Chrome/Edge, may fail on macOS
export const selectBackupDirectoryNative = async (): Promise<{ success: boolean; dirName?: string; error?: string }> => {
  try {
    logger.debug('showDirectoryPicker: calling with mode=readwrite');
    directoryHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    backupDirName = directoryHandle.name;
    logger.info('showDirectoryPicker: selected directory', backupDirName);

    await saveDirectoryHandle(directoryHandle);
    try {
      await performBackup();
    } catch (backupErr) {
      logger.error('Initial backup write failed:', backupErr);
      return { success: false, error: '备份文件写入失败，请检查文件夹权限' };
    }
    return { success: true, dirName: backupDirName };
  } catch (e) {
    logger.error('showDirectoryPicker error:', e, 'name:', (e as DOMException)?.name, 'message:', (e as Error)?.message);
    if (e instanceof DOMException) {
      if (e.name === 'AbortError') {
        return { success: false, error: 'macOS Chrome 可能不支持此功能，请尝试手动导出备份或使用 Edge 浏览器' };
      }
      if (e.name === 'NotAllowedError') {
        return { success: false, error: '浏览器拒绝了文件夹访问权限' };
      }
    }
    return { success: false, error: `选择文件夹失败: ${(e as Error)?.message || String(e)}` };
  }
};

// Generate backup JSON string
export const generateBackupData = async (): Promise<string> => {
  const tasks = await db.tasks.toArray();
  const projects = await db.projects.toArray();
  const recurringRules = await db.recurringRules.toArray();

  const settingsData = {
    aiSettings: localStorage.getItem(STORAGE_KEYS.AI_SETTINGS),
    theme: localStorage.getItem(STORAGE_KEYS.THEME),
    hotkeys: localStorage.getItem(STORAGE_KEYS.HOTKEYS),
    sidebarCollapsed: localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED),
    tableFilters: localStorage.getItem(STORAGE_KEYS.TABLE_FILTERS),
  };

  const backupData = {
    version: '1.1',
    exportedAt: new Date().toISOString(),
    database: { tasks, projects, recurringRules },
    localStorage: settingsData,
  };

  return JSON.stringify(backupData);
};

export const clearBackupDirectory = async () => {
  directoryHandle = null;
  localStorage.removeItem(STORAGE_KEYS.BACKUP_DIR_HANDLE);
  await db.table('_meta').delete('backupDirHandle');
};

// --- Directory handle persistence ---
const saveDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
  // Store in IndexedDB (survives longer than localStorage)
  try {
    await db.table('_meta').put({ id: 'backupDirHandle', handle });
  } catch (e) {
    logger.error('Failed to save directory handle:', e);
  }
};

const loadDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const record = await db.table('_meta').get('backupDirHandle');
    if (record?.handle) {
      directoryHandle = record.handle as FileSystemDirectoryHandle;
      // Verify the handle is still valid by requesting permission
      const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        return directoryHandle;
      }
      // Permission not granted, need to re-ask
      directoryHandle = null;
      return null;
    }
  } catch (e) {
    // _meta table might not exist yet
    logger.debug('No saved directory handle found');
  }
  return null;
};

// --- Write backup to file ---
const performBackup = async () => {
  if (!directoryHandle) return;

  try {
    const jsonString = await generateBackupData();
    const fileHandle = await directoryHandle.getFileHandle(BACKUP_FILENAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonString);
    await writable.close();
    logger.info('Auto-backup written successfully');
  } catch (e) {
    logger.error('Auto-backup write failed:', e);
    // Permission might have been revoked
    if (e instanceof DOMException && e.name === 'NotAllowedError') {
      directoryHandle = null;
    }
  }
};

// --- Debounced backup trigger ---
export const triggerBackup = () => {
  if (!directoryHandle) return;
  if (backupTimer) {
    clearTimeout(backupTimer);
  }
  backupTimer = setTimeout(() => {
    backupTimer = null;
    performBackup();
  }, DEBOUNCE_MS);
};

// --- beforeunload immediate backup ---
export const setupBeforeUnloadBackup = () => {
  window.addEventListener('beforeunload', () => {
    if (!directoryHandle) return;
    // beforeunload is synchronous only, we can't use async APIs
    // But we can try a synchronous approach using a Blob URL
    // Unfortunately, File System Access API is async-only
    // So we trigger the debounced backup as early as possible
    // The 5s debounce backup should have already saved before this
    // Just force a final backup attempt
    if (backupTimer) {
      clearTimeout(backupTimer);
      backupTimer = null;
    }
    performBackup();
  });
};

// --- Initialize on app startup ---
export const initAutoBackup = async () => {
  await requestPersistentStorage();

  // Ensure _meta table exists in Dexie
  if (!db.tables.some(t => t.name === '_meta')) {
    // We need to add this table via a version upgrade
    // But we can't modify the DB class at runtime
    // Instead, use localStorage as fallback for handle storage
  }

  const handle = await loadDirectoryHandle();
  if (handle) {
    directoryHandle = handle;
    setupBeforeUnloadBackup();
    return true;
  }
  return false;
};

// --- Restore from backup file ---
export const checkAndRestoreBackup = async (): Promise<boolean> => {
  // Check if IndexedDB has any data
  const taskCount = await db.tasks.count();
  if (taskCount > 0) return false; // Data exists, no need to restore

  // Try to load directory handle
  const handle = await loadDirectoryHandle();
  if (!handle) return false;

  try {
    const fileHandle = await handle.getFileHandle(BACKUP_FILENAME);
    const file = await fileHandle.getFile();
    const jsonString = await file.text();
    const backupData = JSON.parse(jsonString);

    if (!backupData.database) return false;

    // Compatibility: handle v1.0 data without progress field
    let tasksToImport = backupData.database.tasks || [];
    const today = new Date().toISOString().split('T')[0];
    if (backupData.version === '1.0' || !tasksToImport.some((task: any) => task.progress !== undefined)) {
      logger.info('Auto-restore: detected old data format, adding progress field...');
      tasksToImport = tasksToImport.map((task: any) => {
        if (!task.progress) {
          if (task.completed) {
            task.progress = TaskProgress.COMPLETED;
          } else if (task.endDate && task.endDate < today) {
            task.progress = TaskProgress.DELAYED;
          } else {
            task.progress = TaskProgress.INITIAL;
          }
        }
        return task;
      });
    }

    // Restore database
    await db.transaction('rw', db.tasks, db.projects, db.recurringRules, async () => {
      await Promise.all([
        db.tasks.clear(),
        db.projects.clear(),
        db.recurringRules.clear(),
      ]);
      await Promise.all([
        db.tasks.bulkAdd(tasksToImport),
        db.projects.bulkAdd(backupData.database.projects || []),
        db.recurringRules.bulkAdd(backupData.database.recurringRules || []),
      ]);
    });

    // Restore localStorage settings
    if (backupData.localStorage) {
      const ls = backupData.localStorage;
      if (ls.aiSettings) localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, ls.aiSettings);
      if (ls.theme) localStorage.setItem(STORAGE_KEYS.THEME, ls.theme);
      if (ls.hotkeys) localStorage.setItem(STORAGE_KEYS.HOTKEYS, ls.hotkeys);
      if (ls.sidebarCollapsed) localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, ls.sidebarCollapsed);
      if (ls.tableFilters) localStorage.setItem(STORAGE_KEYS.TABLE_FILTERS, ls.tableFilters);
    }

    logger.info('Auto-restore from backup completed');
    return true;
  } catch (e) {
    logger.error('Auto-restore failed:', e);
    return false;
  }
};

export const isBackupConfigured = (): boolean => {
  return directoryHandle !== null;
};