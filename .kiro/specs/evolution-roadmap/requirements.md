# Evolution Roadmap — NextDo v3.2 → v4.0

## 版本路线

```
v3.2 (当前) ──→ v3.3 (Level 1) ──→ v3.4 (Level 2) ──→ v4.0 (Level 3)
  已发布          1-3 天             1-2 周              2-4 周
```

## Level 1: 快速补全 (v3.3) — 代码健康 + 体验闭环

| Spec | 描述 | 影响文件 | 数据兼容 |
|------|------|----------|----------|
| `panel-modal-merge` | 合并 Panel + Modal，统一任务编辑 | Panel.tsx, Modal.tsx, App.tsx | 无 schema 变更 |
| `global-search` | 全文搜索（标题/描述/标签/项目） | CommandPalette.tsx, 新 SearchIndex | 无 |
| `tag-management` | 标签管理面板（创建/重命名/删除/颜色） | 新 TagManager.tsx, types.ts | 无 schema 变更 |
| `logger-migration` | console.log → 统一 Logger | 12 处替换 | 无 |

## Level 2: 核心体验 (v3.4) — 可靠性 + 品质感

| Spec | 描述 | 影响文件 | 数据兼容 |
|------|------|----------|----------|
| `undo-redo` | Ctrl+Z 撤销任务操作 | 新 undoStack, db.ts, App.tsx | 需 undo 表 |
| `reminders-notifications` | 浏览器通知 + 任务提醒 | 新 reminderService, Notification API | 需提醒时间字段 |
| `view-transitions` | 视图切换动画 + 微交互 | 各视图组件 + CSS | 无 |
| `dark-mode-polish` | 暗色模式完善 | CSS + 原生系统组件 | 无 |

## Level 3: 差异化竞争 (v4.0) — AI + 深度工作流

| Spec | 描述 | 影响文件 | 数据兼容 |
|------|------|----------|----------|
| `ai-smart-scheduling` | AI 分析空闲推荐时间 | aiService.ts, 新 scheduler | 无 |
| `focus-mode` | 番茄钟 + 任务关联 + 统计 | 新 FocusTimer, 新 focusStats | 需统计表 |
| `habit-tracking` | 周期任务连续完成统计 | 新 habitService, 新 habitView | 需习惯记录表 |
| `markdown-notes` | 任务详情 Markdown 渲染 | TaskDetailPanel, 新 markdown renderer | 无 |

## 数据兼容性承诺

- 所有新字段均有默认值，旧数据导入时自动补全
- 备份格式 `version` 递增（v1.1 → v1.2 → v2.0）
- 旧版本备份文件导入时自动迁移
- IndexedDB schema 升级通过 Dexie version() 平滑迁移
- 不删除任何现有字段，仅追加

## Dependencies

```
Level 1 (可并行):
  panel-modal-merge ─────────────────────┐
  global-search ─────────────────────────┤
  tag-management ────────────────────────┤→ v3.3
  logger-migration ──────────────────────┘

Level 2 (部分依赖 Level 1):
  panel-modal-merge ──→ undo-redo ───────┐
  logger-migration ───→ reminders ───────┤
  (独立)               view-transitions ─┤→ v3.4
  (独立)               dark-mode-polish ─┘

Level 3 (部分依赖 panel-modal-merge + undo-redo):
  panel-modal-merge ──→ ai-scheduling ───┐
  panel-modal-merge ──→ markdown-notes ──┤
  undo-redo ──────────→ focus-mode ──────┤→ v4.0
  (独立)               habit-tracking ───┘
```
