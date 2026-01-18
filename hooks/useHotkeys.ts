import { useEffect, useCallback } from 'react';

type HotkeyCallback = (event: KeyboardEvent) => void;
type HotkeysMap = { [key: string]: HotkeyCallback };

/**
 * 自定义 Hook，用于注册全局键盘快捷键。
 * @param hotkeys - 快捷键映射表，例如：{ 'ctrl+k': callback, 'n': callback }
 * @param deps - 依赖项数组，当依赖变化时会重新注册事件
 */
export const useHotkeys = (hotkeys: HotkeysMap, deps: any[] = []) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略在 input, textarea, select 元素中的快捷键，除非是 Escape
    const target = event.target as HTMLElement;
    if (
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) &&
      event.key !== 'Escape'
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey;
    const isMeta = event.metaKey; // Command key on Mac
    const isShift = event.shiftKey;

    for (const hotkeyString in hotkeys) {
      const parts = hotkeyString.toLowerCase().split('+');
      const requiredKey = parts.pop();
      
      if (requiredKey !== key) continue;

      const hasCtrl = parts.includes('ctrl');
      const hasMeta = parts.includes('meta');
      const hasShift = parts.includes('shift');

      if (
        (isCtrl === hasCtrl || isMeta === hasMeta) && // 支持 Cmd+K / Ctrl+K
        isShift === hasShift
      ) {
        event.preventDefault();
        hotkeys[hotkeyString](event);
        return;
      }
    }
  }, [hotkeys, ...deps]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
