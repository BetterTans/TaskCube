import React, { useState, useMemo } from 'react';
import { Task } from '../types.ts';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { db } from '../db.ts';
import { STORAGE_KEYS } from '../config/storageKeys.ts';
import { getTagColor } from '../config/taskColors.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';

interface TagsManagerProps {
  tasks: Task[];
  addToast: (msg: string, type: 'success' | 'error' | 'warning') => string;
}

export const TagsManager: React.FC<TagsManagerProps> = ({ tasks, addToast }) => {
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      for (const tag of t.tags || []) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, color: getTagColor(name) }));
  }, [tasks]);

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    if (tags.find(t => t.name.toLowerCase() === name.toLowerCase())) {
      addToast('标签已存在', 'warning');
      return;
    }
    setNewTag('');
    addToast(`标签「${name}」已创建`, 'success');
  };

  const startRename = (tag: string) => {
    setEditingTag(tag);
    setEditValue(tag);
  };

  const saveRename = async () => {
    const oldName = editingTag;
    const newName = editValue.trim();
    if (!oldName || !newName || oldName === newName) { setEditingTag(null); return; }
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.toCollection().modify(task => {
        if (task.tags) {
          task.tags = task.tags.map(t => t === oldName ? newName : t);
        }
      });
    });
    setEditingTag(null);
    addToast(`标签「${oldName}」→「${newName}」`, 'success');
  };

  const deleteTag = async (name: string) => {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.toCollection().modify(task => {
        if (task.tags) {
          task.tags = task.tags.filter(t => t !== name);
        }
      });
    });
    setConfirmDelete(null);
    addToast(`标签「${name}」已删除`, 'success');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={newTag} onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
          placeholder="新建标签..."
          className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"/>
        <button onClick={addTag} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600"><Plus size={16}/></button>
      </div>
      <div className="space-y-1 max-h-[40vh] overflow-y-auto">
        {tags.map(({ name, count, color }) => (
          <div key={name} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 group">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            {editingTag === name ? (
              <input value={editValue} onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingTag(null); }}
                onBlur={saveRename}
                className="flex-1 bg-transparent text-sm outline-none border-b border-indigo-500" autoFocus/>
            ) : (
              <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
            )}
            <span className="text-xs text-gray-400">{count}</span>
            <button onClick={() => startRename(name)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-500"><Pencil size={14}/></button>
            <button onClick={() => setConfirmDelete(name)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
          </div>
        ))}
        {tags.length === 0 && <p className="text-sm text-gray-400 text-center py-8">暂无标签</p>}
      </div>
      <ConfirmDialog isOpen={!!confirmDelete} title="删除标签"
        message={`确定删除标签「${confirmDelete}」吗？将从所有任务中移除。`}
        onConfirm={() => confirmDelete && deleteTag(confirmDelete)}
        onCancel={() => setConfirmDelete(null)} />
    </div>
  );
};
