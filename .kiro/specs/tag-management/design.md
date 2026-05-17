# Design — 标签管理面板

## Architecture

新建 TagManager 组件，从设置页面入口打开。

```
SettingsModal.tsx
  └── Tab: "标签管理" (new)
       └── TagManager.tsx
            ├── Tag list (sorted by usage count)
            │   ├── TagItem: color dot + name + count + edit/delete btns
            │   └── InlineAdd: input at bottom
            ├── ColorPicker (12-color grid)
            └── MergeDialog (select target tag)
```

## Component API

```typescript
interface TagManagerProps {
  tasks: Task[];
  onTagRename: (oldName: string, newName: string) => Promise<void>;
  onTagDelete: (name: string) => Promise<void>;
  onTagMerge: (source: string, target: string) => Promise<void>;
  onTagColorChange: (name: string, color: string) => void;
}

interface TagInfo {
  name: string;
  count: number;
  color: string;
}
```

## Data Model

标签颜色存储在 localStorage：
```typescript
// STORAGE_KEYS.TAG_COLORS = 'nextdo_tag_colors'
// Format: { "tagname": "#3B82F6", "演示": "#10B981", ... }
```

标签操作对 task.tags 的影响：
- 重命名：遍历 tasks，`t.tags = t.tags.map(tag => tag === oldName ? newName : tag)`
- 删除：遍历 tasks，`t.tags = t.tags.filter(tag => tag !== name)`
- 合并：遍历 tasks，`t.tags = t.tags.map(tag => tag === source ? target : tag)`

## Design Decisions

### D1: 标签不独立存储
标签信息从 task.tags 数组中动态聚合，不建新表。简化数据模型。

### D2: 颜色存 localStorage
颜色数据量小（< 50 个标签），localStorage 够用。备份导出时不单独导出标签颜色（重新 hash 生成也可）。

### D3: 批量操作优化
重命名/删除/合并使用 Dexie `db.transaction` + `Collection.modify()` 批量更新，避免逐条更新。

## Files

| File | Action | Lines |
|------|--------|-------|
| `components/TagManager.tsx` | Create | ~180 |
| `components/SettingsModal.tsx` | Add tab | +30 |
| `config/storageKeys.ts` | Add key | +1 |
