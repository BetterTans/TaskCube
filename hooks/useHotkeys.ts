import { useEffect, useCallback } from 'react';

/**
 * 定义快捷键回调函数的类型。
 * @param {KeyboardEvent} event - 键盘事件对象。
 */
type HotkeyCallback = (event: KeyboardEvent) => void;

/**
 * 定义快捷键映射表的类型。
 * 键是快捷键字符串 (例如 'ctrl+k'), 值是回调函数。
 */
type HotkeysMap = { [key: string]: HotkeyCallback };

/**
 * 一个自定义 React Hook，用于方便地注册全局键盘快捷键。
 * 
 * @param {HotkeysMap} hotkeys - 一个快捷键映射对象。
 *   键是描述快捷键的字符串 (例如 'meta+k', 'shift+n', 'escape')。
 *   值是当快捷键被按下时要执行的回调函数。
 * @param {any[]} deps - 依赖项数组。当这个数组中的任何值发生变化时，
 *   `useHotkeys` 会重新注册键盘事件监听器，以确保回调函数使用的是最新的状态或 props。
 */
export const useHotkeys = (hotkeys: HotkeysMap, deps: any[] = []) => {
  
  // 使用 useCallback 包装事件处理函数，以避免在每次渲染时都创建新函数。
  // 仅当 hotkeys 或 deps 数组中的依赖项发生变化时，才会重新创建此函数。
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const target = event.target as HTMLElement;

    // 智能忽略：如果事件的目标是输入框、文本区域或可编辑元素，则不触发快捷键，
    // 这样可以避免在输入文字时意外触发快捷键。
    // 'Escape' 键是一个例外，通常用于关闭模态框等，所以不应被忽略。
    if (
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) &&
      event.key !== 'Escape'
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isCtrl = event.ctrlKey;
    const isMeta = event.metaKey; // 在 macOS 上是 Command 键
    const isShift = event.shiftKey;

    // 遍历传入的快捷键映射
    for (const hotkeyString in hotkeys) {
      // 解析快捷键字符串，例如 'meta+k' -> ['meta', 'k']
      const parts = hotkeyString.toLowerCase().split('+');
      const requiredKey = parts.pop(); // 最后一个部分是主键，例如 'k'
      
      // 如果按下的主键不匹配，则跳过此快捷键
      if (requiredKey !== key) continue;

      // 检查修饰键 (ctrl, meta, shift) 是否匹配
      const hasCtrl = parts.includes('ctrl');
      const hasMeta = parts.includes('meta');
      const hasShift = parts.includes('shift');

      // 关键匹配逻辑：
      // (isCtrl === hasCtrl || isMeta === hasMeta) 确保了在 Mac 上 Cmd+K 和在 Windows/Linux 上 Ctrl+K 都能正常工作
      if (
        (isCtrl === hasCtrl || isMeta === hasMeta) &&
        isShift === hasShift
      ) {
        event.preventDefault(); // 阻止浏览器的默认行为，例如 Ctrl+S 保存页面
        hotkeys[hotkeyString](event); // 执行回调函数
        return; // 找到并执行了一个匹配项后，停止遍历
      }
    }
  }, [hotkeys, ...deps]); // deps 数组确保了 handleKeyDown 能访问到最新的 hotkeys 和外部依赖

  // 使用 useEffect 在组件挂载时添加键盘事件监听器，
  // 并在组件卸载时移除它，以防止内存泄漏。
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]); // 依赖项是 useCallback 返回的稳定函数
};
