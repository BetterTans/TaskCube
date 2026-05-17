import { useState, useCallback, useRef } from 'react';

interface UndoEntry {
  id: string;
  description: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
}

interface UseUndoStackReturn {
  push: (entry: UndoEntry) => void;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  lastDescription: string | null;
}

export function useUndoStack(maxSize = 50): UseUndoStackReturn {
  const stackRef = useRef<UndoEntry[]>([]);
  const pointerRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lastDescription, setLastDescription] = useState<string | null>(null);

  const updateState = useCallback(() => {
    setCanUndo(pointerRef.current >= 0);
    setCanRedo(pointerRef.current < stackRef.current.length - 1);
    setLastDescription(pointerRef.current >= 0 ? stackRef.current[pointerRef.current].description : null);
  }, []);

  const push = useCallback((entry: UndoEntry) => {
    // Discard any redo entries ahead of pointer
    stackRef.current = stackRef.current.slice(0, pointerRef.current + 1);
    // Add new entry
    stackRef.current.push(entry);
    // Trim to max size
    if (stackRef.current.length > maxSize) {
      stackRef.current = stackRef.current.slice(-maxSize);
    }
    pointerRef.current = stackRef.current.length - 1;
    updateState();
  }, [maxSize, updateState]);

  const undo = useCallback(async () => {
    if (pointerRef.current < 0) return;
    const entry = stackRef.current[pointerRef.current];
    pointerRef.current--;
    await entry.undo();
    updateState();
  }, [updateState]);

  const redo = useCallback(async () => {
    if (pointerRef.current >= stackRef.current.length - 1) return;
    pointerRef.current++;
    const entry = stackRef.current[pointerRef.current];
    await entry.redo();
    updateState();
  }, [updateState]);

  return { push, undo, redo, canUndo, canRedo, lastDescription };
}
